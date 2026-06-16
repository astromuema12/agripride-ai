'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sprout, FileSearch, CloudSun, ScrollText,
  BarChart3, Users, TreePine, Shield, AlertTriangle,
  Leaf, LineChart, Menu, X, Building2, UserCheck,
  Bot, TrendingUp, DollarSign, Download, Bell,
  Star, MessageCircle, CreditCard,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const farmerLinks = [
  { href: '/dashboard/farmer', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/farmer/farms', label: 'My Farms', icon: Building2 },
  { href: '/dashboard/farmer/crops', label: 'Crop Records', icon: Sprout },
  { href: '/dashboard/farmer/disease', label: 'Disease Diagnosis', icon: FileSearch },
  { href: '/dashboard/farmer/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/dashboard/farmer/weather', label: 'Weather', icon: CloudSun },
  { href: '/dashboard/farmer/market-prices', label: 'Market Prices', icon: DollarSign },
  { href: '/dashboard/farmer/yield-predictor', label: 'Yield Predictor', icon: TrendingUp },
  { href: '/dashboard/farmer/recommendations', label: 'AI Recommendations', icon: ScrollText },
  { href: '/dashboard/farmer/sustainability', label: 'Sustainability', icon: Leaf },
  { href: '/dashboard/farmer/export', label: 'Data Export', icon: Download },
];

const officerLinks = [
  { href: '/dashboard/officer', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/officer/farmers', label: 'Farmers', icon: Users },
  { href: '/dashboard/officer/disease', label: 'Disease Monitoring', icon: AlertTriangle },
  { href: '/dashboard/officer/recommendations', label: 'Recommendations', icon: ScrollText },
  { href: '/dashboard/officer/analytics', label: 'Regional Analytics', icon: BarChart3 },
  { href: '/dashboard/officer/reports', label: 'Reports', icon: LineChart },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/officer/export', label: 'Data Export', icon: Download },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'User Management', icon: UserCheck },
  { href: '/dashboard/admin/farms', label: 'Farm Management', icon: TreePine },
  { href: '/dashboard/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/dashboard/admin/contacts', label: 'Contact Inquiries', icon: MessageCircle },
  { href: '/dashboard/admin/tickets', label: 'Support Tickets', icon: Shield },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/dashboard/admin/audit', label: 'Audit Center', icon: ScrollText },
  { href: '/dashboard/admin/consent', label: 'Consent Management', icon: FileSearch },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/admin/export', label: 'Data Export', icon: Download },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'officer' ? officerLinks : farmerLinks;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-[60px] sm:top-[68px] z-40 hidden lg:flex"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-[60px] sm:top-[68px] z-50 flex lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-14 sm:top-16 z-30 flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-200',
          'h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex items-center gap-2 border-b border-[var(--border)] px-4 py-3', collapsed && 'justify-center')}>
          <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-[var(--foreground)] capitalize truncate">{user?.role}</span>
              <Badge variant="primary" className="text-[10px] shrink-0">Dashboard</Badge>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-hide">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-[var(--border)] p-3 sm:p-4">
            <Link href="/" className="text-xs text-[var(--muted-foreground)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
