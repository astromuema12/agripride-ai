'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getAuditLogs } from '@/lib/db';
import type { DashboardStats, AuditLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, Building2, Sprout, FileSearch, CloudSun, ScrollText,
  Shield, Leaf, TrendingUp, AlertTriangle, Activity, BarChart3,
  CheckCircle, Clock, Loader2, MessageCircle, CreditCard, Star,
} from 'lucide-react';
import { toast } from 'sonner';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statCards: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string; suffix?: string }[] = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { key: 'total_farms', label: 'Total Farms', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'total_crops', label: 'Crop Records', icon: Sprout, color: 'text-green-600 bg-green-50' },
  { key: 'total_disease_reports', label: 'Disease Reports', icon: FileSearch, color: 'text-red-600 bg-red-50' },
  { key: 'weather_alerts', label: 'Weather Alerts', icon: CloudSun, color: 'text-cyan-600 bg-cyan-50' },
  { key: 'ai_requests', label: 'AI Requests', icon: ScrollText, color: 'text-purple-600 bg-purple-50' },
  { key: 'audit_events', label: 'Audit Events', icon: Shield, color: 'text-amber-600 bg-amber-50' },
  { key: 'avg_sustainability_score', label: 'Avg Sustainability', icon: Leaf, color: 'text-emerald-600 bg-emerald-50', suffix: '%' },
];

const quickActions = [
  { label: 'Manage Users', section: 'users', icon: Users },
  { label: 'Manage Testimonials', section: 'testimonials', icon: Star },
  { label: 'Contact Inquiries', section: 'contacts', icon: MessageCircle },
  { label: 'Support Tickets', section: 'tickets', icon: Shield },
  { label: 'Subscriptions', section: 'subscriptions', icon: CreditCard },
  { label: 'View Audit Logs', section: 'audit', icon: ScrollText },
  { label: 'Analytics Dashboard', section: 'analytics', icon: BarChart3 },
  { label: 'Consent Management', section: 'consent', icon: CheckCircle },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, { data: logs }] = await Promise.all([
          getDashboardStats(),
          getAuditLogs(),
        ]);
        setStats(s);
        setAuditLogs(logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-lg font-medium">Unable to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const recentAudits = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name || 'Admin'}
          </p>
        </div>
        <Badge variant="primary" className="w-fit">
          <Activity className="mr-1 h-3 w-3" />
          System Overview
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color, suffix }) => {
          const raw = stats[key as keyof DashboardStats] as number;
          const value = key === 'avg_sustainability_score' ? Math.round(raw) : raw;
          const trend = key === 'total_users' ? stats.user_growth : undefined;

          return (
            <Card key={key}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2.5 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {trend !== undefined && (
                    <Badge variant="primary" className="flex items-center gap-0.5 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      {trend}%
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {value.toLocaleString()}{suffix || ''}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map(({ label, section, icon: Icon }) => (
          <Button
            key={section}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push(`/dashboard/admin/${section}`)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Two-column Middle Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Audit Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-amber-500" />
              Recent Audit Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                <Shield className="h-8 w-8" />
                <p className="text-sm">No audit events recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm">
                    <div className="mt-0.5 rounded-full bg-amber-100 p-1.5">
                      <Shield className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 capitalize">{log.action.replace(/_/g, ' ')}</p>
                      <p className="truncate text-xs text-gray-500">{log.resource}</p>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {timeAgo(log.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-4 inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100/50 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.user_growth}%
              </div>
              <p className="mt-1 text-sm text-gray-500">Growth rate this quarter</p>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-gray-400">
                User adoption is steadily increasing across all regions, driven by new AI-powered features and expanded outreach programs in East Africa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: System Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Disease Resolution Rate
                </span>
                <span className="font-medium text-gray-900">
                  {Math.round(stats.disease_resolution_rate * 100)}%
                </span>
              </div>
              <Progress value={Math.round(stats.disease_resolution_rate * 100)} className="h-2.5" />
              <p className="text-xs text-gray-400">
                {stats.disease_resolution_rate >= 0.7
                  ? 'Excellent resolution rate — AI diagnoses are proving effective.'
                  : 'Room for improvement in disease case resolution.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  User Growth Rate
                </span>
                <span className="font-medium text-gray-900">{stats.user_growth}%</span>
              </div>
              <Progress value={stats.user_growth} className="h-2.5" />
              <p className="text-xs text-gray-400">
                Steady growth across all user segments — farmers, officers, and administrators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
