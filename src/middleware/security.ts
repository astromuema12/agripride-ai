export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUpload(
  file: { mimeType: string; size: number },
  options?: { allowedTypes?: string[]; maxSize?: number }
): { valid: boolean; error?: string } {
  const allowed = options?.allowedTypes || ALLOWED_IMAGE_TYPES;
  const maxSize = options?.maxSize || MAX_FILE_SIZE;

  if (!validateFileType(file.mimeType, allowed)) {
    return { valid: false, error: `File type ${file.mimeType} is not allowed. Allowed: ${allowed.join(', ')}` };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  return { valid: true };
}

export function generateCsrfToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
