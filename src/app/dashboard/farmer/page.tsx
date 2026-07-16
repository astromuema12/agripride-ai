'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useFormat } from '@/lib/use-format';
import {
  getFarms, getCrops, getDiseaseReports,
  getRecommendations, getWeatherData,
  getNotifications,
} from '@/lib/db';
import type {
  Farm, Crop, DiseaseReport, Recommendation, WeatherData, Notification,
} from '@/types';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sprout, CloudSun, FileSearch, ScrollText, Leaf,
  Bell, ArrowRight, ThermometerSun,
  Droplets, Wind, TrendingUp, Plus,
  MapPin, Calendar, AlertTriangle, CheckCircle2,
  Wheat, Sun, Moon, Sunrise,
  Activity, Zap, Users, DollarSign,
} from 'lucide-react';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-4 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk?: DiseaseReport['risk_level'] }) {
  const { t } = useI18n();
  if (!risk) return null;
  const map: Record<string, { variant: 'destructive' | 'warning' | 'primary' | 'default'; label: string }> = {
    critical: { variant: 'destructive', label: t('dashboard.farmer.critical') },
    high: { variant: 'destructive', label: t('dashboard.farmer.high') },
    medium: { variant: 'warning', label: t('dashboard.farmer.medium') },
    low: { variant: 'primary', label: t('dashboard.farmer.low') },
  };
  const { variant, label } = map[risk] ?? map.low;
  return <Badge variant={variant}>{label}</Badge>;
}

function TypeBadge({ type }: { type: Recommendation['type'] }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'primary' | 'destructive' | 'secondary' | 'default'; label: string }> = {
    crop_advisor: { variant: 'primary', label: t('assistant.categories.cropAdvisor') },
    disease: { variant: 'destructive', label: t('assistant.categories.disease') },
    weather: { variant: 'secondary', label: t('assistant.categories.weather') },
    general: { variant: 'default', label: t('assistant.categories.general') },
  };
  const { variant, label } = map[type] ?? map.general;
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: DiseaseReport['status'] }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'warning' | 'secondary' | 'primary'; label: string }> = {
    submitted: { variant: 'warning', label: t('dashboard.farmer.submitted') },
    reviewed: { variant: 'secondary', label: t('dashboard.farmer.reviewed') },
    resolved: { variant: 'primary', label: t('dashboard.farmer.resolved') },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function ConfidenceScore({ score }: { score?: number }) {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="w-20" />
      <span className={`text-xs font-medium ${color}`}>{pct}%</span>
    </div>
  );
}

function FarmHealthScore({ score }: { score: number }) {
  const { t } = useI18n();
  const healthColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = score >= 80 ? '#14b8a6' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="36" cy="36" r="30"
            fill="none" stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            strokeDashoffset={2 * Math.PI * 30 * (1 - score / 100)}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className={`absolute text-xl font-bold ${healthColor} stat-highlight`}>{Math.round(score)}</span>
      </div>
      <div>
        <p className="text-sm font-medium font-body text-[var(--foreground)]">{t('dashboard.farmer.farmHealth')}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {score >= 80 ? t('dashboard.farmer.excellentCondition') : score >= 60 ? t('dashboard.farmer.needsAttention') : t('dashboard.farmer.atRisk')}
        </p>
      </div>
    </div>
  );
}

function WeatherIcon({ condition }: { condition: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    sunny: <Sun className="h-8 w-8 text-amber-400" />,
    cloudy: <CloudSun className="h-8 w-8 text-slate-400" />,
    rainy: <Droplets className="h-8 w-8 text-blue-400" />,
    stormy: <AlertTriangle className="h-8 w-8 text-red-400" />,
  };
  const key = condition.toLowerCase().includes('rain') ? 'rainy'
    : condition.toLowerCase().includes('cloud') || condition.toLowerCase().includes('overcast') ? 'cloudy'
    : condition.toLowerCase().includes('storm') || condition.toLowerCase().includes('thunder') ? 'stormy'
    : 'sunny';
  return iconMap[key] || iconMap.sunny;
}

