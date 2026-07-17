import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { serverT } from '@/lib/i18n/server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function handler(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string | null;

  if (!file) {
    return apiError(400, serverT('en', 'upload.noFile'));
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return apiError(400, serverT('en', 'upload.invalidFileType', { types: ALLOWED_MIME_TYPES.join(', ') }));
  }

  if (file.size > MAX_FILE_SIZE) {
    return apiError(400, serverT('en', 'upload.fileTooLarge', { size: String(MAX_FILE_SIZE / 1024 / 1024) }));
  }

  if (file.size === 0) {
    return apiError(400, serverT('en', 'upload.fileEmpty'));
  }

  if (file.size < 100) {
    return apiError(400, serverT('en', 'upload.fileTooSmall'));
  }

  if (serverSupabase) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return apiError(401, 'Unauthorized');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate file signature (magic bytes) for images
      const header = buffer.slice(0, 4).toString('hex');
      const validHeaders: Record<string, string[]> = {
        'image/jpeg': ['ffd8'],
        'image/png': ['89504e47'],
        'image/webp': ['52494646'],
      };
      const validHeader = validHeaders[file.type];
      if (validHeader && !validHeader.some((h) => header.startsWith(h))) {
        logger.warn('File content mismatch with declared MIME type', {
          component: 'upload',
          metadata: { declaredType: file.type, header, fileName: file.name },
        });
        return apiError(400, serverT('en', 'upload.contentMismatch'));
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from('disease-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        logger.error('Storage upload failed', {
          component: 'upload',
          error,
          metadata: { fileName },
        });
        return apiError(500, serverT('en', 'upload.uploadFailed'));
      }

      const { data: { publicUrl } } = supabase.storage
        .from('disease-images')
        .getPublicUrl(data.path);

      await writeAuditLog({
        user_id: session.user.id,
        action: 'file_upload',
        resource: 'storage',
        resource_id: data.path,
        details: { fileType: file.type, fileSize: file.size },
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      });

      return apiSuccess({ url: publicUrl, path: data.path });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  await writeAuditLog({
    user_id: userId || 'anonymous',
    action: 'file_upload',
    resource: 'storage',
    details: { fileType: file.type, fileSize: file.size, mock: true },
    ip_address: req.headers.get('x-forwarded-for') || undefined,
  });

  return apiSuccess({ url: dataUrl, path: null });
}

export const POST = withErrorHandling(handler);
