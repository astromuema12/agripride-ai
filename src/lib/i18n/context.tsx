'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Language } from './types';
import { en, type Translations } from './translations/en';
import { sw } from './translations/sw';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'agripride-language';

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

const translationsMap: Record<Language, Translations> = {
  en,
  sw,
};

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'en' || stored === 'sw') return stored;

    const languages = navigator.languages || [navigator.language];
    for (const lang of languages) {
      const code = lang.toLowerCase().slice(0, 2);
      if (code === 'sw') return 'sw';
    }
  } catch {
    // localStorage unavailable or error
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(detectBrowserLanguage());
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Silently fail
    }
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const translations = translationsMap[language];
      const value = getNestedValue(translations, path);
      if (typeof value === 'string') {
        return interpolate(value, params);
      }
      const fallback = getNestedValue(en, path);
      if (typeof fallback === 'string') {
        return interpolate(fallback, params);
      }
      return path;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations: translationsMap[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
