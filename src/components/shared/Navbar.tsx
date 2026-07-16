'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wheat, Menu, X, Bell, LogOut, Settings, Shield, Sun, Moon, Lock } from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getNotifications } from '@/lib/db';
import { Notification } from '@/types';
import { useI18n } from '@/lib/i18n';

const navLinkKeys = [
  { href: '/', key: 'nav.home' },
  { href: '/pricing', key: 'nav.pricing' },
  { href: '/governance', key: 'nav.governance' },
  { href: '/contact', key: 'nav.contact' },
  { href: '/support', key: 'nav.support' },
];

export function Navbar() {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isDemoMode, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(({ data }) => setNotifications(data));
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const dashboardHref = user
    ? user.role === 'admin'
      ? '/dashboard/admin'
      : user.role === 'officer'
        ? '/dashboard/officer'
        : '/dashboard/farmer'
    : '/auth';

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)]'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-8 sm:gap-12">
            <Link href="/" className="flex items-center gap-2 group">
              <Wheat className="h-5 w-5 text-[#2d6a4f] dark:text-[#5e9a6b] transition-transform duration-300 group-hover:rotate-12" />
              <span className="font-display text-lg font-normal text-[var(--foreground)] tracking-tight">AgriPride</span>
              <span suppressHydrationWarning>
                {isDemoMode && (
                  <Badge variant="warning" className="text-[10px] ml-1">DEMO</Badge>
                )}
              </span>
            </Link>
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinkKeys.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'link-underline px-3 py-2 text-sm font-body font-medium transition-colors',
                    pathname === link.href
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  )}
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title={t('nav.switchTo', { mode: theme === 'dark' ? t('common.light') : t('common.dark') })}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c4704b] text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 sm:w-80">
                    <DropdownMenuLabel>{t('nav.notifications')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.slice(0, 5).map((n) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium text-[var(--foreground)]', !n.is_read && 'text-[#2d6a4f] dark:text-[#5e9a6b]')}>
                            {n.title}
                          </span>
                          {!n.is_read && <div className="h-1.5 w-1.5 rounded-full bg-[#c4704b]" />}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{n.message.slice(0, 60)}...</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')} className="justify-center text-sm text-[#2d6a4f] dark:text-[#5e9a6b] font-medium">
                      {t('nav.viewAll')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#f0f5f1] text-[#2d6a4f] dark:bg-[#1a2e20] dark:text-[#5e9a6b] text-xs font-body">
                          {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--foreground)]">{user.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{user.email}</span>
                        <Badge variant="primary" className="mt-1 w-fit text-[10px] capitalize">{user.role}</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(dashboardHref)}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t('nav.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/security')}>
                      <Lock className="mr-2 h-4 w-4" />
                      {t('nav.security')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden xs:inline-flex" onClick={() => router.push('/auth')}>
                  {t('nav.signIn')}
                </Button>
                <Button size="sm" onClick={() => router.push('/auth?tab=register')}>
                  {t('nav.getStarted')}
                </Button>
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-[var(--background)] border-l border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border)]">
              <span className="font-display text-lg text-[var(--foreground)]">{t('nav.menu')}</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-3 py-4 space-y-1">
              {navLinkKeys.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block rounded-md px-4 py-3 text-sm font-medium font-body touch-manipulation transition-all duration-200',
                    pathname === link.href
                      ? 'bg-[var(--muted)] text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>
            {!user && (
              <div className="px-3 py-4 border-t border-[var(--border)]">
                <Button className="w-full" onClick={() => { router.push('/auth?tab=register'); setMobileOpen(false); }}>
                  {t('nav.getStarted')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-16 sm:h-18" />
    </>
  );
}
