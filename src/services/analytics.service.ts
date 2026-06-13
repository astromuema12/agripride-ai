import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AiUsageLog, ActivityLog } from '@/types';

export class AiUsageService extends BaseService<AiUsageLog> {
  protected storeName = 'aiUsageLogs' as const;

  async logUsage(log: Omit<AiUsageLog, 'id' | 'created_at'>): Promise<AiUsageLog> {
    return this.create(log);
  }

  async getStatsForPeriod(startDate: string, endDate: string): Promise<{
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      const logs = (data ?? []) as AiUsageLog[];
      return this.computeStats(logs);
    }
    const all = await this.getAll();
    const filtered = all.filter(
      (l) => l.created_at >= startDate && l.created_at <= endDate,
    );
    return this.computeStats(filtered);
  }

  private computeStats(logs: AiUsageLog[]) {
    const total = logs.length;
    const success = logs.filter((l) => l.success).length;
    const avgTime = total > 0
      ? Math.round(logs.reduce((a, b) => a + (b.response_time_ms ?? 0), 0) / total)
      : 0;
    return {
      totalRequests: total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgResponseTime: avgTime,
    };
  }
}

export class ActivityService extends BaseService<ActivityLog> {
  protected storeName = 'activityLogs' as const;

  async logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    return this.create(log);
  }

  async getUserActivity(userId: string): Promise<ActivityLog[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data ?? []) as ActivityLog[];
    }
    const all = await this.getAll();
    return all.filter((a) => a.user_id === userId).slice(0, 50);
  }

  async getEventCount(eventType: string, since: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { count } = await supabase!
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .gte('created_at', since);
      return count ?? 0;
    }
    const all = await this.getAll();
    return all.filter((a) => a.event_type === eventType && a.created_at >= since).length;
  }
}

export const aiUsageService = new AiUsageService();
export const activityService = new ActivityService();
