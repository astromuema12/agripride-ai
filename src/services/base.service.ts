import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getCollection, getPaginatedCollection, setCollection,
  getItem, putItem, deleteItem, getTotalCount, getDemoDataKey,
} from '@/lib/demo-store';
import type { StoreName } from '@/lib/demo-store';

export type { StoreName };

const STORE_MAP: Record<string, string> = {
  contactInquiries: 'contact_inquiries',
  farmerProfiles: 'farmer_profiles',
  subscriptionPlans: 'subscription_plans',
  userSubscriptions: 'user_subscriptions',
  testimonials: 'testimonials',
  supportTickets: 'support_tickets',
  ticketMessages: 'ticket_messages',
  mpesaTransactions: 'mpesa_transactions',
  aiUsageLogs: 'ai_usage_logs',
  activityLogs: 'activity_logs',
  platformStats: 'platform_stats',
  diseaseReports: 'disease_reports',
  weatherData: 'weather_data',
  marketPrices: 'market_prices',
  sustainabilityScores: 'sustainability_scores',
  auditLogs: 'audit_logs',
  yieldRecords: 'yield_records',
  consentRecords: 'consent_records',
  chatMessages: 'chat_messages',
  yieldPredictions: 'yield_predictions',
};

function tableName(store: StoreName): string {
  return STORE_MAP[store] || store;
}

export abstract class BaseService<T extends { id: string }> {
  protected abstract storeName: StoreName;

  private get table() {
    return tableName(this.storeName);
  }

  async getAll(): Promise<T[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });
      return (data ?? []) as T[];
    }
    return getCollection<T>(this.storeName);
  }

  async getPaginated(limit = 100, offset = 0): Promise<{ data: T[]; total: number }> {
    if (isSupabaseConfigured) {
      const [{ data, count }, { count: total }] = await Promise.all([
        supabase!
          .from(this.table)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase!
          .from(this.table)
          .select('*', { count: 'exact', head: true }),
      ]);
      return { data: (data ?? []) as T[], total: total ?? 0 };
    }
    return getPaginatedCollection<T>(this.storeName, limit, offset);
  }

  async getById(id: string): Promise<T | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();
      return (data ?? null) as T | null;
    }
    return (await getItem<T>(this.storeName, id)) ?? null;
  }

  async create(item: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const newItem = {
      ...item,
      id: crypto.randomUUID?.() ?? `id-${Date.now()}`,
      created_at: new Date().toISOString(),
    } as unknown as T;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from(this.table)
        .insert(newItem)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as T;
    }
    await putItem(this.storeName, newItem);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from(this.table)
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as T;
    }
    const existing = await getItem<T>(this.storeName, id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await putItem(this.storeName, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase!.from(this.table).delete().eq('id', id);
      return;
    }
    await deleteItem(this.storeName, id);
  }

  async count(): Promise<number> {
    if (isSupabaseConfigured) {
      const { count } = await supabase!
        .from(this.table)
        .select('*', { count: 'exact', head: true });
      return count ?? 0;
    }
    return getTotalCount(this.storeName);
  }

  protected async query(
    column: string,
    value: unknown,
    limit = 100,
    offset = 0,
  ): Promise<{ data: T[]; total: number }> {
    if (isSupabaseConfigured) {
      const [{ data, count }, { count: total }] = await Promise.all([
        supabase!
          .from(this.table)
          .select('*', { count: 'exact' })
          .eq(column, value as string)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase!
          .from(this.table)
          .select('*', { count: 'exact', head: true })
          .eq(column, value as string),
      ]);
      return { data: (data ?? []) as T[], total: total ?? 0 };
    }
    const all = await getCollection<T>(this.storeName);
    const filtered = all.filter((item) => (item as Record<string, unknown>)[column] === value);
    return { data: filtered.slice(offset, offset + limit), total: filtered.length };
  }
}
