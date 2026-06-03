'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('agripride_user');
    const storedMode = localStorage.getItem('agripride_demo_mode');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsDemoMode(storedMode === 'true');
      } catch {
        localStorage.removeItem('agripride_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'farmer',
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
            is_suspended: false,
          };
          setUser(userData);
          localStorage.setItem('agripride_user', JSON.stringify(userData));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
          return {};
        }
      } catch {
        // Fall through to demo mode
      }
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
      try {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { name, role } },
        });
        if (!error && data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            name,
            role,
            created_at: data.user.created_at,
            updated_at: data.user.created_at,
            is_suspended: false,
          };
          setUser(userData);
          localStorage.setItem('agripride_user', JSON.stringify(userData));
          localStorage.removeItem('agripride_demo_mode');
          setIsDemoMode(false);
          return {};
        }
        if (error) return { error: error.message };
      } catch {
        // Fall through to demo mode
      }
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
      try {
        await supabase!.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem('agripride_user');
    localStorage.removeItem('agripride_demo_mode');
    setIsDemoMode(false);
  }, [isDemoMode]);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase!.auth.resetPasswordForEmail(email);
        if (error) return { error: error.message };
        return {};
      } catch {
        return { error: 'Password reset unavailable in demo mode' };
      }
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
