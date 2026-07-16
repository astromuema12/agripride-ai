import type { PasswordStrengthResult } from '@/types';
import { serverT } from './i18n/server';

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'letmein', 'dragon', 'master', 'admin', 'welcome',
  'login', 'princess', 'football', 'shadow', 'sunshine', 'trustno1',
  'passw0rd', 'p@ssword', 'P@ssw0rd',
]);

export function evaluatePasswordStrength(password: string, locale?: string): PasswordStrengthResult {
  const cracks: string[] = [];
  const suggestions: string[] = [];

  if (password.length < 8) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.atLeast8'));
  } else if (password.length < 12) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.use12Plus'));
  }

  if (!/[A-Z]/.test(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.uppercase'));
  }
  if (!/[a-z]/.test(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.lowercase'));
  }
  if (!/[0-9]/.test(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.number'));
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.special'));
  }

  if (/(.)\1{2,}/.test(password)) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.avoidRepeated'));
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.addNumbersSymbols'));
  }
  if (/^[0-9]+$/.test(password)) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.addLetters'));
  }
  if (password.toLowerCase() === password) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.uppercase'));
  }
  if (password === password.toUpperCase()) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.lowercase'));
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.tooCommon'));
  }

  if (/(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.avoidSequentialNumbers'));
  }
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    suggestions.push(serverT(locale || 'en', 'passwordStrength.suggestions.avoidSequentialLetters'));
  }
  if (/(.)\1{3,}/.test(password)) {
    cracks.push(serverT(locale || 'en', 'passwordStrength.cracks.longRepeated'));
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
