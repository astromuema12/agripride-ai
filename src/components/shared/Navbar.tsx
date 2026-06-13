'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, Menu, X, Bell, LogOut, Settings, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
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
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">AgriPride AI</span>
            <span suppressHydrationWarning>
              {isDemoMode && (
                <Badge variant="warning" className="ml-1 text-[10px]">DEMO</Badge>
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
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
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
                        <span className={cn('text-sm font-medium', !n.is_read && 'text-emerald-600')}>
                          {n.title}
                        </span>
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-xs text-gray-500">{n.message.slice(0, 60)}...</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')} className="justify-center text-sm text-emerald-600 font-medium">
                    View All Notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.push('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/auth?tab=register')}>
                Get Started
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium',
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50'
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
