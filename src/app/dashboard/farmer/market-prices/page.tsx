'use client';

import { useState, useEffect } from 'react';
import { getMarketPrices } from '@/lib/db';
import type { MarketPrice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Minus, DollarSign, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const cropEmojis: Record<string, string> = {
  Maize: '\u{1F33D}', Wheat: '\u{1F33E}', Rice: '\u{1F35A}', Cassava: '\u{1F331}', Sorghum: '\u{1F33F}',
  Millet: '\u{1F33E}', Beans: '\u{1FAD8}', Coffee: '\u2615', Tea: '\u{1F375}', Cotton: '\u{1F33A}',
};

export default function MarketPrices() {
  const { t } = useI18n();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMarketPrices().then((data) => {
      setPrices(data);
      setLoading(false);
    });
  }, []);

  const filtered = prices.filter((p) =>
    p.crop.toLowerCase().includes(search.toLowerCase()) ||
    p.region.toLowerCase().includes(search.toLowerCase())
  );

  const avgPrice = filtered.length > 0
    ? filtered.reduce((a, b) => a + b.price_per_kg, 0) / filtered.length
    : 0;
  const trendingUp = filtered.filter((p) => p.trend === 'up').length;
  const trendingDown = filtered.filter((p) => p.trend === 'down').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.farmer.marketPrices')}</h1>
        <p className="text-xs sm:text-sm text-gray-500">{t('market.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">KES {avgPrice.toFixed(0)}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{t('market.avg')} / kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 leading-tight">{trendingUp}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{t('market.trendingUp')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mb-1" />
            <p className="text-lg sm:text-2xl font-bold text-red-500 leading-tight">{trendingDown}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{t('market.trendingDown')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">{t('market.title')}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('market.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
              {t('market.noPricesFound')}{search ? ` "${search}"` : ''}
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filtered.map((p) => (
                  <div key={p.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cropEmojis[p.crop] ?? '\u{1F33F}'}</span>
                        <span className="text-sm font-medium text-gray-900">{p.crop}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">KES {p.price_per_kg.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{p.region}</span>
                      <Badge variant={p.trend === 'up' ? 'primary' : p.trend === 'down' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {p.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : p.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                        {p.trend === 'up' ? t('market.trendingUp') : p.trend === 'down' ? t('market.trendingDown') : t('market.stable')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">{t('market.crop')}</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">{t('market.region')}</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">{t('market.price')}</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">{t('market.trend')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cropEmojis[p.crop] ?? '\u{1F33F}'}</span>
                            <span className="text-sm font-medium text-gray-900">{p.crop}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500">{p.region}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm font-bold text-gray-900">KES {p.price_per_kg.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Badge variant={p.trend === 'up' ? 'primary' : p.trend === 'down' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {p.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : p.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                            {p.trend === 'up' ? t('market.trendingUp') : p.trend === 'down' ? t('market.trendingDown') : t('market.stable')}
                          </Badge>
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
