'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { getUsers, getFarms, getDiseaseReports, getSustainabilityScores } from '@/lib/db';
import type { User, Farm, DiseaseReport, SustainabilityScore } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Building2, AlertTriangle, CheckCircle, MapPin,
  TrendingUp, Activity, Leaf,
} from 'lucide-react';

interface RegionData {
  region: string;
  farmers: number;
  farms: number;
  diseaseReports: number;
  resolved: number;
  sustainabilityAvg: number;
}

function extractRegion(location: string): string {
  const parts = location.split(' Region,');
  return parts[0].trim();
}

export default function RegionalAnalyticsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [sustainabilityScores, setSustainabilityScores] = useState<SustainabilityScore[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: u }, { data: f }, { data: d }, s] = await Promise.all([
          getUsers(),
          getFarms(),
          getDiseaseReports(),
          getSustainabilityScores(),
        ]);
        setUsers(u);
        setFarms(f);
        setDiseaseReports(d);
        setSustainabilityScores(s);
      } catch (err) {
        toast.error(t('dashboard.officer.failedToLoadAnalytics'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalFarmers = users.filter((u) => u.role === 'farmer').length;
  const resolvedCount = diseaseReports.filter((r) => r.status === 'resolved').length;
  const resolutionRate = diseaseReports.length > 0
    ? Math.round((resolvedCount / diseaseReports.length) * 100)
    : 0;

  // Build region data
  const regionMap = new Map<string, RegionData>();

  for (const farm of farms) {
    const region = extractRegion(farm.location);
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        region,
        farmers: 0,
        farms: 0,
        diseaseReports: 0,
        resolved: 0,
        sustainabilityAvg: 0,
      });
    }
    const data = regionMap.get(region)!;
    data.farms += 1;
  }

  // Count unique farmers per region
  const regionFarmers = new Map<string, Set<string>>();
  for (const farm of farms) {
    const region = extractRegion(farm.location);
    if (!regionFarmers.has(region)) regionFarmers.set(region, new Set());
    regionFarmers.get(region)!.add(farm.user_id);
  }
  for (const [region, farmerSet] of regionFarmers.entries()) {
    const data = regionMap.get(region);
    if (data) data.farmers = farmerSet.size;
  }

  // Count disease reports per region
  for (const report of diseaseReports) {
    const farm = farms.find((f) => f.id === report.farm_id);
    if (farm) {
      const region = extractRegion(farm.location);
      const data = regionMap.get(region);
      if (data) {
        data.diseaseReports += 1;
        if (report.status === 'resolved') data.resolved += 1;
      }
    }
  }

  // Calculate sustainability averages per region
  for (const score of sustainabilityScores) {
    const farm = farms.find((f) => f.id === score.farm_id);
    if (farm) {
      const region = extractRegion(farm.location);
      const data = regionMap.get(region);
      if (data) {
        data.sustainabilityAvg = score.overall_score;
      }
    }
  }

  // Average sustainability per region (if multiple farms, take the one from the matching score)
  // Actually let's recompute properly: collect all scores per region and average
  const regionScores = new Map<string, number[]>();
  for (const score of sustainabilityScores) {
    const farm = farms.find((f) => f.id === score.farm_id);
    if (farm) {
      const region = extractRegion(farm.location);
      if (!regionScores.has(region)) regionScores.set(region, []);
      regionScores.get(region)!.push(score.overall_score);
    }
  }
  for (const [region, scores] of regionScores.entries()) {
    const data = regionMap.get(region);
    if (data && scores.length > 0) {
      data.sustainabilityAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  const regionData: RegionData[] = Array.from(regionMap.values()).sort((a, b) => b.farms - a.farms);

  const chartData = regionData.map((r) => ({
    region: r.region,
    [t('analyticsPage.chartReports')]: r.diseaseReports,
  }));

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.officer.regionalAnalytics')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.officer.regionalAnalyticsDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.totalFarmers')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalFarmers}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.totalFarms')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{farms.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
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
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.resolutionRate')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{resolutionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{t('dashboard.officer.resolvedOutOf', { resolved: resolvedCount, total: diseaseReports.length })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            {t('dashboard.officer.diseaseReportsByRegion')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.noRegionData')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.officer.noRegionDataDesc')}</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    cursor={{ fill: 'rgba(15, 118, 110, 0.08)' }}
                  />
                  <Bar dataKey={t('analyticsPage.chartReports')} fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Region-wise Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            {t('dashboard.officer.regionWiseBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regionData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.noRegionDataFound')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.officer.noRegionDataFoundDesc')}</p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {regionData.map((row) => (
                  <div key={row.region} className="py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{row.region}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">{t('dashboard.officer.farmers')}: </span>
                        <span className="font-medium text-gray-800">{row.farmers}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('dashboard.officer.farms')}: </span>
                        <span className="font-medium text-gray-800">{row.farms}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('dashboard.officer.disease')}: </span>
                        <span className={`font-medium ${row.diseaseReports > 0 ? 'text-red-600' : 'text-gray-800'}`}>{row.diseaseReports}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('dashboard.officer.resolved')}: </span>
                        {row.diseaseReports > 0 ? (
                          <Badge variant={row.resolved === row.diseaseReports ? 'primary' : 'warning'} className="text-[10px]">
                            {row.resolved}/{row.diseaseReports}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">{t('dashboard.officer.sustainability')}: </span>
                        {row.sustainabilityAvg > 0 ? (
                          <span className="font-medium text-gray-800">{Math.round(row.sustainabilityAvg * 100)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('common.location')}</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.farmers')}</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.farms')}</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.diseaseReports')}</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.resolved')}</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.sustainabilityAvg')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionData.map((row) => (
                      <tr key={row.region} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="font-medium text-gray-800">{row.region}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{row.farmers}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{row.farms}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${row.diseaseReports > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {row.diseaseReports}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.diseaseReports > 0 ? (
                            <Badge variant={row.resolved === row.diseaseReports ? 'primary' : 'warning'}>
                              {row.resolved}/{row.diseaseReports}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.sustainabilityAvg > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="font-medium text-gray-800">
                                {Math.round(row.sustainabilityAvg * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
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
