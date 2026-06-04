'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { demoLogin, demoRegister } from '@/lib/demo-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase!
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
      role: (authUser.user_metadata?.role ?? 'farmer') as UserRole,
      is_suspended: false,
    };
    const { data } = await supabase!
      .from('users')
      .insert(newProfile)
      .select()
      .single();
    profile = data as User | null;
  }
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('agripride_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('agripride_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('agripride_demo_mode') === 'true';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase!.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem('agripride_user', JSON.stringify(profile));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem('agripride_user', JSON.stringify(profile));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
        }
      } else {
        setUser(null);
        localStorage.removeItem('agripride_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const profile = await ensureUserProfile(data.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem('agripride_user', JSON.stringify(profile));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
          return {};
        }
      }
      if (error) return { error: error.message };
      return { error: 'Failed to load user profile' };
    }

    const demoUser = demoLogin(email, password);
    if (demoUser) {
      setUser(demoUser);
      localStorage.setItem('agripride_user', JSON.stringify(demoUser));
      localStorage.setItem('agripride_demo_mode', 'true');
      setIsDemoMode(true);
      return {};
    }

    return { error: 'Invalid email or password' };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (!error && data.user) {
        const profile = await ensureUserProfile(data.user);
        if (profile) {
          setUser(profile);
          localStorage.setItem('agripride_user', JSON.stringify(profile));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
          return {};
        }
      }
      if (error) return { error: error.message };
      return { error: 'Registration succeeded but profile creation failed' };
    }

    const newUser = demoRegister(email, password, name, role);
    setUser(newUser);
    localStorage.setItem('agripride_user', JSON.stringify(newUser));
    localStorage.setItem('agripride_demo_mode', 'true');
    setIsDemoMode(true);
    return {};
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && !isDemoMode) {
      await supabase!.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('agripride_user');
    localStorage.removeItem('agripride_demo_mode');
    setIsDemoMode(false);
  }, [isDemoMode]);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return {};
    }
    return { error: 'Password reset unavailable in demo mode' };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
