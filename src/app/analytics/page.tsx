'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, Leaf, AlertTriangle,
  Users, Sprout, Download, LineChart, PieChart, Activity,
} from 'lucide-react';
import {
  LineChart as ReLineChart, Line, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { getDiseaseReports, getYieldRecords, getUsers, getSustainabilityScores, getDashboardStats } from '@/lib/db';
import type { YieldRecord, DiseaseReport, User, SustainabilityScore, DashboardStats } from '@/types';

const COLORS = ['#0f766e', '#14b8a6', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
const PIE_COLORS = ['#0f766e', '#f59e0b', '#ef4444'];

function groupByMonth<T extends { created_at: string }>(items: T[], valueKey: keyof T): { month: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const month = item.created_at.slice(0, 7);
    const val = Number(item[valueKey]) || 1;
    map.set(month, (map.get(month) || 0) + val);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [yieldRecords, setYieldRecords] = useState<YieldRecord[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sustainabilityScores, setSustainabilityScores] = useState<SustainabilityScore[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [s, { data: y }, { data: d }, { data: u }, ss] = await Promise.all([
          getDashboardStats(),
          getYieldRecords(),
          getDiseaseReports(),
          getUsers(),
          getSustainabilityScores(),
        ]);
        setStats(s);
        setYieldRecords(y);
        setDiseaseReports(d);
        setUsers(u);
        setSustainabilityScores(ss);
      } catch (err) {
        toast.error(t('adminAnalytics.failedToLoad'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const yieldByMonth = groupByMonth(yieldRecords, 'yield_kg' as keyof YieldRecord);

  const diseaseByCrop = diseaseReports.reduce<Record<string, number>>((acc, r) => {
    const crop = r.crop_type || t('common.unknown');
    acc[crop] = (acc[crop] || 0) + 1;
    return acc;
  }, {});
  const diseaseChartData = Object.entries(diseaseByCrop)
    .map(([crop, count]) => ({ crop, count }))
    .sort((a, b) => b.count - a.count);

  const userByMonth = groupByMonth(users, 'created_at' as keyof User);

  const good = sustainabilityScores.filter((s) => s.overall_score > 0.7).length;
  const fair = sustainabilityScores.filter((s) => s.overall_score >= 0.4 && s.overall_score <= 0.7).length;
  const poor = sustainabilityScores.filter((s) => s.overall_score < 0.4).length;
  const sustainabilityPieData = [
    { name: t('analyticsPage.good'), value: good },
    { name: t('analyticsPage.fair'), value: fair },
    { name: t('analyticsPage.poor'), value: poor },
  ];

  const avgSoilHealth = sustainabilityScores.length
    ? sustainabilityScores.reduce((a, b) => a + b.soil_health, 0) / sustainabilityScores.length
    : 0;
  const avgWaterUsage = sustainabilityScores.length
    ? sustainabilityScores.reduce((a, b) => a + b.water_usage, 0) / sustainabilityScores.length
    : 0;
  const avgBiodiversity = sustainabilityScores.length
    ? sustainabilityScores.reduce((a, b) => a + b.biodiversity, 0) / sustainabilityScores.length
    : 0;

  const totalYield = yieldRecords.reduce((a, b) => a + b.yield_kg, 0);
  const avgYield = yieldRecords.length ? totalYield / yieldRecords.length : 0;
  const totalDiseases = diseaseReports.length;
  const resolvedDiseases = diseaseReports.filter((r) => r.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('adminAnalytics.analyticsDashboard')}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('adminAnalytics.analyticsDescription')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              {t('adminAnalytics.exportReport')}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              {t('adminAnalytics.liveData')}
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('adminAnalytics.totalYield')}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{totalYield.toLocaleString()} {t('common.units.kg')}</p>
                  <p className="mt-1 text-xs text-gray-400">{t('adminAnalytics.avgPerRecord', { avg: avgYield.toFixed(1) })}</p>
                </div>
                <div className="rounded-lg bg-[#e2f0ee] p-3">
                  <Sprout className="h-5 w-5 text-[#0f766e]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('adminAnalytics.diseaseReports')}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{totalDiseases}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {t('adminAnalytics.resolvedWithPercent', { resolved: resolvedDiseases, percent: totalDiseases > 0 ? ((resolvedDiseases / totalDiseases) * 100).toFixed(0) : 0 })}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('adminAnalytics.totalUsers')}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#0f766e]">
                    <TrendingUp className="h-3 w-3" />
                    {t('adminAnalytics.percentGrowth', { growth: stats?.user_growth ?? 0 })}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('analyticsPage.avgSustainability')}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {stats ? (stats.avg_sustainability_score * 100).toFixed(0) : 0}%
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {t('analyticsPage.farmsScored', { count: sustainabilityScores.length })}
                  </p>
                </div>
                <div className="rounded-lg bg-[#e2f0ee] p-3">
                  <Leaf className="h-5 w-5 text-[#0f766e]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="yield" className="space-y-6">
          <TabsList>
            <TabsTrigger value="yield" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('analyticsPage.yieldTrends')}
            </TabsTrigger>
            <TabsTrigger value="disease" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('analyticsPage.diseaseTrends')}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('analyticsPage.userGrowthTab')}
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="gap-2">
              <Leaf className="h-4 w-4" />
              {t('analyticsPage.sustainabilityTab')}
            </TabsTrigger>
          </TabsList>

          {/* Yield Trends */}
          <TabsContent value="yield" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Sprout className="h-4 w-4 text-[#0f766e]" />
                    {t('analyticsPage.totalYield')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{totalYield.toLocaleString()} {t('common.units.kg')}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#0f766e]">
                    <TrendingUp className="h-3 w-3" />
                    {t('analyticsPage.acrossAllRecords')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <BarChart3 className="h-4 w-4 text-[#0f766e]" />
                    {t('analyticsPage.avgYield')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{avgYield.toFixed(1)} {t('common.units.kg')}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    {t('analyticsPage.perHarvestRecord')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <LineChart className="h-4 w-4 text-[#0f766e]" />
                    {t('analyticsPage.records')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{yieldRecords.length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    {t('analyticsPage.yieldDataPoints')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('analyticsPage.yieldOverTime')}</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('common.download')}
                </Button>
              </CardHeader>
              <CardContent>
                {yieldByMonth.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <BarChart3 className="mb-2 h-8 w-8" />
                    <p className="text-sm">{t('analyticsPage.noYieldData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReLineChart data={yieldByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={{ fill: '#0f766e', r: 4 }}
                        activeDot={{ r: 6 }}
                        name={t('analyticsPage.yieldKg')}
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disease Trends */}
          <TabsContent value="disease" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    {t('analyticsPage.totalReports')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{totalDiseases}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    {t('analyticsPage.allDiseaseReports')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Badge variant="primary" className="rounded-full px-1.5 py-0">R</Badge>
                    {t('analyticsPage.resolved')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{resolvedDiseases}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#0f766e]">
                    <TrendingUp className="h-3 w-3" />
                    {t('analyticsPage.resolutionPercent', { percent: totalDiseases > 0 ? ((resolvedDiseases / totalDiseases) * 100).toFixed(0) : 0 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Activity className="h-4 w-4 text-amber-500" />
                    {t('analyticsPage.cropsAffected')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(diseaseByCrop).length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    {t('analyticsPage.distinctCropTypes')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('analyticsPage.diseaseByCropType')}</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('common.download')}
                </Button>
              </CardHeader>
              <CardContent>
                {diseaseChartData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <AlertTriangle className="mb-2 h-8 w-8" />
                    <p className="text-sm">{t('analyticsPage.noDiseaseData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReBarChart data={diseaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="crop" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="count" name={t('analyticsPage.reports')} radius={[4, 4, 0, 0]}>
                        {diseaseChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Growth */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Users className="h-4 w-4 text-blue-500" />
                    {t('analyticsPage.totalUsers')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#0f766e]">
                    <TrendingUp className="h-3 w-3" />
                    {t('analyticsPage.percentGrowth', { growth: stats?.user_growth ?? 0 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0">F</Badge>
                    {t('analyticsPage.farmers')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === 'farmer').length}
                  </p>
                  <div className="mt-1 text-xs text-gray-400">{t('analyticsPage.primaryUsers')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <LineChart className="h-4 w-4 text-blue-500" />
                    {t('analyticsPage.monthsActive')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{userByMonth.length}</p>
                  <div className="mt-1 text-xs text-gray-400">{t('analyticsPage.withRegistrations')}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('analyticsPage.userRegistrationsOverTime')}</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('common.download')}
                </Button>
              </CardHeader>
              <CardContent>
                {userByMonth.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <Users className="mb-2 h-8 w-8" />
                    <p className="text-sm">{t('analyticsPage.noUserData')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReLineChart data={userByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                        name={t('analyticsPage.newUsers')}
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sustainability */}
          <TabsContent value="sustainability" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Leaf className="h-4 w-4 text-[#0f766e]" />
                    {t('analyticsPage.soilHealth')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{(avgSoilHealth * 100).toFixed(0)}%</p>
                  <Progress value={avgSoilHealth * 100} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Activity className="h-4 w-4 text-blue-500" />
                    {t('analyticsPage.waterUsage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{(avgWaterUsage * 100).toFixed(0)}%</p>
                  <Progress value={avgWaterUsage * 100} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Sprout className="h-4 w-4 text-amber-500" />
                    {t('analyticsPage.biodiversity')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{(avgBiodiversity * 100).toFixed(0)}%</p>
                  <Progress value={avgBiodiversity * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('analyticsPage.sustainabilityDistribution')}</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('common.download')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {sustainabilityScores.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                      <PieChart className="mb-2 h-8 w-8" />
                      <p className="text-sm">{t('analyticsPage.noSustainabilityData')}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <RePieChart>
                        <Pie
                          data={sustainabilityPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {sustainabilityPieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analyticsPage.scoreBreakdown')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#e2f0ee]0" />
                        {t('analyticsPage.good')}
                      </span>
                      <span className="font-medium text-gray-900">{good}</span>
                    </div>
                    <Progress value={(good / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {t('analyticsPage.percentOfFarms', { percent: sustainabilityScores.length > 0
                        ? ((good / sustainabilityScores.length) * 100).toFixed(0)
                        : 0 })}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        {t('analyticsPage.fair')}
                      </span>
                      <span className="font-medium text-gray-900">{fair}</span>
                    </div>
                    <Progress value={(fair / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {t('analyticsPage.percentOfFarms', { percent: sustainabilityScores.length > 0
                        ? ((fair / sustainabilityScores.length) * 100).toFixed(0)
                        : 0 })}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        {t('analyticsPage.poor')}
                      </span>
                      <span className="font-medium text-gray-900">{poor}</span>
                    </div>
                    <Progress value={(poor / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {t('analyticsPage.percentOfFarms', { percent: sustainabilityScores.length > 0
                        ? ((poor / sustainabilityScores.length) * 100).toFixed(0)
                        : 0 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
