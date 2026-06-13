'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        {isDemoMode && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-700 border-b border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-center">Demo Mode Active &mdash; Data is simulated and not persisted to the cloud</span>
          </div>
        )}
        <div className="px-3 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
