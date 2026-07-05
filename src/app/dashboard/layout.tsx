'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';
import { useI18n } from '@/lib/i18n';
import { Loader2, AlertCircle } from 'lucide-react';

function DashboardContent({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, loading, isDemoMode } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#445c8c]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[var(--background)]">
      <Sidebar />
      <div className={`${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] overflow-x-auto`}>
        {isDemoMode && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-3 sm:px-4 py-2 text-xs sm:text-sm text-amber-700 border-b border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="text-center">{t('dashboard.demoBanner')}</span>
          </div>
        )}
        <div className="px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
