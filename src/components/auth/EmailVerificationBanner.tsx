'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Mail, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkEmailVerified, sendVerificationEmail } from '@/lib/email-verification';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface EmailVerificationBannerProps {
  userId: string;
  email: string;
}

export function EmailVerificationBanner({ userId, email }: EmailVerificationBannerProps) {
  const { t } = useI18n();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const result = await checkEmailVerified(userId);
      if (!cancelled) {
        setVerified(result.verified);
        setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [userId]);

  const handleResend = async () => {
    setSending(true);
    const result = await sendVerificationEmail(email);
    setSending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setSent(true);
      toast.success(t('auth.verifyEmail.success'));
    }
  };

  if (checking) return null;
  if (verified || dismissed) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('auth.verifyEmail.title')}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {t('auth.verifyEmail.description', { email })}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={sending || sent}
              onClick={handleResend}
              className="gap-1.5"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {sent ? t('auth.verifyEmail.sent') : t('auth.verifyEmail.resend')}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
