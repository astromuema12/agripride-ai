import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getCollection, getPaginatedCollection, setCollection,
  getItem, putItem, deleteItem, getTotalCount, getDemoDataKey,
} from '@/lib/demo-store';
import { logger } from '@/lib/logger';
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

const VALID_COLUMNS = new Set([
  'id', 'user_id', 'farm_id', 'crop_id', 'email', 'name', 'role', 'status',
  'type', 'location', 'created_at', 'updated_at', 'is_read', 'is_approved',
  'tier', 'plan_id', 'ticket_id', 'event_type', 'metric_name',
]);

function tableName(store: StoreName): string {
  return STORE_MAP[store] || store;
}

function validateColumn(column: string): boolean {
  return VALID_COLUMNS.has(column);
}

export abstract class BaseService<T extends { id: string }> {
  protected abstract storeName: StoreName;

  private get table() {
    return tableName(this.storeName);
  }

  async getAll(): Promise<T[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!
          .from(this.table)
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          logger.error(`Failed to fetch all from ${this.table}`, {
            component: 'base-service',
            error: error.message,
          });
          return [];
        }
        return (data ?? []) as T[];
      } catch (err) {
        logger.error(`Exception fetching all from ${this.table}`, {
          component: 'base-service',
          error: err,
        });
        return [];
      }
    }
    return getCollection<T>(this.storeName);
  }

  async getPaginated(limit = 100, offset = 0): Promise<{ data: T[]; total: number }> {
    const safeLimit = Math.min(Math.max(1, limit), 1000);
    if (isSupabaseConfigured) {
      try {
        const [{ data, count, error }, { count: total, error: countError }] = await Promise.all([
          supabase!
            .from(this.table)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + safeLimit - 1),
          supabase!
            .from(this.table)
            .select('*', { count: 'exact', head: true }),
        ]);
        if (error) throw error;
        if (countError) throw countError;
        return { data: (data ?? []) as T[], total: total ?? 0 };
      } catch (err) {
        logger.error(`Failed paginated query on ${this.table}`, {
          component: 'base-service',
          error: err,
          metadata: { limit: safeLimit, offset },
        });
        return { data: [], total: 0 };
      }
    }
    return getPaginatedCollection<T>(this.storeName, safeLimit, offset);
  }

  async getById(id: string): Promise<T | null> {
    if (!id) return null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!
          .from(this.table)
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') {
          logger.warn(`getById failed for ${this.table}:${id}`, {
            component: 'base-service',
            error: error.message,
          });
        }
        return (data ?? null) as T | null;
      } catch (err) {
        logger.error(`Exception in getById for ${this.table}:${id}`, {
          component: 'base-service',
          error: err,
        });
        return null;
      }
    }
    return (await getItem<T>(this.storeName, id)) ?? null;
  }

  async create(item: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const newItem = {
      ...item,
      id: crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    } as unknown as T;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from(this.table)
        .insert(newItem)
        .select()
        .single();
      if (error) {
        logger.error(`Failed to create in ${this.table}`, {
          component: 'base-service',
          error: error.message,
        });
        throw new Error(error.message);
      }
      return data as T;
    }
    await putItem(this.storeName, newItem);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    if (!id) return null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase!
          .from(this.table)
          .update(updates as never)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as T;
      } catch (err) {
        logger.error(`Failed to update in ${this.table}:${id}`, {
          component: 'base-service',
          error: err,
        });
        return null;
      }
    }
    const existing = await getItem<T>(this.storeName, id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await putItem(this.storeName, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!id) return;
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from(this.table).delete().eq('id', id);
      if (error) {
        logger.error(`Failed to delete in ${this.table}:${id}`, {
          component: 'base-service',
          error: error.message,
        });
      }
      return;
    }
    await deleteItem(this.storeName, id);
  }

  async count(): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        const { count, error } = await supabase!
          .from(this.table)
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
      } catch (err) {
        logger.error(`Failed to count ${this.table}`, {
          component: 'base-service',
          error: err,
        });
        return 0;
      }
    }
    return getTotalCount(this.storeName);
  }

  protected async query(
    column: string,
    value: unknown,
    limit = 100,
    offset = 0,
  ): Promise<{ data: T[]; total: number }> {
    if (!validateColumn(column)) {
      logger.warn(`Invalid column name used in query: ${column}`, {
        component: 'base-service',
      });
      return { data: [], total: 0 };
    }

    const safeLimit = Math.min(Math.max(1, limit), 1000);
    if (isSupabaseConfigured) {
      try {
        const [{ data, count, error }, { count: total, error: countError }] = await Promise.all([
          supabase!
            .from(this.table)
            .select('*', { count: 'exact' })
            .eq(column, value as string)
            .order('created_at', { ascending: false })
            .range(offset, offset + safeLimit - 1),
          supabase!
            .from(this.table)
            .select('*', { count: 'exact', head: true })
            .eq(column, value as string),
        ]);
        if (error) throw error;
        if (countError) throw countError;
        return { data: (data ?? []) as T[], total: total ?? 0 };
      } catch (err) {
        logger.error(`Failed query on ${this.table}.${column}`, {
          component: 'base-service',
          error: err,
        });
        return { data: [], total: 0 };
      }
    }
    const all = await getCollection<T>(this.storeName);
    const filtered = all.filter((item) => (item as Record<string, unknown>)[column] === value);
    return { data: filtered.slice(offset, offset + safeLimit), total: filtered.length };
  }
}
