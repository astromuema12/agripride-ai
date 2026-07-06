'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-dialog)]"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-xs sm:text-sm text-[var(--muted-foreground)]">
              {t('cookieConsent.message')}{' '}
              <Link href="/privacy" className="text-[#0f766e] dark:text-[#14b8a6] underline hover:text-[#0b5c54] dark:hover:text-[#6ee7b7]">{t('footer.privacy')}</Link>.
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={reject}>
                {t('cookieConsent.reject')}
              </Button>
              <Button size="sm" onClick={accept}>
                {t('cookieConsent.accept')}
              </Button>
              <button onClick={reject} className="ml-1 rounded-full p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
