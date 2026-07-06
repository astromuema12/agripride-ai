'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Shield, Loader2, AlertCircle, CheckCircle2, Copy, Download, ArrowLeft, Smartphone, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  generateMfaSecret,
  verifyTotp,
  saveMfaCredential,
  getUserMfaStatus,
  enableMfa,
  disableMfa,
} from '@/lib/mfa';
import type { MfaSetupResult } from '@/types';

export default function MfaPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'scan' | 'verify' | 'codes' | 'done'>('intro');
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [saving, setSaving] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const currentUser = user;
    getUserMfaStatus(currentUser.id).then((status) => {
      if (cancelled) return;
      setMfaEnabled(status.enabled);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Shield className="h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">{t('auth.mfa.notSignedIn')}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>{t('common.signIn')}</Button>
        </div>
      </div>
    );
  }

  const handleStartSetup = () => {
    const result = generateMfaSecret(user.email);
    setSetup(result);
    setStep('scan');
  };

  const handleVerify = async () => {
    if (!setup) return;
    setVerifyError('');

    if (!verifyToken || verifyToken.length !== 6) {
      setVerifyError(t('auth.mfa.errors.invalidCode'));
      return;
    }

    setSaving(true);
    const valid = await verifyTotp(setup.secret, verifyToken);
    setSaving(false);

    if (!valid) {
      setVerifyError(t('auth.mfa.errors.invalid'));
      return;
    }

    setSaving(true);
    const result = await saveMfaCredential(user.id, setup.secret, setup.recoveryCodes);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setStep('codes');
  };

  const handleEnable = async () => {
    setSaving(true);
    const result = await enableMfa(user.id);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMfaEnabled(true);
    setStep('done');
    toast.success(t('auth.mfa.errors.enabled'));
  };

  const handleDisable = async () => {
    if (!confirm(t('auth.mfa.disableConfirm'))) return;

    setSaving(true);
    const result = await disableMfa(user.id);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMfaEnabled(false);
    setStep('intro');
    toast.success(t('auth.mfa.errors.disabled'));
  };

  const handleCopyCodes = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.recoveryCodes.join('\n'));
      setCodesCopied(true);
      toast.success(t('auth.mfa.codesCopied'));
      setTimeout(() => setCodesCopied(false), 3000);
    } catch {
      toast.error(t('auth.mfa.codesCopyFailed'));
    }
  };

  const handleDownloadCodes = () => {
    if (!setup) return;
    const blob = new Blob([
      'AgriPride AI - Recovery Codes\n',
      '========================\n\n',
      'Keep these codes in a safe place. Each code can only be used once.\n\n',
      ...setup.recoveryCodes.map((c) => `${c}\n`),
      '\nGenerated: ', new Date().toISOString(),
    ], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agripride-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-earth-50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-earth-950/30 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="border-[var(--border)]/60 bg-[var(--card)]/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('auth.mfa.title')}</CardTitle>
                <CardDescription>{t('security.mfaDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'intro' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#e2f0ee] p-4 dark:bg-emerald-900/20">
                  <div className="flex items-start gap-3">
                    <Smartphone className="mt-0.5 h-5 w-5 text-[#0f766e] dark:text-[#14b8a6]" />
                    <div>
                      <p className="text-sm font-medium text-[#183028] dark:text-[#14b8a6]">{t('auth.mfa.howItWorks')}</p>
                      <ul className="mt-2 space-y-1 text-xs text-[#0f766e] dark:text-[#14b8a6]">
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />{t('auth.mfa.step1')}</li>
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />{t('auth.mfa.step2')}</li>
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />{t('auth.mfa.step3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {mfaEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-[#e2f0ee] p-3 dark:bg-emerald-900/20">
                      <CheckCircle2 className="h-5 w-5 text-[#0f766e] dark:text-[#14b8a6]" />
                      <span className="text-sm font-medium text-[#0f766e] dark:text-[#14b8a6]">{t('auth.mfa.isActive')}</span>
                    </div>
                    <Button variant="destructive" onClick={handleDisable} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {t('auth.mfa.disable')}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleStartSetup} className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    {t('auth.mfa.setupIntro')}
                  </Button>
                )}
              </div>
            )}

            {step === 'scan' && setup && (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('auth.mfa.scanOrEnter')}</p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        {t('auth.mfa.scanDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[var(--border)] p-6">
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-[#e2f0ee] dark:bg-emerald-900/20">
                    <Key className="h-12 w-12 text-[#14b8a6]" />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t('auth.mfa.setupKey')}:{' '}
                    <code className="rounded bg-[var(--muted)] px-2 py-0.5 font-mono text-[#0f766e] dark:text-[#14b8a6]">
                      {setup.secret.slice(0, 8)}...{setup.secret.slice(-4)}
                    </code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verify-token">{t('auth.mfa.enterCode')}</Label>
                  <Input
                    id="verify-token"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                  {verifyError && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {verifyError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('intro')} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleVerify} disabled={saving || verifyToken.length !== 6} className="flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('auth.mfa.verifyAndContinue')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'codes' && setup && (
              <div className="space-y-4">
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">{t('auth.mfa.saveRecovery')}</p>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                        {t('auth.mfa.recoveryDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {setup.recoveryCodes.map((code, i) => (
                      <code key={i} className="rounded bg-[var(--card)] px-2 py-1.5 text-xs font-mono text-center tracking-wide">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCopyCodes} className="flex-1 gap-2">
                    {codesCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {codesCopied ? t('auth.mfa.copied') : t('auth.mfa.copyCodes')}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCodes} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    {t('common.download')}
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('intro')} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleEnable} disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {t('auth.mfa.enable')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f0ee] dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-8 w-8 text-[#0f766e] dark:text-[#14b8a6]" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('auth.mfa.activeTitle')}</p>
                  <p className="mt-1 text-sm text-gray-500">{t('auth.mfa.activeDesc')}</p>
                </div>
                <Button onClick={() => router.push('/dashboard/security')} className="gap-2">
                  <Shield className="h-4 w-4" />
                  {t('auth.mfa.goToSecurity')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
