import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadSchema = z.object({
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string | null;

  const parsed = UploadSchema.safeParse({ userId: userId || undefined });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues.map(e => e.message).join(', ') }, { status: 400 });
  }

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json({
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: 'File is empty' }, { status: 400 });
  }

  if (serverSupabase) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from('disease-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        return Response.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('disease-images')
        .getPublicUrl(data.path);

      writeAuditLog({
        user_id: session.user.id,
        action: 'file_upload',
        resource: 'storage',
        resource_id: data.path,
        details: { fileType: file.type, fileSize: file.size },
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      });

      return Response.json({ url: publicUrl, path: data.path });
    }
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  writeAuditLog({
    user_id: userId || 'anonymous',
    action: 'file_upload',
    resource: 'storage',
    details: { fileType: file.type, fileSize: file.size, mock: true },
    ip_address: req.headers.get('x-forwarded-for') || undefined,
  });

  return Response.json({ url: dataUrl, path: null });
}
