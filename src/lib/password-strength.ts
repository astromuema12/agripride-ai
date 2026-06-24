import type { PasswordStrengthResult } from '@/types';

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'letmein', 'dragon', 'master', 'admin', 'welcome',
  'login', 'princess', 'football', 'shadow', 'sunshine', 'trustno1',
  'passw0rd', 'p@ssword', 'P@ssw0rd',
]);

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const cracks: string[] = [];
  const suggestions: string[] = [];

  if (password.length < 8) {
    cracks.push('At least 8 characters');
  } else if (password.length < 12) {
    suggestions.push('Use 12+ characters for better security');
  }

  if (!/[A-Z]/.test(password)) {
    cracks.push('Add an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    cracks.push('Add a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    cracks.push('Add a number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    cracks.push('Add a special character');
  }

  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeated characters like "aaa"');
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    suggestions.push('Add numbers and symbols');
  }
  if (/^[0-9]+$/.test(password)) {
    suggestions.push('Add letters for a stronger password');
  }
  if (password.toLowerCase() === password) {
    suggestions.push('Add uppercase letters');
  }
  if (password === password.toUpperCase()) {
    suggestions.push('Add lowercase letters');
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(password)) {
    cracks.push('This password is too common');
  }

  if (/(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    suggestions.push('Avoid sequential numbers like "123"');
  }
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    suggestions.push('Avoid sequential letters like "abc"');
  }
  if (/(.)\1{3,}/.test(password)) {
    cracks.push('Avoid long repeated characters');
  }

  let score = 0;
  if (password.length >= 8) score += 15;
  if (password.length >= 10) score += 5;
  if (password.length >= 12) score += 5;
  if (password.length >= 14) score += 5;
  if (password.length >= 16) score += 5;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

  if (password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 10;
  }

  if (score >= 80) {
    return { score, label: 'very_strong', color: 'text-emerald-600', cracks, suggestions };
  }
  if (score >= 60) {
    return { score, label: 'strong', color: 'text-emerald-500', cracks, suggestions };
  }
  if (score >= 40) {
    return { score, label: 'good', color: 'text-blue-500', cracks, suggestions };
  }
  if (score >= 20) {
    return { score, label: 'fair', color: 'text-amber-500', cracks, suggestions };
  }
  return { score, label: 'weak', color: 'text-red-500', cracks, suggestions };
}
