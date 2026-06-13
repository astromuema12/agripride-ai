import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SupportTicket, TicketMessage } from '@/types';

export class SupportTicketService extends BaseService<SupportTicket> {
  protected storeName = 'supportTickets' as const;

  async getUserTickets(userId: string): Promise<{ data: SupportTicket[]; total: number }> {
    return this.query('user_id', userId);
  }

  async assignTicket(id: string, adminId: string): Promise<SupportTicket | null> {
    return this.update(id, {
      assigned_to: adminId,
      status: 'in_progress',
    } as Partial<SupportTicket>);
  }

  async resolveTicket(id: string): Promise<SupportTicket | null> {
    return this.update(id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    } as Partial<SupportTicket>);
  }
}

export class TicketMessageService extends BaseService<TicketMessage> {
  protected storeName = 'ticketMessages' as const;

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      return (data ?? []) as TicketMessage[];
    }
    const all = await this.getAll();
    return all.filter((m) => m.ticket_id === ticketId);
  }
}

export const supportTicketService = new SupportTicketService();
export const ticketMessageService = new TicketMessageService();
