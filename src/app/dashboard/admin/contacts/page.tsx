'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { contactService } from '@/services/contact.service';
import type { ContactInquiry } from '@/types';
import { toast } from 'sonner';

export default function AdminContactsPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactService.getAll().then((data) => { setInquiries(data); setLoading(false); });
  }, []);

  const markResolved = async (id: string) => {
    await contactService.markResolved(id);
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: 'resolved' } : i));
    toast.success('Marked as resolved');
  };

  const markSpam = async (id: string) => {
    await contactService.markSpam(id);
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    toast.success('Marked as spam');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', spam: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Inquiries</h1>
        <p className="text-sm text-gray-500">Manage incoming messages from the contact form.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <p className="text-sm text-gray-400">No inquiries yet.</p>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="rounded-lg border border-gray-100 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{inq.name}</span>
                        <a href={`mailto:${inq.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="h-3 w-3" /> {inq.email}
                        </a>
                        {inq.phone && (
                          <a href={`tel:${inq.phone}`} className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" /> {inq.phone}
                          </a>
                        )}
                        <Badge className={`text-[10px] ${statusColors[inq.status] || 'bg-gray-100 text-gray-600'}`}>{inq.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-700">{inq.subject}</p>
                      <p className="mt-1 text-sm text-gray-500">{inq.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(inq.created_at).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {inq.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => markResolved(inq.id)}>
                            <CheckCircle className="h-4 w-4" /> Resolve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => markSpam(inq.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
