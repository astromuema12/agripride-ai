'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Leaf, AlertTriangle,
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
import { getDiseaseReports, getYieldRecords, getUsers, getSustainabilityScores, getDashboardStats } from '@/lib/db';
import type { YieldRecord, DiseaseReport, User, SustainabilityScore, DashboardStats } from '@/types';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
const PIE_COLORS = ['#059669', '#fbbf24', '#ef4444'];

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [yieldRecords, setYieldRecords] = useState<YieldRecord[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sustainabilityScores, setSustainabilityScores] = useState<SustainabilityScore[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [s, y, d, u, ss] = await Promise.all([
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
        console.error('Failed to load analytics data', err);
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
    const crop = r.crop_type || 'Unknown';
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
    { name: 'Good (>0.7)', value: good },
    { name: 'Fair (0.4–0.7)', value: fair },
    { name: 'Poor (<0.4)', value: poor },
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive insights into farm performance, disease trends, user growth, and sustainability metrics.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              Live Data
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Yield</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{totalYield.toLocaleString()} kg</p>
                  <p className="mt-1 text-xs text-gray-400">Avg {avgYield.toFixed(1)} kg / record</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <Sprout className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Disease Reports</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{totalDiseases}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {resolvedDiseases} resolved (
                    {totalDiseases > 0 ? ((resolvedDiseases / totalDiseases) * 100).toFixed(0) : 0}%)
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
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {stats?.user_growth ?? 0}% growth
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
                  <p className="text-sm font-medium text-gray-500">Avg Sustainability</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {stats ? (stats.avg_sustainability_score * 100).toFixed(0) : 0}%
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {sustainabilityScores.length} farms scored
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="yield" className="space-y-6">
          <TabsList>
            <TabsTrigger value="yield" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Yield Trends
            </TabsTrigger>
            <TabsTrigger value="disease" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Disease Trends
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Growth
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="gap-2">
              <Leaf className="h-4 w-4" />
              Sustainability
            </TabsTrigger>
          </TabsList>

          {/* Yield Trends */}
          <TabsContent value="yield" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Sprout className="h-4 w-4 text-emerald-500" />
                    Total Yield
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{totalYield.toLocaleString()} kg</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    Across all records
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                    Average Yield
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{avgYield.toFixed(1)} kg</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    Per harvest record
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <LineChart className="h-4 w-4 text-emerald-500" />
                    Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{yieldRecords.length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    Yield data points
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Yield Over Time</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                {yieldByMonth.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <BarChart3 className="mb-2 h-8 w-8" />
                    <p className="text-sm">No yield data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReLineChart data={yieldByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
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
                        stroke="#059669"
                        strokeWidth={2}
                        dot={{ fill: '#059669', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Yield (kg)"
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
                    Total Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{totalDiseases}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    All disease reports
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Badge variant="primary" className="rounded-full px-1.5 py-0">R</Badge>
                    Resolved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{resolvedDiseases}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {totalDiseases > 0 ? ((resolvedDiseases / totalDiseases) * 100).toFixed(0) : 0}% resolution
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Activity className="h-4 w-4 text-amber-500" />
                    Crops Affected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(diseaseByCrop).length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    Distinct crop types
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Disease Reports by Crop Type</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                {diseaseChartData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <AlertTriangle className="mb-2 h-8 w-8" />
                    <p className="text-sm">No disease reports available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReBarChart data={diseaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="crop" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
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
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {stats?.user_growth ?? 0}% growth
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0">F</Badge>
                    Farmers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === 'farmer').length}
                  </p>
                  <div className="mt-1 text-xs text-gray-400">Primary users</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <LineChart className="h-4 w-4 text-blue-500" />
                    Months Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">{userByMonth.length}</p>
                  <div className="mt-1 text-xs text-gray-400">With registrations</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Registrations Over Time</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                {userByMonth.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <Users className="mb-2 h-8 w-8" />
                    <p className="text-sm">No user data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReLineChart data={userByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
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
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="New Users"
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
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    Soil Health
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
                    Water Usage
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
                    Biodiversity
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
                  <CardTitle>Sustainability Distribution</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  {sustainabilityScores.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                      <PieChart className="mb-2 h-8 w-8" />
                      <p className="text-sm">No sustainability data available</p>
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
                  <CardTitle>Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Good (&gt;0.7)
                      </span>
                      <span className="font-medium text-gray-900">{good}</span>
                    </div>
                    <Progress value={(good / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {sustainabilityScores.length > 0
                        ? ((good / sustainabilityScores.length) * 100).toFixed(0)
                        : 0}% of farms
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        Fair (0.4–0.7)
                      </span>
                      <span className="font-medium text-gray-900">{fair}</span>
                    </div>
                    <Progress value={(fair / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {sustainabilityScores.length > 0
                        ? ((fair / sustainabilityScores.length) * 100).toFixed(0)
                        : 0}% of farms
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        Poor (&lt;0.4)
                      </span>
                      <span className="font-medium text-gray-900">{poor}</span>
                    </div>
                    <Progress value={(poor / Math.max(sustainabilityScores.length, 1)) * 100} className="h-2.5" />
                    <p className="mt-1 text-xs text-gray-400">
                      {sustainabilityScores.length > 0
                        ? ((poor / sustainabilityScores.length) * 100).toFixed(0)
                        : 0}% of farms
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
