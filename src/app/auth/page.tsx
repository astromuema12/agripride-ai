'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useI18n } from '@/lib/i18n';

const PASSWORD_MIN_LENGTH = 8;

function validatePassword(password: string, t: (key: string, params?: Record<string, string | number>) => string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return t('auth.errors.invalidPassword', { min: PASSWORD_MIN_LENGTH });
  if (!/[A-Z]/.test(password)) return t('auth.errors.uppercase');
  if (!/[a-z]/.test(password)) return t('auth.errors.lowercase');
  if (!/[0-9]/.test(password)) return t('auth.errors.digit');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return t('auth.errors.specialChar');
  return null;
}

interface FormFieldProps {
  id: string; label: string; type: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string;
  showToggle?: boolean; showPassword?: boolean; onTogglePassword?: () => void; autoComplete?: string;
}

function FormField({ id, label, type, placeholder, value, onChange, error, showToggle, showPassword, onTogglePassword, autoComplete }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--foreground)] font-body">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`h-11 font-body text-sm transition-all duration-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
        />
        {showToggle && (
          <button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="flex items-center gap-1 text-xs text-red-500 font-body"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

function AuthForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, resetPassword, user, isDemoMode, refreshUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);

  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (oauthSuccess === 'google' || oauthSuccess === 'github') {
      toast.success(t('auth.signedInWith', { provider: oauthSuccess === 'google' ? t('auth.providers.google') : t('auth.providers.github') }));
      refreshUser();
    }
    if (oauthError) {
      setError(oauthError === 'auth_callback_failed' ? t('auth.errors.authenticationFailed') : oauthError);
    }
  }, [oauthSuccess, oauthError, refreshUser, t]);

  useEffect(() => {
    if (user) {
      const dashboard = user.role === 'admin' ? '/dashboard/admin' : user.role === 'officer' ? '/dashboard/officer' : '/dashboard/farmer';
      router.push(dashboard);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.error) { setError(result.error); toast.error(result.error); } else { toast.success(t('auth.success.loggedIn')); }
    } catch { setError(t('auth.errors.unexpected')); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) { setError(t('auth.errors.allRequired')); return; }
    if (regPassword !== regConfirmPassword) { setError(t('auth.errors.passwordsDontMatch')); return; }
    const passwordError = validatePassword(regPassword, t);
    if (passwordError) { setError(passwordError); return; }
    if (!agreeToTerms) { setError(t('auth.errors.agreeToTerms')); return; }
    setLoading(true);
    try {
      const result = await register(regEmail, regPassword, regName, 'farmer');
      if (result.error) { setError(result.error); toast.error(result.error); } else { toast.success(t('auth.success.registered')); }
    } catch { setError(t('auth.errors.unexpected')); } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!resetEmail) { setError(t('auth.errors.emailRequired')); return; }
    setLoading(true);
    try {
      const result = await resetPassword(resetEmail);
      if (result.error) { setError(result.error); toast.error(result.error); } else { toast.success(t('auth.success.resetSent')); setShowReset(false); }
    } catch { setError(t('auth.errors.unexpected')); } finally { setLoading(false); }
  };

  const switchTab = useCallback((v: string) => { setTab(v as 'login' | 'register'); setError(''); }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left — Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0f2219] dark:bg-[#0a0f0c] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 texture-grain pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-16">
            <Wheat className="h-5 w-5 text-[#5e9a6b]" />
            <span className="font-display text-xl text-white">AgriPride</span>
          </div>
          <h2 className="font-display text-4xl text-white leading-tight max-w-sm">
            Grow smarter,{'\n'}season after season.
          </h2>
        </div>
        <div className="relative">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#c4704b]" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">Trusted by</span>
            </div>
            <p className="text-white/50 text-sm font-body">15,000+ farmers across 47 counties in Kenya</p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-8 bg-[var(--background)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Wheat className="h-5 w-5 text-[#2d6a4f] dark:text-[#5e9a6b]" />
            <span className="font-display text-lg text-[var(--foreground)]">AgriPride</span>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--foreground)]">{t('common.welcomeMessage')}</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] font-body">{t('footer.description')}</p>
            {isDemoMode && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-body">
                <AlertCircle className="h-3 w-3" />
                {t('auth.demoModeActive')}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showReset ? (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <form onSubmit={handleReset} className="space-y-4">
                  <FormField id="reset-email" label={t('auth.email')} type="email" placeholder="farmer@agripride.ai" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" />
                  {error && <p className="flex items-center gap-1 text-sm text-red-500 font-body"><AlertCircle className="h-4 w-4" />{error}</p>}
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendReset')}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.backToLogin')}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                <Tabs value={tab} onValueChange={switchTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-lg bg-[var(--muted)] p-1 mb-6">
                    <TabsTrigger value="login" className="rounded-md text-sm font-medium font-body data-[state=active]:bg-[var(--card)] data-[state=active]:text-[#2d6a4f] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#1a2e20]">{t('auth.title')}</TabsTrigger>
                    <TabsTrigger value="register" className="rounded-md text-sm font-medium font-body data-[state=active]:bg-[var(--card)] data-[state=active]:text-[#2d6a4f] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#1a2e20]">{t('auth.register')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <FormField id="email" label={t('auth.email')} type="email" placeholder="farmer@agripride.ai" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" />
                      <FormField id="password" label={t('auth.password')} type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} autoComplete="current-password" />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-[var(--border)] text-[#2d6a4f] focus:ring-[#2d6a4f] focus:ring-offset-0" />
                          <span className="text-sm text-[var(--muted-foreground)] font-body">{t('auth.rememberMe')}</span>
                        </label>
                        <button type="button" onClick={() => setShowReset(true)} className="text-sm text-[#2d6a4f] hover:text-[#1a3a2a] dark:text-[#5e9a6b] dark:hover:text-[#8ab592] font-medium font-body">
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      {error && <p className="flex items-center gap-1 text-sm text-red-500 font-body"><AlertCircle className="h-4 w-4" />{error}</p>}
                      <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('auth.title')}
                      </Button>
                    </form>
                    <div className="mt-6"><OAuthButtons mode="login" /></div>
                    <p className="mt-6 text-center text-sm text-[var(--muted-foreground)] font-body">
                      {t('auth.noAccount')}{' '}
                      <button type="button" onClick={() => switchTab('register')} className="text-[#2d6a4f] hover:text-[#1a3a2a] dark:text-[#5e9a6b] dark:hover:text-[#8ab592] font-medium">{t('auth.signUp')}</button>
                    </p>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <FormField id="reg-name" label={t('auth.name')} type="text" placeholder={t('auth.name')} value={regName} onChange={(e) => setRegName(e.target.value)} autoComplete="name" />
                      <FormField id="reg-email" label={t('auth.email')} type="email" placeholder={t('common.email')} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="email" />
                      <div className="space-y-1.5">
                        <FormField id="reg-password" label={t('auth.password')} type="password" placeholder={t('auth.password')} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} autoComplete="new-password" />
                        <PasswordStrengthMeter password={regPassword} />
                      </div>
                      <FormField id="reg-confirm-password" label={t('auth.confirmPassword')} type="password" placeholder={t('auth.confirmPassword')} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} showToggle showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} autoComplete="new-password" />
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-[#2d6a4f] focus:ring-[#2d6a4f] focus:ring-offset-0" />
                        <span className="text-sm text-[var(--muted-foreground)] font-body">{t('auth.agreeToTerms')}</span>
                      </label>
                      {error && <p className="flex items-center gap-1 text-sm text-red-500 font-body"><AlertCircle className="h-4 w-4" />{error}</p>}
                      <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('auth.createAccount')}
                      </Button>
                    </form>
                    <div className="mt-6"><OAuthButtons mode="register" /></div>
                    <p className="mt-6 text-center text-sm text-[var(--muted-foreground)] font-body">
                      {t('auth.hasAccount')}{' '}
                      <button type="button" onClick={() => switchTab('login')} className="text-[#2d6a4f] hover:text-[#1a3a2a] dark:text-[#5e9a6b] dark:hover:text-[#8ab592] font-medium">{t('auth.signIn')}</button>
                    </p>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2d6a4f]" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