function Greeting({ name }: { name: string }) {
  const { t } = useI18n();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('common.goodMorning') : hour < 17 ? t('common.goodAfternoon') : t('common.goodEvening');
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl text-[var(--foreground)]">{greeting}, {name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('dashboard.executiveSummary')}</p>
    </div>
  );
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { formatDate, formatDateShort, timeAgo, formatCompact } = useFormat();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;
    async function load() {
      try {
        const [{ data: userFarms }, { data: allCrops }, { data: allReports }, { data: userRecs }, weatherArr, { data: notifs }] = await Promise.all([
          getFarms(currentUser!.id),
          getCrops(),
          getDiseaseReports(),
          getRecommendations(currentUser!.id),
          getWeatherData(),
          getNotifications(currentUser!.id),
        ]);
        if (cancelled) return;
        const farmIds = userFarms.map((f) => f.id);
        setFarms(userFarms);
        setCrops(allCrops.filter((c) => farmIds.includes(c.farm_id)));
        setReports(allReports.filter((r) => r.user_id === currentUser!.id));
        setRecommendations(userRecs);
        setWeather(weatherArr.length > 0 ? weatherArr[0] : null);
        setNotifications(notifs);
      } catch {
        if (!cancelled) toast.error(t('common.somethingWentWrong'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, t]);

  const healthScore = useMemo(() => {
    if (crops.length === 0) return 50;
    const activeRatio = crops.filter(c => c.status === 'growing').length / crops.length;
    const resolvedRatio = reports.length > 0 ? reports.filter(r => r.status === 'resolved').length / reports.length : 1;
    const alertPenalty = reports.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length * 5;
    return Math.max(0, Math.min(100, Math.round((activeRatio * 40 + resolvedRatio * 40 + 20) - alertPenalty)));
  }, [crops, reports]);

  const activeCrops = useMemo(() => crops.filter((c) => c.status === 'growing'), [crops]);
  const harvestedCrops = useMemo(() => crops.filter((c) => c.status === 'harvested'), [crops]);
  const failedCrops = useMemo(() => crops.filter((c) => c.status === 'failed'), [crops]);

  const recentRecs = useMemo(() =>
    [...recommendations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3),
    [recommendations]
  );

  const recentReports = useMemo(() =>
    [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3),
    [reports]
  );

  const unreadNotifications = useMemo(() =>
    notifications.filter(n => !n.is_read),
    [notifications]
  );

  const todayTasks = useMemo(() => {
    const tasks: { label: string; icon: React.ReactNode; href: string }[] = [];
    if (unreadNotifications.length > 0) {
      tasks.push({ label: t('dashboard.farmer.unreadNotifications', { count: unreadNotifications.length }), icon: <Bell className="h-4 w-4" />, href: '/dashboard/notifications' });
    }
    if (reports.some(r => r.status === 'submitted')) {
      tasks.push({ label: t('dashboard.farmer.reviewPending'), icon: <FileSearch className="h-4 w-4" />, href: '/dashboard/farmer/disease' });
    }
    if (activeCrops.length > 0) {
      tasks.push({ label: t('dashboard.farmer.monitorCrops', { count: activeCrops.length }), icon: <Sprout className="h-4 w-4" />, href: '/dashboard/farmer/crops' });
    }
    if (weather && weather.forecast && weather.forecast.some(f => (f.rainfall_chance || 0) > 70)) {
      tasks.push({ label: t('dashboard.farmer.heavyRainExpected'), icon: <CloudSun className="h-4 w-4" />, href: '/dashboard/farmer/weather' });
    }
    return tasks;
  }, [unreadNotifications, reports, activeCrops, weather, t]);

  if (loading) return <PageSkeleton />;
  if (!user) return null;

  const kpis = [
    { icon: Sprout, label: t('dashboard.farmer.totalFarms'), value: farms.length, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { icon: Leaf, label: t('dashboard.farmer.totalCrops'), value: crops.length, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { icon: FileSearch, label: t('dashboard.farmer.activeAlerts'), value: reports.filter(r => r.status !== 'resolved').length, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { icon: ScrollText, label: t('common.recommended'), value: recommendations.length, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  ];

  const quickActions = [
    { label: t('dashboard.farmer.addFarm'), icon: Plus, href: '/dashboard/farmer/farms', variant: 'default' as const },
    { label: t('dashboard.farmer.diseaseDetection'), icon: FileSearch, href: '/dashboard/farmer/disease', variant: 'secondary' as const },
    { label: t('dashboard.farmer.weather'), icon: CloudSun, href: '/dashboard/farmer/weather', variant: 'outline' as const },
    { label: t('dashboard.farmer.aiAssistant'), icon: Zap, href: '/dashboard/farmer/assistant', variant: 'outline' as const },
    { label: t('dashboard.farmer.yieldPredictor'), icon: TrendingUp, href: '/dashboard/farmer/yield-predictor', variant: 'outline' as const },
    { label: t('dashboard.farmer.sustainability'), icon: Leaf, href: '/dashboard/farmer/sustainability', variant: 'outline' as const },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header with greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Greeting name={user.name} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/notifications')} className="relative">
            <Bell className="mr-2 h-4 w-4" />
            {t('common.notifications')}
            {unreadNotifications.length > 0 && (
              <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Farm Health Score + KPI Grid */}
      <div className="grid gap-4 lg:grid-cols-5 stagger-grid">
        <Card className="lg:col-span-1 premium-card">
          <CardContent className="p-5">
            <FarmHealthScore score={healthScore} />
          </CardContent>
        </Card>
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="lg:col-span-1 premium-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium font-body text-[var(--muted-foreground)]">{kpi.label}</p>
                <p className="text-xl font-bold text-[var(--foreground)] stat-highlight">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            onClick={() => router.push(action.href)}
            className="active-scale"
          >
            <action.icon className="mr-1.5 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Recommendations + Disease */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tasks */}
          {todayTasks.length > 0 && (
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
                <CardTitle className="text-sm font-semibold font-body flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  {t('dashboard.todayTasks')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 pt-0">
                <div className="space-y-2">
                  {todayTasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(task.href)}
                      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors active-scale"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {task.icon}
                      </span>
                      <span className="text-[var(--foreground)]">{task.label}</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disease Alerts */}
          {reports.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length > 0 && (
            <Card className="border-red-200 dark:border-red-900/50 premium-card">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
                <CardTitle className="text-sm font-semibold font-body flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  {t('disease.diseaseAlert')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 pt-0">
                <div className="space-y-2">
                  {reports.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{r.crop_type}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{r.disease_prediction || t('dashboard.farmer.analysisPending')}</p>
                      </div>
                      <RiskBadge risk={r.risk_level} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent AI Recommendations */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-semibold font-body">{t('dashboard.aiInsights')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/recommendations')}>
                {t('common.seeAll')}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {recentRecs.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ScrollText className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">{t('recommendations.noRecommendations')}</p>
                  <Button variant="link" size="sm" className="mt-1" onClick={() => router.push('/dashboard/farmer/recommendations')}>
                    {t('common.getStarted')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRecs.map((rec) => (
                    <div key={rec.id} className="rounded-lg border border-[var(--border)] p-4 transition-colors hover:bg-[var(--muted)] content-fade-in">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5">
                            <TypeBadge type={rec.type} />
                          </div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{rec.title}</p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">{rec.content}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <ConfidenceScore score={rec.confidence_score} />
                        <span className="text-xs text-[var(--muted-foreground)]">{timeAgo(rec.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Disease Reports */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-semibold font-body">{t('disease.history')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/disease')}>
                {t('common.seeAll')}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {recentReports.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileSearch className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">{t('disease.noHistory')}</p>
                  <Button variant="link" size="sm" className="mt-1" onClick={() => router.push('/dashboard/farmer/disease')}>
                    {t('disease.analyze')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--foreground)]">{report.crop_type}</span>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
                          {report.disease_prediction || t('dashboard.farmer.pendingAnalysis')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <RiskBadge risk={report.risk_level} />
                        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">{timeAgo(report.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Weather + Crop Status */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-semibold font-body">{t('weather.sevenDayForecast')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/weather')}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {!weather ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CloudSun className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">{t('common.noData')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <WeatherIcon condition={weather.condition} />
                        <div>
                          <p className="text-2xl font-bold text-[var(--foreground)]">{weather.temperature}&deg;C</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{weather.condition}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-[var(--muted-foreground)]" />
                            <span className="text-xs text-[var(--muted-foreground)]">{weather.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-emerald-200/50 dark:border-emerald-800/30 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                        <span>{weather.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
                        <Wind className="h-3.5 w-3.5 text-cyan-500" />
                        <span>{weather.wind_speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
                        <ThermometerSun className="h-3.5 w-3.5 text-amber-500" />
                        <span>{weather.rainfall_mm} mm</span>
                      </div>
                    </div>
                  </div>

                  {weather.forecast && weather.forecast.length > 0 && (
                    <div className="overflow-x-auto -mx-1 px-1">
                      <div className="grid grid-cols-7 gap-1 min-w-[280px]">
                        {weather.forecast.slice(0, 7).map((day) => (
                          <div key={day.date} className="flex flex-col items-center rounded-lg px-1 py-2 text-center hover:bg-[var(--muted)] transition-colors">
                            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">{formatDateShort(day.date)}</span>
                            <CloudSun className="my-1 h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-[var(--foreground)]">{day.temp_high}&deg;</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">{day.temp_low}&deg;</span>
                            <span className="text-[10px] text-blue-500">{day.rainfall_chance}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regional Risk Intelligence */}
          {reports.length > 0 && (
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
                <CardTitle className="text-sm font-semibold font-body flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {t('riskWidget.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 pt-0">
                <div className="space-y-3">
                  {(() => {
                    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
                    const riskCounts: Record<string, { risk: keyof typeof riskOrder; count: number }> = {};
                    reports.forEach(r => {
                      const crop = r.crop_type || t('common.unknown');
                      const rl = (r.risk_level || 'low') as keyof typeof riskOrder;
                      const prev = riskCounts[crop];
                      if (!prev || riskOrder[rl] < riskOrder[prev.risk]) {
                        riskCounts[crop] = { risk: rl, count: (prev?.count || 0) + 1 };
                      } else {
                        riskCounts[crop] = { risk: prev.risk, count: prev.count + 1 };
                      }
                    });
                    const sorted = Object.entries(riskCounts).sort(([, a], [, b]) => {
                      const order = { critical: 0, high: 1, medium: 2, low: 3 };
                      return (order[a.risk] || 99) - (order[b.risk] || 99);
                    }).slice(0, 5);
                    return sorted.map(([crop, data]) => {
                      const riskColors: Record<string, string> = {
                        critical: 'bg-red-500',
                        high: 'bg-orange-500',
                        medium: 'bg-amber-400',
                        low: 'bg-green-400',
                      };
                      const badgeVariants: Record<string, { variant: 'destructive' | 'warning' | 'primary' | 'default'; label: string }> = {
                        critical: { variant: 'destructive', label: t('riskWidget.critical') },
                        high: { variant: 'destructive', label: t('riskWidget.high') },
                        medium: { variant: 'warning', label: t('riskWidget.medium') },
                        low: { variant: 'primary', label: t('riskWidget.low') },
                      };
                      const bv = badgeVariants[data.risk] || badgeVariants.low;
                      return (
                        <div key={crop} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${riskColors[data.risk] || 'bg-gray-300 dark:bg-gray-500'}`} />
                            <span className="text-sm font-medium text-[var(--foreground)]">{crop}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">({data.count})</span>
                          </div>
                          <Badge variant={bv.variant}>{bv.label}</Badge>
                        </div>
                      );
                    });
                  })()}
                  <p className="text-[10px] text-[var(--muted-foreground)] text-center pt-1">
                    {t('riskWidget.lastUpdated')}: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crop Status */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-semibold font-body">{t('dashboard.cropStatus')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/crops')}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {crops.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Wheat className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">{t('crops.noCrops')}</p>
                  <Button variant="link" size="sm" className="mt-1" onClick={() => router.push('/dashboard/farmer/crops')}>
                    {t('crops.addCrop')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3">
                      <p className="text-lg font-bold text-emerald-600 stat-highlight">{activeCrops.length}</p>
                      <p className="text-xs text-emerald-600/70">{t('crops.statuses.growing')}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
                      <p className="text-lg font-bold text-blue-600 stat-highlight">{harvestedCrops.length}</p>
                      <p className="text-xs text-blue-600/70">{t('crops.statuses.harvested')}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3">
                      <p className="text-lg font-bold text-red-600 stat-highlight">{failedCrops.length}</p>
                      <p className="text-xs text-red-600/70">{t('crops.statuses.failed')}</p>
                    </div>
                  </div>
                  {activeCrops.slice(0, 4).map((crop) => (
                    <div key={crop.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-[var(--foreground)]">{crop.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{crop.variety}</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">{t('crops.perHectare')}: {formatCompact(crop.expected_yield_kg)} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-semibold font-body">{t('common.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              <div className="space-y-3">
                {recommendations.length === 0 && reports.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Activity className="mb-2 h-6 w-6 text-[var(--muted-foreground)]" />
                    <p className="text-sm text-[var(--muted-foreground)]">{t('dashboard.noActivities')}</p>
                  </div>
                ) : (
                  <>
                    {reports.slice(0, 2).map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                          <FileSearch className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)]">{r.disease_prediction || t('dashboard.farmer.diseaseReportFallback')} - {r.crop_type}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{timeAgo(r.created_at)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                    {recommendations.slice(0, 2).map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                          <Zap className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)] truncate">{r.title}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{timeAgo(r.created_at)}</p>
                        </div>
                        <ConfidenceScore score={r.confidence_score} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
