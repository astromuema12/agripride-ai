import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SubscriptionPlan, UserSubscription } from '@/types';

const DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'created_at'>[] = [
  {
    name: 'Free Farmer',
    tier: 'free',
    price_kes: 0,
    features: [
      'Basic AI Chat (10 queries/day)',
      'Weather Alerts',
      'Market Prices',
      'Community Access',
    ],
    is_active: true,
  },
  {
    name: 'Premium Farmer',
    tier: 'premium',
    price_kes: 299,
    features: [
      'Advanced AI Diagnosis (unlimited)',
      'Farm Analytics Dashboard',
      'Loan Recommendations',
      'Priority Support',
      'Data Export',
      'Crop Advisor AI',
    ],
    is_active: true,
  },
  {
    name: 'Cooperative Plan',
    tier: 'cooperative',
    price_kes: 999,
    features: [
      'Multi-farm Dashboard',
      'Group Analytics',
      'Cooperative Management',
      'All Premium Features',
      'Bulk Diagnosis',
      'Dedicated Account Manager',
    ],
    is_active: true,
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price_kes: 4999,
    features: [
      'NGO Dashboard',
      'Government Dashboard',
      'Large Scale Monitoring',
      'Custom Integrations',
      'API Access',
      'White-label Options',
      'Dedicated Support',
    ],
    is_active: true,
  },
];

export class SubscriptionService extends BaseService<SubscriptionPlan> {
  protected storeName = 'subscriptionPlans' as const;

  async seedPlans(): Promise<void> {
    const existing = await this.getAll();
    if (existing.length > 0) return;
    for (const plan of DEFAULT_PLANS) {
      await this.create(plan);
    }
  }

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const all = await this.getAll();
    return all.filter((p) => p.is_active);
  }

  async getByTier(tier: SubscriptionPlan['tier']): Promise<SubscriptionPlan | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('subscription_plans')
        .select('*')
        .eq('tier', tier)
        .single();
      return data as SubscriptionPlan | null;
    }
    const all = await this.getAll();
    return all.find((p) => p.tier === tier && p.is_active) ?? null;
  }
}

export class UserSubscriptionService extends BaseService<UserSubscription> {
  protected storeName = 'userSubscriptions' as const;

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      return data as UserSubscription | null;
    }
    const all = await this.getAll();
    return all.find((s) => s.user_id === userId && s.status === 'active') ?? null;
  }
}

export const subscriptionService = new SubscriptionService();
export const userSubscriptionService = new UserSubscriptionService();
