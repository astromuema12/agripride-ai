'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">{t('dashboard.errorPage.title')}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t('dashboard.errorPage.description')}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('dashboard.errorPage.tryAgain')}
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          {t('dashboard.errorPage.goHome')}
        </Button>
      </div>
    </div>
  );
}
