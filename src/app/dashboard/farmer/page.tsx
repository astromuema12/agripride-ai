'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFarms, getCrops, getDiseaseReports,
  getRecommendations, getWeatherData,
} from '@/lib/db';
import type {
  Farm, Crop, DiseaseReport, Recommendation, WeatherData,
} from '@/types';
import { formatDate } from '@/lib/utils';
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
} from 'lucide-react';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

function RiskBadge({ risk }: { risk?: DiseaseReport['risk_level'] }) {
  if (!risk) return null;
  const map: Record<string, { variant: 'destructive' | 'warning' | 'primary' | 'default'; label: string }> = {
    critical: { variant: 'destructive', label: 'Critical' },
    high: { variant: 'destructive', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low: { variant: 'primary', label: 'Low' },
  };
  const { variant, label } = map[risk];
  return <Badge variant={variant}>{label}</Badge>;
}

function TypeBadge({ type }: { type: Recommendation['type'] }) {
  const map: Record<string, { variant: 'primary' | 'destructive' | 'secondary' | 'default'; label: string }> = {
    crop_advisor: { variant: 'primary', label: 'Crop Advisor' },
    disease: { variant: 'destructive', label: 'Disease' },
    weather: { variant: 'secondary', label: 'Weather' },
    general: { variant: 'default', label: 'General' },
  };
  const { variant, label } = map[type] ?? map.general;
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: DiseaseReport['status'] }) {
  const map: Record<string, { variant: 'warning' | 'secondary' | 'primary'; label: string }> = {
    submitted: { variant: 'warning', label: 'Submitted' },
    reviewed: { variant: 'secondary', label: 'Reviewed' },
    resolved: { variant: 'primary', label: 'Resolved' },
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

export default function FarmerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;

    async function load() {
      try {
        const [{ data: userFarms }, { data: allCrops }, { data: allReports }, { data: userRecs }, weatherArr] = await Promise.all([
          getFarms(currentUser.id),
          getCrops(),
          getDiseaseReports(),
          getRecommendations(currentUser.id),
          getWeatherData(),
        ]);

        if (cancelled) return;

        const farmIds = userFarms.map((f) => f.id);
        setFarms(userFarms);
        setCrops(allCrops.filter((c) => farmIds.includes(c.farm_id)));
        setReports(allReports.filter((r) => r.user_id === currentUser.id));
        setRecommendations(userRecs);
        setWeather(weatherArr.length > 0 ? weatherArr[0] : null);
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <PageSkeleton />;
  if (!user) return null;

  const activeCrops = crops.filter((c) => c.status === 'growing');
  const recentRecs = [...recommendations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const kpis = [
    { icon: Sprout, label: 'Total Farms', value: farms.length, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Leaf, label: 'Active Crops', value: activeCrops.length, color: 'text-green-600 bg-green-50' },
    { icon: FileSearch, label: 'Disease Reports', value: reports.length, color: 'text-red-600 bg-red-50' },
    { icon: ScrollText, label: 'AI Recommendations', value: recommendations.length, color: 'text-blue-600 bg-blue-50' },
  ];

  const quickActions = [
    { label: 'Add Farm', icon: Plus, href: '/dashboard/farmer/farms', variant: 'default' as const },
    { label: 'Diagnose Disease', icon: FileSearch, href: '/dashboard/farmer/disease', variant: 'secondary' as const },
    { label: 'View Weather', icon: CloudSun, href: '/dashboard/farmer/weather', variant: 'outline' as const },
    { label: 'Get AI Advice', icon: TrendingUp, href: '/dashboard/farmer/recommendations', variant: 'outline' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your farming operations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/farmer')}>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            onClick={() => router.push(action.href)}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Two-column: Recommendations + Weather */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent AI Recommendations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent AI Recommendations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/recommendations')}>
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentRecs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ScrollText className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No recommendations yet</p>
                <Button variant="link" size="sm" className="mt-1" onClick={() => router.push('/dashboard/farmer/recommendations')}>
                  Get AI Advice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRecs.map((rec) => (
                  <div key={rec.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1">
                          <TypeBadge type={rec.type} />
                        </div>
                        <p className="truncate text-sm font-medium text-gray-900">{rec.title}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <ConfidenceScore score={rec.confidence_score} />
                      <span className="text-xs text-gray-400">{formatDate(rec.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Weather Conditions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/weather')}>
              Full Forecast
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {!weather ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CloudSun className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No weather data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current conditions */}
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    <CloudSun className="h-10 w-10 text-emerald-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{weather.temperature}&deg;C</p>
                      <p className="text-xs text-gray-500">{weather.condition}</p>
                      <p className="text-xs text-gray-400">{weather.location}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Droplets className="h-3.5 w-3.5 text-blue-500" />
                      {weather.humidity}%
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Wind className="h-3.5 w-3.5 text-cyan-500" />
                      {weather.wind_speed} km/h
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <ThermometerSun className="h-3.5 w-3.5 text-amber-500" />
                      {weather.rainfall_mm} mm
                    </div>
                  </div>
                </div>

                {/* 7-day forecast */}
                {weather.forecast && weather.forecast.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">7-Day Forecast</p>
                    <div className="grid grid-cols-7 gap-1">
                      {weather.forecast.slice(0, 7).map((day) => (
                        <div
                          key={day.date}
                          className="flex flex-col items-center rounded-md bg-gray-50 px-1 py-2 text-center"
                        >
                          <span className="text-[10px] font-medium text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <CloudSun className="my-1 h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-semibold text-gray-900">{day.temp_high}&deg;</span>
                          <span className="text-[10px] text-gray-400">{day.temp_low}&deg;</span>
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
      </div>

      {/* Recent Disease Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Disease Reports</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/farmer/disease')}>
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileSearch className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No disease reports yet</p>
              <Button variant="link" size="sm" className="mt-1" onClick={() => router.push('/dashboard/farmer/disease')}>
                Diagnose a Crop
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {recentReports.map((report) => (
                  <div key={report.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{report.crop_type}</span>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="text-xs text-gray-600">
                      {report.disease_prediction || <span className="italic text-gray-400">Pending analysis</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <RiskBadge risk={report.risk_level} />
                      <span className="text-gray-500">{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="pb-3 pr-4">Crop Type</th>
                      <th className="pb-3 pr-4">Disease Prediction</th>
                      <th className="pb-3 pr-4">Risk Level</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{report.crop_type}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {report.disease_prediction || <span className="italic text-gray-400">Pending analysis</span>}
                        </td>
                        <td className="py-3 pr-4"><RiskBadge risk={report.risk_level} /></td>
                        <td className="py-3 pr-4"><StatusBadge status={report.status} /></td>
                        <td className="py-3 text-gray-500">{formatDate(report.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
