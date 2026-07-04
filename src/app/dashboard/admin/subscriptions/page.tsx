'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { CreditCard, Users, Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { userSubscriptionService } from '@/services/subscription.service';
import { paystackTransactionService } from '@/lib/paystack';
import type { UserSubscription, PaystackTransaction } from '@/types';
import { toast } from 'sonner';

export default function AdminSubscriptionsPage() {
  const { t } = useI18n();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [transactions, setTransactions] = useState<PaystackTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    Promise.all([
      userSubscriptionService.getAll(),
      paystackTransactionService.getAllTransactions(100, 0),
    ]).then(([subs, txs]) => {
      setSubscriptions(subs);
      setTransactions(txs.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      toast.error(t('dashboard.admin.failedToLoadSubscriptions'));
    });
  }, []);

  const totalRevenue = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTxs = transactions.filter((t) =>
    !txSearch ||
    t.reference.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.email?.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.user_id.toLowerCase().includes(txSearch.toLowerCase()),
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.admin.subscriptionsTitle')}</h1>
        <p className="text-sm text-gray-500">{t('dashboard.admin.subscriptionsDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            <p className="text-xs text-gray-500">{t('dashboard.admin.totalSubscriptions')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.filter((s) => s.status === 'active').length}</p>
            <p className="text-xs text-gray-500">{t('common.active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length}</p>
            <p className="text-xs text-gray-500">{t('dashboard.admin.expiredCancelled')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{t('common.currency')} {totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{t('dashboard.admin.totalRevenue')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('dashboard.admin.subscriptionsTitle')}</h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400">{t('dashboard.admin.noSubscriptions')}</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{(sub as any).plan_tier || sub.plan_id}</span>
                      <Badge className={`text-[10px] ${sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{sub.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{t('dashboard.admin.userLabel')}: {sub.user_id?.slice(0, 12)}</p>
                    {sub.expires_at && <p className="text-xs text-gray-400">{t('dashboard.admin.expires')}: {new Date(sub.expires_at).toLocaleDateString()}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.admin.paystackTransactions')}</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('dashboard.admin.searchTransactionsPlaceholder')}
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filteredTxs.length === 0 ? (
            <p className="text-sm text-gray-400">{t('dashboard.admin.noTransactions')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">{t('common.reference')}</th>
                    <th className="pb-2 font-medium">{t('common.user')}</th>
                    <th className="pb-2 font-medium">{t('common.email')}</th>
                    <th className="pb-2 font-medium">{t('common.amount')}</th>
                    <th className="pb-2 font-medium">{t('common.status')}</th>
                    <th className="pb-2 font-medium">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs text-gray-600">{tx.reference.slice(0, 24)}...</td>
                      <td className="py-2 text-gray-600">{tx.user_id.slice(0, 12)}</td>
                      <td className="py-2 text-gray-600">{tx.email || '-'}</td>
                      <td className="py-2 font-medium text-gray-900">{t('common.currency')} {tx.amount.toLocaleString()}</td>
                      <td className="py-2">
                        <Badge className={`text-[10px] ${tx.status === 'success' ? 'bg-green-100 text-green-700' : tx.status === 'failed' ? 'bg-red-100 text-red-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{tx.status}</Badge>
                      </td>
                      <td className="py-2 text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
