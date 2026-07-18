'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, getFarmExpenses, getFarmRevenues } from '@/lib/db';
import type { Farm, FarmExpense, FarmRevenue } from '@/types';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { toast } from 'sonner';
import {
  Receipt, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Banknote, ShoppingCart, Tractor, Wheat, Truck, Warehouse,
  PiggyBank, AlertTriangle, Calendar, Sprout, Users, Droplets,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  seeds: 'from-emerald-400 to-green-500',
  fertilizer: 'from-amber-400 to-orange-500',
  pesticide: 'from-red-400 to-rose-500',
  labour: 'from-blue-400 to-indigo-500',
  irrigation: 'from-cyan-400 to-blue-500',
  equipment: 'from-violet-400 to-purple-500',
  transport: 'from-yellow-400 to-amber-500',
  storage: 'from-teal-400 to-cyan-500',
  veterinary: 'from-pink-400 to-rose-500',
  feed: 'from-lime-400 to-green-500',
  other: 'from-gray-400 to-gray-500',
};

export default function FarmFinancePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const formatKES = (amount: number): string => {
    return `${t('common.currency')} ${amount.toLocaleString()}`;
  };
  const [farms, setFarms] = useState<Farm[]>([]);
  const [expenses, setExpenses] = useState<FarmExpense[]>([]);
  const [revenues, setRevenues] = useState<FarmRevenue[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: userFarms } = await getFarms(user.id);
        setFarms(userFarms || []);
        const [allExpenses, allRevenues] = await Promise.all([
          getFarmExpenses(), getFarmRevenues(),
        ]);
        const farmIds = (userFarms || []).map((f) => f.id);
        setExpenses(allExpenses.filter((e) => farmIds.includes(e.farm_id)));
        setRevenues(allRevenues.filter((r) => farmIds.includes(r.farm_id)));
      } catch {
        toast.error(t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;

  const filteredExpenses = selectedFarm === 'all' ? expenses : expenses.filter((e) => e.farm_id === selectedFarm);
  const filteredRevenues = selectedFarm === 'all' ? revenues : revenues.filter((r) => r.farm_id === selectedFarm);

  const totalRevenue = filteredRevenues.reduce((s, r) => s + r.amount_kes, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount_kes, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  const expensesByCat = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount_kes;
    return acc;
  }, {});
  const topExpenseCats = Object.entries(expensesByCat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const revenueBySource = filteredRevenues.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + r.amount_kes;
    return acc;
  }, {});

  const allTransactions = [
    ...filteredExpenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...filteredRevenues.map((r) => ({ ...r, type: 'revenue' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10);

  const farmMap = new Map(farms.map((f) => [f.id, f]));

  return (
    <div className="space-y-8 page-enter">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-950 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3 h-3" />
              {t('farmFinance.title')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('farmFinance.title')}</h1>
          <p className="mt-2 text-emerald-100/80 max-w-xl">{t('farmFinance.subtitle')}</p>
        </div>
      </div>

      {farms.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedFarm('all')} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedFarm === 'all' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
          }`}>
            {t('common.all')}
          </button>
          {farms.map((farm) => (
            <button key={farm.id} onClick={() => setSelectedFarm(farm.id)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedFarm === farm.id ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}>
              {farm.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-grid">
            <div className="group relative premium-card">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('farmFinance.totalRevenue')}</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatKES(totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative premium-card">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-rose-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('farmFinance.totalExpenses')}</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatKES(totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative premium-card">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6">
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${netProfit >= 0 ? 'from-amber-400 to-yellow-500' : 'from-red-400 to-rose-500'} shadow-lg flex items-center justify-center`}>
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('farmFinance.netProfit')}</p>
                    <p className={`text-2xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {netProfit >= 0 ? '+' : ''}{formatKES(netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative premium-card">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('farmFinance.profitMargin')}</p>
                    <p className={`text-2xl font-bold tracking-tight ${profitMargin >= 10 ? 'text-emerald-700' : profitMargin >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                      {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {netProfit >= 0 ? t('farmFinance.profitPositive') : t('farmFinance.profitNegative')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6 premium-card">
              <p className="text-sm font-semibold text-gray-900 mb-4">{t('farmFinance.topExpenseCategories')}</p>
              {topExpenseCats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('farmFinance.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {topExpenseCats.map(([cat, amount]) => {
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[cat] || 'from-gray-400 to-gray-500'}`} />
                            <span className="capitalize text-gray-700">{t(`dashboard.finance.categories.${cat}` as any) || cat}</span>
                          </div>
                          <span className="font-medium text-gray-900">{formatKES(amount)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-400 to-gray-500'} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6 premium-card">
              <p className="text-sm font-semibold text-gray-900 mb-4">{t('farmFinance.revenueBySource')}</p>
              {Object.keys(revenueBySource).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('farmFinance.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(revenueBySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([src, amount]) => {
                      const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                      return (
                        <div key={src}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="capitalize text-gray-700">{t(`dashboard.finance.revenueSources.${src}` as any) || src.replace('_', ' ')}</span>
                            <span className="font-medium text-gray-900">{formatKES(amount)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-6 premium-card">
            <p className="text-sm font-semibold text-gray-900 mb-4">{t('farmFinance.recentTransactions')}</p>
            {allTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100 mb-4">
                  <Receipt className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">{t('farmFinance.noData')}</p>
                <p className="text-xs text-gray-300 mt-1">{t('farmFinance.noDataDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {allTransactions.map((tran) => (
                  <div key={`${tran.type}-${tran.id}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        tran.type === 'revenue' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        {tran.type === 'revenue'
                          ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          : <ArrowDownRight className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {'description' in tran ? (tran as FarmExpense).description : (tran as FarmRevenue).description}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tran.date)}
                          {tran.type === 'revenue' && (tran as FarmRevenue).buyer && (
                            <> &middot; {(tran as FarmRevenue).buyer}</>
                          )}
                          {tran.type === 'expense' && (
                            <> &middot; <span className="capitalize">{(tran as FarmExpense).category}</span></>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`shrink-0 text-sm font-semibold ${
                      tran.type === 'revenue' ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {tran.type === 'revenue' ? '+' : '-'}{formatKES(tran.amount_kes)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
