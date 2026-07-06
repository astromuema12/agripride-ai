'use client';

import { useI18n } from '@/lib/i18n';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  const languages = [
    { code: 'en' as const, label: t('common.english'), flag: '🇬🇧' },
    { code: 'sw' as const, label: t('common.kiswahili'), flag: '🇰🇪' },
  ];

  const current = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] text-[var(--foreground)] font-medium text-xs sm:text-sm px-2 sm:px-3"
          title={t('common.language')}
        >
          <span>{current.flag}</span>
          <span>{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-[var(--muted-foreground)] font-normal uppercase tracking-wider">
          {t('common.language')}
        </DropdownMenuLabel>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span className={lang.code === language ? 'font-medium' : ''}>{lang.label}</span>
            </span>
            {lang.code === language && (
              <Check className="h-4 w-4 text-[#0f766e] dark:text-[#14b8a6] shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
