'use client';

import { useI18n } from '@/lib/i18n';

const localeMap: Record<string, string> = {
  en: 'en-US',
  sw: 'sw-KE',
};

export function useFormat() {
  const { language } = useI18n();

  function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = localeMap[language] || 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(new Date(date));
  }

  function formatDateShort(date: string | Date): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  function formatTime(date: string | Date): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  function formatDateTime(date: string | Date): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  }

  function formatCurrency(amount: number, currency = 'KES'): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatNumber(num: number): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  }

  function formatPercentage(num: number): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  }

  function formatCompact(num: number): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }

  function timeAgo(date: string | Date): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return formatDate(date);
  }

  function dayOfWeek(date: string | Date): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(date));
  }

  function monthDay(date: string | Date): string {
    const locale = localeMap[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(date));
  }

  return {
    formatDate,
    formatDateShort,
    formatTime,
    formatDateTime,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatCompact,
    timeAgo,
    dayOfWeek,
    monthDay,
  };
}
