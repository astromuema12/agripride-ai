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

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/governance', label: 'AI Governance' },
  { href: '/contact', label: 'Contact' },
  { href: '/support', label: 'Support' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isDemoMode, logout } = useAuth();

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
    <nav className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Wheat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold text-[var(--foreground)]">AgriPride AI</span>
            <span suppressHydrationWarning>
              {isDemoMode && (
                <Badge variant="warning" className="ml-0.5 text-[10px]">DEMO</Badge>
              )}
            </span>
          </Link>
          <div className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium text-[var(--foreground)]', !n.is_read && 'text-emerald-600 dark:text-emerald-400')}>
                          {n.title}
                        </span>
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">{n.message.slice(0, 60)}...</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')} className="justify-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    View All Notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] sm:text-xs">
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
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/security')}>
                    <Lock className="mr-2 h-4 w-4" />
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hidden xs:inline-flex" onClick={() => router.push('/auth')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => router.push('/auth?tab=register')}>
                Get Started
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <div className="space-y-1 px-3 sm:px-4 py-2 sm:py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2.5 text-sm font-medium touch-manipulation transition-colors',
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
