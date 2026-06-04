'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sprout, FileSearch, CloudSun, ScrollText,
  BarChart3, Users, TreePine, Shield, AlertTriangle,
  Leaf, LineChart, Menu, X, Building2, UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const farmerLinks = [
  { href: '/dashboard/farmer', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/farmer/farms', label: 'My Farms', icon: Building2 },
  { href: '/dashboard/farmer/crops', label: 'Crop Records', icon: Sprout },
  { href: '/dashboard/farmer/disease', label: 'Disease Diagnosis', icon: FileSearch },
  { href: '/dashboard/farmer/weather', label: 'Weather', icon: CloudSun },
  { href: '/dashboard/farmer/recommendations', label: 'AI Recommendations', icon: ScrollText },
  { href: '/dashboard/farmer/sustainability', label: 'Sustainability', icon: Leaf },
];

const officerLinks = [
  { href: '/dashboard/officer', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/officer/farmers', label: 'Farmers', icon: Users },
  { href: '/dashboard/officer/disease', label: 'Disease Monitoring', icon: AlertTriangle },
  { href: '/dashboard/officer/recommendations', label: 'Recommendations', icon: ScrollText },
  { href: '/dashboard/officer/analytics', label: 'Regional Analytics', icon: BarChart3 },
  { href: '/dashboard/officer/reports', label: 'Reports', icon: LineChart },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'User Management', icon: UserCheck },
  { href: '/dashboard/admin/farms', label: 'Farm Management', icon: TreePine },
  { href: '/dashboard/admin/audit', label: 'Audit Center', icon: Shield },
  { href: '/dashboard/admin/consent', label: 'Consent Management', icon: FileSearch },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'officer' ? officerLinks : farmerLinks;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-[72px] z-30 hidden lg:flex"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      <aside
        className={cn(
          'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-gray-200 bg-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('flex items-center gap-2 border-b border-gray-100 px-4 py-3', collapsed && 'justify-center')}>
          <Leaf className="h-5 w-5 text-emerald-600 shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 capitalize">{user?.role}</span>
              <Badge variant="primary" className="text-[10px]">Dashboard</Badge>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-gray-100 p-4">
            <Link href="/" className="text-xs text-gray-500 hover:text-emerald-600 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
