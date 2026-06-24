'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
          <p className="text-sm font-medium text-gray-500">Please sign in to manage MFA.</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>Sign In</Button>
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
      setVerifyError('Please enter a 6-digit code');
      return;
    }

    setSaving(true);
    const valid = await verifyTotp(setup.secret, verifyToken);
    setSaving(false);

    if (!valid) {
      setVerifyError('Invalid code. Try again or wait for a new code.');
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
    toast.success('Two-factor authentication enabled');
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    setSaving(true);
    const result = await disableMfa(user.id);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMfaEnabled(false);
    setStep('intro');
    toast.success('Two-factor authentication disabled');
  };

  const handleCopyCodes = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.recoveryCodes.join('\n'));
      setCodesCopied(true);
      toast.success('Recovery codes copied to clipboard');
      setTimeout(() => setCodesCopied(false), 3000);
    } catch {
      toast.error('Failed to copy to clipboard');
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'intro' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                  <div className="flex items-start gap-3">
                    <Smartphone className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">How it works</p>
                      <ul className="mt-2 space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />Use an authenticator app like Google Authenticator or Authy</li>
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />Enter a 6-digit code from the app when signing in</li>
                        <li className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />Save your recovery codes in case you lose access to your device</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {mfaEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Two-factor authentication is active</span>
                    </div>
                    <Button variant="destructive" onClick={handleDisable} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Disable 2FA
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleStartSetup} className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    Set Up Two-Factor Authentication
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
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Scan or enter the code manually</p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        Open your authenticator app and scan the QR code, or enter the setup key manually.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[var(--border)] p-6">
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <Key className="h-12 w-12 text-emerald-400" />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Setup key:{' '}
                    <code className="rounded bg-[var(--muted)] px-2 py-0.5 font-mono text-emerald-600 dark:text-emerald-400">
                      {setup.secret.slice(0, 8)}...{setup.secret.slice(-4)}
                    </code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verify-token">Enter 6-digit code from authenticator app</Label>
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
                    Back
                  </Button>
                  <Button onClick={handleVerify} disabled={saving || verifyToken.length !== 6} className="flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify &amp; Continue
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
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Save your recovery codes</p>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                        Each code can only be used once. Store them securely — if you lose access to your authenticator app, these codes are the only way to recover your account.
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
                    {codesCopied ? 'Copied!' : 'Copy Codes'}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCodes} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('intro')} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleEnable} disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Two-factor authentication is now active</p>
                  <p className="mt-1 text-sm text-gray-500">Your account is now more secure. You will need a 6-digit code from your authenticator app when signing in.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/security')} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Go to Security Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
