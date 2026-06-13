'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { userSubscriptionService } from '@/services/subscription.service';
import type { UserSubscription } from '@/types';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userSubscriptionService.getAll().then((data) => { setSubscriptions(data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500">Manage user subscriptions and plan allocations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            <p className="text-xs text-gray-500">Total Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.filter((s) => s.status === 'active').length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
            <p className="text-2xl font-bold text-gray-900">{subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length}</p>
            <p className="text-xs text-gray-500">Expired/Cancelled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400">No subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{(sub as any).plan_tier || sub.plan_id}</span>
                      <Badge className={`text-[10px] ${sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{sub.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">User: {sub.user_id?.slice(0, 12)}</p>
                    {sub.expires_at && <p className="text-xs text-gray-400">Expires: {new Date(sub.expires_at).toLocaleDateString()}</p>}
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
    </div>
  );
}
