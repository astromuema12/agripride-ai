'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sprout, FileSearch, CloudSun, ScrollText,
  BarChart3, Users, TreePine, Shield, AlertTriangle,
  Wheat, Leaf, LineChart, Menu, X, Building2, UserCheck,
  Bot, TrendingUp, DollarSign, Download, Bell,
  Star, MessageCircle, CreditCard, Lock, Receipt,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/lib/sidebar-context';
import { useI18n } from '@/lib/i18n/context';

const farmerLinks = [
  { href: '/dashboard/farmer', key: 'overview' as const, icon: LayoutDashboard },
  { href: '/dashboard/farmer/farms', key: 'myFarms' as const, icon: Building2 },
  { href: '/dashboard/farmer/crops', key: 'cropRecords' as const, icon: Sprout },
  { href: '/dashboard/farmer/disease', key: 'diseaseDiagnosis' as const, icon: FileSearch },
  { href: '/dashboard/farmer/assistant', key: 'aiAssistant' as const, icon: Bot },
  { href: '/dashboard/farmer/weather', key: 'weather' as const, icon: CloudSun },
  { href: '/dashboard/farmer/market-prices', key: 'market' as const, icon: DollarSign, ns: 'nav' as const },
  { href: '/dashboard/farmer/finance', key: 'farmFinance' as const, icon: Receipt },
  { href: '/dashboard/farmer/yield-predictor', key: 'yieldPredictor' as const, icon: TrendingUp },
  { href: '/dashboard/farmer/recommendations', key: 'aiRecommendations' as const, icon: ScrollText },
  { href: '/dashboard/farmer/sustainability', key: 'sustainability' as const, icon: Leaf },
  { href: '/dashboard/farmer/export', key: 'dataExport' as const, icon: Download },
  { href: '/settings', key: 'settings' as const, icon: Shield, ns: 'nav' as const },
  { href: '/dashboard/security', key: 'security' as const, icon: Lock, ns: 'nav' as const },
];

const officerLinks = [
  { href: '/dashboard/officer', key: 'overview' as const, icon: LayoutDashboard },
  { href: '/dashboard/officer/farmers', key: 'farmers' as const, icon: Users },
  { href: '/dashboard/officer/disease', key: 'diseaseMonitoring' as const, icon: AlertTriangle },
  { href: '/dashboard/officer/recommendations', key: 'recommendations' as const, icon: ScrollText },
  { href: '/dashboard/officer/analytics', key: 'regionalAnalytics' as const, icon: BarChart3 },
  { href: '/dashboard/officer/reports', key: 'reports' as const, icon: LineChart },
  { href: '/dashboard/notifications', key: 'notifications' as const, icon: Bell, ns: 'nav' as const },
  { href: '/dashboard/officer/export', key: 'dataExport' as const, icon: Download },
  { href: '/settings', key: 'settings' as const, icon: Shield, ns: 'nav' as const },
  { href: '/dashboard/security', key: 'security' as const, icon: Lock, ns: 'nav' as const },
];

const adminLinks = [
  { href: '/dashboard/admin', key: 'overview' as const, icon: LayoutDashboard },
  { href: '/dashboard/admin/users', key: 'userManagement' as const, icon: UserCheck },
  { href: '/dashboard/admin/farms', key: 'farmManagement' as const, icon: TreePine },
  { href: '/dashboard/admin/testimonials', key: 'testimonials' as const, icon: Star },
  { href: '/dashboard/admin/contacts', key: 'contactInquiries' as const, icon: MessageCircle },
  { href: '/dashboard/admin/tickets', key: 'supportTickets' as const, icon: Shield },
  { href: '/dashboard/admin/subscriptions', key: 'subscriptions' as const, icon: CreditCard },
  { href: '/dashboard/admin/audit', key: 'auditCenter' as const, icon: ScrollText },
  { href: '/dashboard/admin/consent', key: 'consentManagement' as const, icon: FileSearch },
  { href: '/dashboard/admin/analytics', key: 'analytics' as const, icon: BarChart3 },
  { href: '/dashboard/notifications', key: 'notifications' as const, icon: Bell, ns: 'nav' as const },
  { href: '/dashboard/admin/export', key: 'dataExport' as const, icon: Download },
  { href: '/settings', key: 'settings' as const, icon: Shield, ns: 'nav' as const },
  { href: '/dashboard/security', key: 'security' as const, icon: Lock, ns: 'nav' as const },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'officer' ? officerLinks : farmerLinks;

  return (
    <>
      <Button
        variant="ghost" size="icon"
        className="fixed left-3 top-[60px] sm:top-[68px] z-50 flex lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-30 flex flex-col transition-all duration-300',
          'h-[calc(100vh-4rem)]',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'bg-[#0f2219] dark:bg-[#0a0f0c] border-r border-white/5'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-white/5', collapsed && 'justify-center px-2')}>
          <Button
            variant="ghost" size="icon"
            className="hidden lg:flex shrink-0 text-white/40 hover:text-white hover:bg-white/5"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Wheat className="h-4 w-4 text-[#5e9a6b] shrink-0" />
              <span className="text-sm font-medium text-white/80 font-body capitalize truncate">{user?.role}</span>
            </div>
          )}
          {collapsed && <Wheat className="h-4 w-4 text-[#5e9a6b] shrink-0" />}
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 scrollbar-hide">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-body font-medium transition-all duration-200 touch-manipulation',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? (link.ns === 'nav' ? t(`nav.${link.key}`) : t(`nav.sidebar.${link.key}`)) : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#5e9a6b]')} />
                {!collapsed && <span className="truncate">{link.ns === 'nav' ? t(`nav.${link.key}`) : t(`nav.sidebar.${link.key}`)}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c4704b]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-white/5 p-3">
            <Link href="/" className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors font-body">
              <Wheat className="h-3 w-3" />
              Back to home
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
