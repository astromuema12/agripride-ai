import { en } from './translations/en';
import { sw } from './translations/sw';

type TranslationDict = Record<string, unknown>;

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function serverT(
  locale: string,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict: TranslationDict = locale === 'sw' ? sw : en;
  let value = getNestedValue(dict, key);
  if (value === undefined || value === null) return key;
  if (Array.isArray(value)) {
    value = JSON.stringify(value);
  }
  let str = String(value);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

export function serverTArray(locale: string, key: string): string[] {
  const dict: TranslationDict = locale === 'sw' ? sw : en;
  const value = getNestedValue(dict, key);
  if (Array.isArray(value)) return value.map(String);
  return [];
}
