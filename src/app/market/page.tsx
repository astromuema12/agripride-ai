'use client';

import { useState, useEffect } from 'react';
import { getMarketPrices } from '@/lib/db';
import type { MarketPrice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, Minus, Search, Download,
  Filter, DollarSign, MapPin, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useI18n } from '@/lib/i18n';

const regions = [
  'All Regions', 'Rift Valley', 'Central', 'Coastal', 'Eastern', 'Western', 'Nyanza', 'North Eastern',
];
const regionToKey = (r: string) => r.toLowerCase().replace(/\s+/g, '_');

function TrendIcon({ trend }: { trend: MarketPrice['trend'] }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-[#0f766e]" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function TrendBadge({ trend, t }: { trend: MarketPrice['trend']; t: (key: string, params?: Record<string, string | number>) => string }) {
  const map: Record<string, { variant: 'primary' | 'destructive' | 'default'; label: string }> = {
    up: { variant: 'primary', label: t('market.trendingUp') },
    down: { variant: 'destructive', label: t('market.trendingDown') },
    stable: { variant: 'default', label: t('market.stable') },
  };
  const { variant, label } = map[trend];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MarketPage() {
  const { t } = useI18n();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMarketPrices();
        if (!cancelled) setPrices(data);
      } catch {
        if (!cancelled) setPrices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = prices.filter((p) => {
    const matchCrop = p.crop.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === 'All Regions' || p.region === regionFilter;
    return matchCrop && matchRegion;
  });

  const avgPrice = filtered.length
    ? filtered.reduce((s, p) => s + p.price_per_kg, 0) / filtered.length
    : 0;

  const highest = filtered.length
    ? filtered.reduce((a, b) => (a.price_per_kg > b.price_per_kg ? a : b))
    : null;

  const lowest = filtered.length
    ? filtered.reduce((a, b) => (a.price_per_kg < b.price_per_kg ? a : b))
    : null;

  const uniqueMarkets = new Set(filtered.map((p) => `${p.crop}-${p.region}`)).size;

  const chartData = filtered
    .reduce<{ crop: string; price: number }[]>((acc, p) => {
      const existing = acc.find((a) => a.crop === p.crop);
      if (existing) {
        existing.price = (existing.price + p.price_per_kg) / 2;
      } else {
        acc.push({ crop: p.crop, price: p.price_per_kg });
      }
      return acc;
    }, [])
    .sort((a, b) => b.price - a.price);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('market.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('market.subtitle')}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-[#e2f0ee] p-3 text-[#0f766e]">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('market.averagePrice')}</p>
              <p className="text-2xl font-bold text-gray-900">
                KES {avgPrice.toFixed(0)}
              </p>
              <p className="text-xs text-gray-400">{t('market.unit', { unit: 'kg' })}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-[#e2f0ee] p-3 text-[#0f766e]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('market.bestPrice')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {highest ? `KES ${highest.price_per_kg.toFixed(0)}` : '---'}
              </p>
              <p className="text-xs text-gray-400">{highest?.crop ?? '---'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-[#e2f0ee] p-3 text-[#0f766e]">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('market.lowestPrice')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {lowest ? `KES ${lowest.price_per_kg.toFixed(0)}` : '---'}
              </p>
              <p className="text-xs text-gray-400">{lowest?.crop ?? '---'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-[#e2f0ee] p-3 text-[#0f766e]">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('market.title')}</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueMarkets}</p>
              <p className="text-xs text-gray-400">{t('market.activeListings')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('market.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-56">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{t(`market.regions.${regionToKey(r)}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="shrink-0" title={t('common.export')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('market.title')}</CardTitle>
          <span className="text-xs text-gray-400">{t('market.listings', { count: filtered.length })}</span>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 sm:py-12 text-center px-4">
              <DollarSign className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">{t('market.noPrices')}</p>
              <p className="text-xs text-gray-400">
                {search || regionFilter !== 'All Regions'
                  ? t('market.noPricesSearch')
                  : t('market.updating')}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filtered.map((item) => (
                  <div key={item.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.crop}</span>
                      <span className="font-semibold text-gray-900">
                        KES {item.price_per_kg.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.region}</span>
                      <div className="flex items-center gap-2">
                        <TrendIcon trend={item.trend} />
                        <TrendBadge trend={item.trend} t={t} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.recorded_at)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="pb-3 pr-4">{t('market.crop')}</th>
                      <th className="pb-3 pr-4">{t('market.region')}</th>
                      <th className="pb-3 pr-4">{t('market.pricePerKg')}</th>
                      <th className="pb-3 pr-4">{t('market.trend')}</th>
                      <th className="pb-3 pr-4">{t('market.lastUpdatedColumn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{item.crop}</td>
                        <td className="py-3 pr-4 text-gray-600">{item.region}</td>
                        <td className="py-3 pr-4">
                          <span className="font-semibold text-gray-900">
                            KES {item.price_per_kg.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <TrendIcon trend={item.trend} />
                            <TrendBadge trend={item.trend} t={t} />
                          </div>
                        </td>
                        <td className="py-3 text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(item.recorded_at)}
                          </div>
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

      {/* Price Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('market.priceHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center py-8 sm:py-12 text-center">
              <TrendingUp className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="crop"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    tickFormatter={(v) => `KES ${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{ fill: '#ecfdf6' }}
                  />
                  <Bar dataKey="price" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
