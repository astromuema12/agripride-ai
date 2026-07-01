import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedSchemes: [],
    allowedSchemesByTag: {},
  }).trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return result as T;
}

const SAFE_URI_PROTOCOLS = ['mailto:', 'tel:', 'http://', 'https://'];

export function validateSafeUri(uri: string): string {
  const lower = uri.toLowerCase().trim();
  for (const protocol of SAFE_URI_PROTOCOLS) {
    if (lower.startsWith(protocol)) return uri.slice(0, 2000);
  }
  return '';
}

export function validateEmailHref(email: string): string {
  const cleaned = email.replace(/[^a-zA-Z0-9.@+\-_]/g, '');
  return `mailto:${cleaned}`;
}

export function validateTelHref(phone: string): string {
  const cleaned = phone.replace(/[^0-9+\-() ]/g, '');
  return `tel:${cleaned}`;
}

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
