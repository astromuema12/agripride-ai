import { BaseService } from './base.service';
import type { PlatformStat } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export class StatsService extends BaseService<PlatformStat> {
  protected storeName = 'platformStats' as const;

  async getMetric(name: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('platform_stats')
        .select('metric_value')
        .eq('metric_name', name)
        .single();
      return (data?.metric_value as number) ?? 0;
    }
    const all = await this.getAll();
    return all.find((s) => s.metric_name === name)?.metric_value ?? 0;
  }

  async incrementMetric(name: string, amount = 1): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase!
        .rpc('increment_stat', { stat_name: name, inc_amount: amount });
      return;
    }
    const all = await this.getAll();
    const existing = all.find((s) => s.metric_name === name);
    if (existing) {
      await this.update(existing.id, {
        metric_value: (existing.metric_value ?? 0) + amount,
        updated_at: new Date().toISOString(),
      } as Partial<PlatformStat>);
    }
  }

  async getAllMetrics(): Promise<Record<string, number>> {
    const all = await this.getAll();
    const result: Record<string, number> = {};
    for (const stat of all) {
      result[stat.metric_name] = stat.metric_value ?? 0;
    }
    return result;
  }
}

export const statsService = new StatsService();
