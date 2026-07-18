'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useFormat } from '@/lib/use-format';
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { timeAgo, formatNumber, formatPercentage } = useFormat();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const statCards: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string; suffix?: string }[] = [
    { key: 'total_users', label: t('dashboard.admin.totalUsers'), icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { key: 'total_farms', label: t('dashboard.admin.totalFarms'), icon: Building2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { key: 'total_crops', label: t('dashboard.admin.totalCrops'), icon: Sprout, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
    { key: 'total_disease_reports', label: t('dashboard.admin.totalDiseaseReports'), icon: FileSearch, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
    { key: 'weather_alerts', label: t('common.notifications'), icon: CloudSun, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400' },
    { key: 'ai_requests', label: t('dashboard.aiInsights'), icon: ScrollText, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
    { key: 'audit_events', label: t('dashboard.admin.auditLog'), icon: Shield, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { key: 'avg_sustainability_score', label: t('common.sustainability'), icon: Leaf, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400', suffix: '%' },
  ];

  const quickActions = [
    { label: t('dashboard.admin.users'), section: 'users', icon: Users },
    { label: t('dashboard.admin.testimonials'), section: 'testimonials', icon: Star },
    { label: t('dashboard.admin.contacts'), section: 'contacts', icon: MessageCircle },
    { label: t('dashboard.admin.tickets'), section: 'tickets', icon: Shield },
    { label: t('dashboard.admin.subscriptions'), section: 'subscriptions', icon: CreditCard },
    { label: t('dashboard.admin.auditLog'), section: 'audit', icon: ScrollText },
    { label: t('dashboard.admin.analytics'), section: 'analytics', icon: BarChart3 },
    { label: t('dashboard.admin.consent'), section: 'consent', icon: CheckCircle },
  ];

  useEffect(() => {
    async function load() {
      try {
        const [s, { data: logs }] = await Promise.all([
          getDashboardStats(),
          getAuditLogs(),
        ]);
        setStats(s);
        if (logs) setAuditLogs(logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch {
        toast.error(t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[var(--muted-foreground)]">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-lg font-medium">{t('common.somethingWentWrong')}</p>
        <Button onClick={() => window.location.reload()}>{t('common.refresh')}</Button>
      </div>
    );
  }

  const recentAudits = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('dashboard.admin.title')}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('common.welcomeMessage')}, {user?.name || t('dashboard.admin.fallbackName')}
          </p>
        </div>
        <Badge variant="primary" className="w-fit">
          <Activity className="mr-1 h-3 w-3" />
          {t('dashboard.admin.systemStatus')}
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
                  <div className={`rounded-xl p-2.5 ${color}`}>
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
                  <div className="text-2xl font-bold text-[var(--foreground)] stat-highlight">
                    {formatNumber(value)}{suffix || ''}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{label}</p>
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
            className="flex items-center gap-2 border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
              {t('dashboard.admin.auditLog')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-[var(--muted-foreground)]">
                <Shield className="h-8 w-8" />
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-sm">
                    <div className="mt-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
                      <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] capitalize">{t(`dashboard.admin.auditActions.${log.action}`) || log.action.replace(/_/g, ' ')}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">{log.resource}</p>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap text-xs text-[var(--muted-foreground)]">
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
              {t('dashboard.admin.userGrowth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-4 inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--foreground)] stat-highlight">
                {stats.user_growth}%
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('dashboard.admin.growthRate')}</p>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--muted-foreground)]">
                {t('dashboard.admin.allSystemsOperational')}
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
            {t('common.overview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[var(--foreground)]">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {t('dashboard.officer.resolutionRate')}
                </span>
                <span className="font-medium text-[var(--foreground)]">
                  {formatPercentage(stats.disease_resolution_rate)}
                </span>
              </div>
              <Progress value={Math.round(stats.disease_resolution_rate * 100)} className="h-2.5" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[var(--foreground)]">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  {t('dashboard.admin.growthRate')}
                </span>
                <span className="font-medium text-[var(--foreground)]">{stats.user_growth}%</span>
              </div>
              <Progress value={stats.user_growth} className="h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
