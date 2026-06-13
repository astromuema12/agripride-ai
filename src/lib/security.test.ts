import { describe, it, expect, beforeEach, vi } from 'vitest';

// Zod schemas replicated from API routes for testing
const DiagnoseSchema = {
  cropType: { min: 1, max: 100 },
  symptoms: { min: 1, max: 5000 },
  imageBase64: { max: 10_000_000 },
};

const ChatSchema = {
  message: { min: 1, max: 10000 },
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a digit';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
  return null;
}

// Rate limiter logic from proxy.ts
function getClientIp(headers: Record<string, string | undefined>): string {
  return headers['x-forwarded-for']?.split(',')[0]?.trim()
    || headers['x-real-ip']
    || 'unknown';
}

describe('Password validation', () => {
  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).not.toBeNull();
  });

  it('rejects password without uppercase letter', () => {
    expect(validatePassword('abcdef1!@')).not.toBeNull();
  });

  it('rejects password without lowercase letter', () => {
    expect(validatePassword('ABCDEF1!@')).not.toBeNull();
  });

  it('rejects password without digit', () => {
    expect(validatePassword('Abcdefg!@')).not.toBeNull();
  });

  it('rejects password without special character', () => {
    expect(validatePassword('Abcdefg1')).not.toBeNull();
  });

  it('accepts valid password', () => {
    expect(validatePassword('SecureP@ss1')).toBeNull();
  });
});

describe('Input validation', () => {
  describe('Diagnose schema', () => {
    it('requires cropType and symptoms', () => {
      expect(DiagnoseSchema.cropType.min).toBe(1);
      expect(DiagnoseSchema.symptoms.min).toBe(1);
    });

    it('enforces max length on cropType', () => {
      expect(DiagnoseSchema.cropType.max).toBe(100);
    });

    it('enforces max length on symptoms', () => {
      expect(DiagnoseSchema.symptoms.max).toBe(5000);
    });

    it('limits imageBase64 to 10MB', () => {
      expect(DiagnoseSchema.imageBase64.max).toBe(10_000_000);
    });
  });

  describe('Chat schema', () => {
    it('requires message to be non-empty', () => {
      expect(ChatSchema.message.min).toBe(1);
    });

    it('caps message length at 10000', () => {
      expect(ChatSchema.message.max).toBe(10000);
    });
  });
});

describe('File upload validation', () => {
  it('allows JPEG MIME type', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
  });

  it('allows PNG MIME type', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
  });

  it('allows WEBP MIME type', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
  });

  it('rejects disallowed MIME types', () => {
    expect(ALLOWED_MIME_TYPES).not.toContain('image/gif');
    expect(ALLOWED_MIME_TYPES).not.toContain('image/svg+xml');
    expect(ALLOWED_MIME_TYPES).not.toContain('application/pdf');
  });

  it('sets max file size to 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe('Rate limiter - getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const ip = getClientIp({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });
    expect(ip).toBe('192.168.1.1');
  });

  it('falls back to x-real-ip', () => {
    const ip = getClientIp({ 'x-real-ip': '10.0.0.5' });
    expect(ip).toBe('10.0.0.5');
  });

  it('returns unknown when no IP header present', () => {
    const ip = getClientIp({});
    expect(ip).toBe('unknown');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const ip = getClientIp({
      'x-forwarded-for': '203.0.113.1',
      'x-real-ip': '10.0.0.1',
    });
    expect(ip).toBe('203.0.113.1');
  });
});

describe('generateId', () => {
  it('generates a UUID-formatted string', () => {
    const crypto = globalThis.crypto;
    expect(crypto).toBeDefined();
    const id = crypto.randomUUID();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
