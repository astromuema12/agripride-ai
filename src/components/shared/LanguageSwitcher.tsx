'use client';

import { useI18n } from '@/lib/i18n';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          title={t('common.language')}
        >
          <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}
        >
          {t('common.english')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('sw')}
          className={language === 'sw' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}
        >
          {t('common.kiswahili')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
