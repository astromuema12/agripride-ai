'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Loader2, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

const PASSWORD_MIN_LENGTH = 8;
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a digit';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character';
  }
  return null;
}

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  autoComplete?: string;
}

function FormField({ id, label, type, placeholder, value, onChange, error, showToggle, showPassword, onTogglePassword, autoComplete }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`h-10 bg-[var(--card)]/50 backdrop-blur-sm border-[var(--border)] text-sm transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function AuthForm() {
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
      toast.success(`Signed in with ${oauthSuccess === 'google' ? 'Google' : 'GitHub'}`);
      refreshUser();
    }
    if (oauthError) {
      setError(oauthError === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : oauthError);
    }
  }, [oauthSuccess, oauthError, refreshUser]);

  useEffect(() => {
    if (user) {
      const dashboard = user.role === 'admin'
        ? '/dashboard/admin'
        : user.role === 'officer'
          ? '/dashboard/officer'
          : '/dashboard/farmer';
      router.push(dashboard);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Welcome back!');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('All fields are required');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const passwordError = validatePassword(regPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      const result = await register(regEmail, regPassword, regName, 'farmer');
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(resetEmail);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Password reset link sent!');
        setShowReset(false);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = useCallback((v: string) => {
    setTab(v as 'login' | 'register');
    setError('');
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-earth-50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-earth-950/30 px-4 py-8 sm:py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-earth-100/30 blur-3xl dark:bg-earth-900/20" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-800/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo + Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30"
          >
            <Wheat className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            Welcome to AgriPride AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            Empowering African agriculture with AI
          </motion.p>
          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            >
              <AlertCircle className="h-3 w-3" />
              Demo Mode Active
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showReset ? (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-[var(--border)]/60 bg-[var(--card)]/80 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg">Reset Password</CardTitle>
                  <CardDescription>Enter your email to receive a reset link</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReset} className="space-y-4">
                    <FormField id="reset-email" label="Email" type="email" placeholder="farmer@agripride.ai" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" />
                    {error && <p className="flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-4 w-4" />{error}</p>}
                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Send Reset Link
                    </Button>
                    <Button type="button" variant="ghost" className="w-full gap-2" onClick={() => setShowReset(false)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-[var(--border)]/60 bg-[var(--card)]/80 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20">
                <CardContent className="p-0">
                  <Tabs value={tab} onValueChange={switchTab} className="w-full">
                    <div className="px-6 pt-6">
                      <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[var(--muted)] p-1">
                        <TabsTrigger value="login" className="rounded-lg text-sm font-medium data-[state=active]:bg-[var(--card)] data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-900/30">Sign In</TabsTrigger>
                        <TabsTrigger value="register" className="rounded-lg text-sm font-medium data-[state=active]:bg-[var(--card)] data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-900/30">Create Account</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="login" className="px-6 pb-6 pt-4 mt-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <FormField id="email" label="Email" type="email" placeholder="farmer@agripride.ai" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" />
                        <FormField id="password" label="Password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} autoComplete="current-password" />
                        
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-4 w-4 rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-[var(--muted-foreground)]">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowReset(true)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        
                        {error && <p className="flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-4 w-4" />{error}</p>}
                        <Button type="submit" className="w-full gap-2 h-11 text-base" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Sign In
                        </Button>
                      </form>

                      <div className="mt-6">
                        <OAuthButtons mode="login" />
                      </div>

                      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchTab('register')}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                        >
                          Sign up
                        </button>
                      </p>
                    </TabsContent>

                    <TabsContent value="register" className="px-6 pb-6 pt-4 mt-0">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <FormField id="reg-name" label="Full Name" type="text" placeholder="Enter your full name" value={regName} onChange={(e) => setRegName(e.target.value)} autoComplete="name" />
                        <FormField id="reg-email" label="Email" type="email" placeholder="Enter your email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="email" />
                        <div className="space-y-1.5">
                          <FormField id="reg-password" label="Password" type="password" placeholder="Create a password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} autoComplete="new-password" />
                          <PasswordStrengthMeter password={regPassword} />
                        </div>
                        <FormField id="reg-confirm-password" label="Confirm Password" type="password" placeholder="Confirm your password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} showToggle showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} autoComplete="new-password" />
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-[var(--muted-foreground)]">
                            I agree to the{' '}
                            <a href="/terms" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-2">Privacy Policy</a>
                          </span>
                        </label>
                        {error && <p className="flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-4 w-4" />{error}</p>}
                        <Button type="submit" className="w-full gap-2 h-11 text-base" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Create Account
                        </Button>
                      </form>

                      <div className="mt-6">
                        <OAuthButtons mode="register" />
                      </div>

                      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchTab('login')}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-earth-50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-earth-950/30">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
            <Wheat className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
