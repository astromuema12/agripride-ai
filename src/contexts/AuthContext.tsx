'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { demoLogin, demoRegister } from '@/lib/demo-auth';
import { recordSession } from '@/lib/sessions';
import { useI18n } from '@/lib/i18n';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL_MS = 10 * 1000;
const STORAGE_KEYS = {
  user: 'agripride_user',
  demoMode: 'agripride_demo_mode',
  lastActivity: 'agripride_last_activity',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data as User | null;
}

async function ensureUserProfile(authUser: { id: string; email?: string; user_metadata?: { name?: string; role?: string } }): Promise<User | null> {
  let profile = await fetchUserProfile(authUser.id);
  if (!profile) {
    const newProfile = {
      id: authUser.id,
      email: authUser.email ?? '',
      name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'User',
      role: 'farmer' as UserRole,
      is_suspended: false,
    };
  if (!supabase) return null;
  const { data } = await supabase
    .from('users')
    .insert(newProfile)
    .select()
    .single();
  profile = data as User | null;
  }
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const last = localStorage.getItem(STORAGE_KEYS.lastActivity);
      if (last && Date.now() - Number(last) > SESSION_TIMEOUT_MS) {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.lastActivity);
        return null;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.user);
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.user);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.demoMode) === 'true';
  });
  const [oAuthLoading, setOAuthLoading] = useState(false);

  const touchActivity = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.lastActivity, Date.now().toString());
  }, []);

  const isSessionExpired = useCallback((): boolean => {
    const last = localStorage.getItem(STORAGE_KEYS.lastActivity);
    if (!last) return true;
    return Date.now() - Number(last) > SESSION_TIMEOUT_MS;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    const handler = () => touchActivity();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    touchActivity();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [touchActivity]);

  useEffect(() => {
    if (!user) return;

    if (isSessionExpired()) {
      logout();
      return;
    }

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logout();
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, isSessionExpired]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initSession() {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await ensureUserProfile(session.user);
          if (profile) {
            setUser(profile);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
            localStorage.removeItem(STORAGE_KEYS.demoMode);
            setIsDemoMode(false);
            await recordSession(profile.id);
          }
        }
      }
      setLoading(false);
    }

    initSession();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await ensureUserProfile(session.user);
          if (profile) {
            setUser(profile);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
            localStorage.removeItem(STORAGE_KEYS.demoMode);
            setIsDemoMode(false);
            await recordSession(profile.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.user);
          localStorage.removeItem(STORAGE_KEYS.demoMode);
          localStorage.removeItem(STORAGE_KEYS.lastActivity);
          setIsDemoMode(false);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const profile = await ensureUserProfile(data.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
          localStorage.removeItem(STORAGE_KEYS.demoMode);
          setIsDemoMode(false);
          touchActivity();
          await recordSession(profile.id);
          return {};
        }
      }
      if (error) return { error: error.message };
      return { error: t('auth.errors.profileLoadFailed') };
    }

    const demoUser = demoLogin(email, password);
    if (demoUser) {
      setUser(demoUser);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(demoUser));
      localStorage.setItem(STORAGE_KEYS.demoMode, 'true');
      setIsDemoMode(true);
      touchActivity();
      return {};
    }

    return { error: t('auth.errors.invalidCredentials') };
  }, [touchActivity]);

  const register = useCallback(async (email: string, password: string, name: string, _role: UserRole): Promise<{ error?: string }> => {
    const forcedRole: UserRole = 'farmer';
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: forcedRole } },
      });
      if (!error && data.user) {
        const profile = await ensureUserProfile(data.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
          localStorage.removeItem(STORAGE_KEYS.demoMode);
          setIsDemoMode(false);
          touchActivity();
          await recordSession(profile.id);
          return {};
        }
      }
      if (error) return { error: error.message };
      return { error: t('auth.errors.registrationProfileFailed') };
    }

    const newUser = demoRegister(email, password, name, forcedRole);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.demoMode, 'true');
    setIsDemoMode(true);
    touchActivity();
    return {};
  }, [touchActivity]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase && !isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.demoMode);
    localStorage.removeItem(STORAGE_KEYS.lastActivity);
    setIsDemoMode(false);
  }, [isDemoMode]);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return {};
    }
    return { error: t('auth.errors.resetUnavailable') };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured || !supabase) return;
    setOAuthLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = `${origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      });
      if (error) {
        console.error(`${provider} OAuth error:`, error.message);
      }
    } catch (err) {
      console.error(`${provider} OAuth error:`, err);
    } finally {
      setOAuthLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await ensureUserProfile(session.user);
      if (profile) {
        setUser(profile);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, register, logout, resetPassword, signInWithOAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
