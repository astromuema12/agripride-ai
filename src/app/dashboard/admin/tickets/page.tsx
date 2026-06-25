'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Loader2, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supportTicketService } from '@/services/support.service';
import type { SupportTicket } from '@/types';
import { toast } from 'sonner';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<Record<string, string>>({});

  useEffect(() => {
    supportTicketService.getAll().then((data) => { setTickets(data); setLoading(false); }).catch(() => { setLoading(false); toast.error('Failed to load tickets'); });
  }, []);

  const handleResolve = async (id: string) => {
    await supportTicketService.resolveTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
    toast.success('Ticket resolved');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500">Respond to and resolve user support requests.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {tickets.length === 0 ? (
            <p className="text-sm text-gray-400">No support tickets yet.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-gray-100 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{ticket.subject}</span>
                        <Badge className="text-[10px] bg-yellow-100 text-yellow-700">{ticket.priority || 'medium'}</Badge>
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 capitalize">{ticket.category || 'general'}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-3">{ticket.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ticket.user_id?.slice(0, 8)}</span>
                        {ticket.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {ticket.email}</span>}
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs">Admin Response</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your response..."
                        value={response[ticket.id] || ''}
                        onChange={(e) => setResponse((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleResolve(ticket.id)} disabled={!response[ticket.id]?.trim()}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Resolve
                      </Button>
                    </div>
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
