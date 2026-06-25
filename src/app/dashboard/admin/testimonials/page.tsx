'use client';

import { useState, useEffect } from 'react';
import { Check, X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testimonialService } from '@/services/testimonial.service';
import type { Testimonial } from '@/types';
import { toast } from 'sonner';

export default function AdminTestimonialsPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([testimonialService.getPending(), testimonialService.getApproved()])
      .then(([p, a]) => { setPending(p); setApproved(a); setLoading(false); }).catch(() => { setLoading(false); toast.error('Failed to load testimonials'); });
  }, []);

  const handleApprove = async (id: string) => {
    if (!user) return;
    await testimonialService.approve(id, user.id);
    const t = pending.find((p) => p.id === id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    if (t) setApproved((prev) => [t, ...prev]);
    toast.success('Testimonial approved');
  };

  const handleReject = async (id: string) => {
    await testimonialService.reject(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    toast.success('Testimonial rejected');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-sm text-gray-500">Approve or reject user-submitted testimonials.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Pending Approval ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400">No pending testimonials.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((t) => (
                <div key={t.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      {t.location && <span className="text-xs text-gray-500">{t.location}</span>}
                      {t.farm_type && <Badge variant="primary" className="text-[10px]">{t.farm_type}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">&ldquo;{t.content}&rdquo;</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(t.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(t.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Approved ({approved.length})</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-400">No approved testimonials yet.</p>
          ) : (
            <div className="space-y-3">
              {approved.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Check className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    <p className="truncate text-xs text-gray-500">{t.content.slice(0, 100)}</p>
                  </div>
                  {t.approved_at && <span className="text-xs text-gray-400">{new Date(t.approved_at).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
