'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, getFarms, getDiseaseReports, getDashboardStats } from '@/lib/db';
import type { User, Farm, DiseaseReport, DashboardStats } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, Building2, AlertTriangle, FileSearch, BarChart3, ScrollText,
  MapPin, Clock, CheckCircle, TrendingUp, Activity, Eye,
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, { data: usersData }, { data: farmsData }, { data: reportsData }] = await Promise.all([
          getDashboardStats(),
          getUsers(),
          getFarms(),
          getDiseaseReports(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setFarms(farmsData);
        setDiseaseReports(reportsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const farmersCount = users.filter((u) => u.role === 'farmer').length;
  const activeFarms = farms.filter((f) => f.status === 'active').length;
  const resolvedCases = diseaseReports.filter((r) => r.status === 'resolved').length;
  const pendingCount = diseaseReports.filter((r) => r.status === 'submitted').length;
  const resolutionRate = diseaseReports.length > 0 ? Math.round((resolvedCases / diseaseReports.length) * 100) : 0;

  const getFarmerName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || 'Unknown Farmer';

  const getFarmLocation = (farmId: string) =>
    farms.find((f) => f.id === farmId)?.location || 'Unknown Region';

  const latestReports = [...diseaseReports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const pendingReviews = diseaseReports
    .filter((r) => r.status === 'submitted')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const regionCounts: Record<string, number> = {};
  farms.forEach((farm) => {
    if (farm.location) {
      regionCounts[farm.location] = (regionCounts[farm.location] || 0) + 1;
    }
  });

  const riskBadgeClass = (level?: string) => {
    switch (level) {
      case 'low': return 'border-transparent bg-emerald-100 text-emerald-800';
      case 'medium': return 'border-transparent bg-amber-100 text-amber-800';
      case 'high': return 'border-transparent bg-red-100 text-red-800';
      case 'critical': return 'border-transparent bg-purple-100 text-purple-800';
      default: return 'border-transparent bg-gray-100 text-gray-800';
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'border-transparent bg-emerald-100 text-emerald-800';
      case 'reviewed': return 'border-transparent bg-blue-100 text-blue-800';
      case 'submitted': return 'border-transparent bg-amber-100 text-amber-800';
      default: return '';
    }
  };

  const quickActions = [
    { label: t('dashboard.officer.quickActions.viewFarmers'), icon: Users, href: '/dashboard/officer/farmers', desc: t('dashboard.officer.quickActions.viewFarmersDesc') },
    { label: t('dashboard.officer.quickActions.monitorDiseases'), icon: AlertTriangle, href: '/dashboard/officer/disease', desc: t('dashboard.officer.quickActions.monitorDiseasesDesc') },
    { label: t('dashboard.officer.quickActions.generateReports'), icon: ScrollText, href: '/dashboard/officer/reports', desc: t('dashboard.officer.quickActions.generateReportsDesc') },
    { label: t('dashboard.officer.quickActions.regionalAnalytics'), icon: BarChart3, href: '/dashboard/officer/analytics', desc: t('dashboard.officer.quickActions.regionalAnalyticsDesc') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.officer.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.officer.welcomeBack', { name: user?.name || 'Officer' })}</p>
        </div>
        <Badge variant="primary" className="text-xs w-fit">
          <Clock className="mr-1 h-3 w-3" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.farmersMonitored')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{farmersCount}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{t('dashboard.officer.thisMonth', { value: stats?.user_growth ?? 0 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.activeFarms')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeFarms}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-blue-600">
              <Activity className="h-3 w-3" />
              <span>{t('dashboard.officer.totalRegistered', { count: farms.length })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.diseaseReports')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{diseaseReports.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{t('dashboard.officer.pendingReview', { count: pendingCount })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.resolvedCases')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{resolvedCases}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-600 font-medium">{t('dashboard.officer.resolutionRate', { value: resolutionRate })}</span>
              </div>
              <Progress value={resolutionRate} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('common.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant="outline"
                  className="h-auto flex-col items-start gap-3 p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                  onClick={() => router.push(action.href)}
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Disease Reports */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">{t('dashboard.officer.recentReports')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => router.push('/dashboard/officer/disease')}>
                <Eye className="h-4 w-4 mr-1" />
                {t('common.seeAll')}
              </Button>
            </CardHeader>
            <CardContent>
              {latestReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileSearch className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.noReports')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.officer.noReportsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {latestReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{getFarmerName(report.user_id)}</p>
                          <span className="text-xs text-gray-300">•</span>
                          <p className="text-xs text-gray-500">{report.crop_type}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{getFarmLocation(report.farm_id)}</span>
                        </div>
                        {report.disease_prediction && (
                          <p className="text-xs text-gray-600 mt-1">
                            {t('dashboard.officer.prediction')} <span className="font-medium">{report.disease_prediction}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge className={riskBadgeClass(report.risk_level)}>
                          {report.risk_level || 'unknown'}
                        </Badge>
                        <Badge className={statusBadgeClass(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Regional Overview */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('dashboard.officer.regionalOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(regionCounts).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.noRegions')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.officer.noRegionsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(regionCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([region, count]) => (
                      <div key={region} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{region}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                          <span className="text-xs text-gray-500">{t('dashboard.officer.farms')}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">{t('dashboard.officer.pendingReviews')}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.officer.pendingReviewsDesc')}</p>
          </div>
          {pendingReviews.length > 0 && (
            <Badge variant="warning">{t('dashboard.officer.countPending', { count: pendingReviews.length })}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.allCaughtUp')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.officer.noPendingReviews')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{getFarmerName(report.user_id)}</p>
                      <span className="text-xs text-gray-300">•</span>
                      <p className="text-xs text-gray-500">{report.crop_type}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500">{getFarmLocation(report.farm_id)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {report.disease_prediction && (
                      <p className="text-xs text-gray-600 mt-1">
                        Prediction: <span className="font-medium">{report.disease_prediction}</span>
                        {report.confidence_score !== undefined && (
                          <span className="text-gray-400"> ({t('dashboard.officer.confidence', { value: Math.round(report.confidence_score * 100) })})</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge className={riskBadgeClass(report.risk_level)}>
                      {report.risk_level || 'unknown'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/officer/disease')}>
                      {t('dashboard.officer.review')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
