import { userSubscriptionService, subscriptionService } from '@/services/subscription.service';
import { serverSupabase } from '@/lib/server-auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface PremiumStatus {
  isPremium: boolean;
  plan?: {
    id: string;
    name: string;
    tier: string;
    features: string[];
  };
  expiresAt?: string;
}

export async function getUserPremiumStatus(userId: string): Promise<PremiumStatus> {
  if (!userId) {
    return { isPremium: false };
  }

  try {
    const subscription = await userSubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return { isPremium: false };
    }

    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      await userSubscriptionService.update(subscription.id, {
        status: 'expired',
      } as never);
      return { isPremium: false };
    }

    const plan = await subscriptionService.getByTier(
      subscription.plan_id as 'free' | 'premium' | 'cooperative' | 'enterprise',
    );

    const isPaidTier =
      subscription.plan_id === 'premium' ||
      subscription.plan_id === 'cooperative' ||
      subscription.plan_id === 'enterprise';

    if (!isPaidTier) {
      return { isPremium: false };
    }

    return {
      isPremium: true,
      plan: plan
        ? { id: plan.id, name: plan.name, tier: plan.tier, features: plan.features }
        : undefined,
      expiresAt: subscription.expires_at,
    };
  } catch {
    return { isPremium: false };
  }
}

export async function requirePremium(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const status = await getUserPremiumStatus(userId);
  if (!status.isPremium) {
    return {
      allowed: false,
      reason: 'Premium subscription required. Subscribe at /pricing.',
    };
  }
  return { allowed: true };
}

export async function getUserSubscriptionFromSession(): Promise<PremiumStatus> {
  if (!isSupabaseConfigured || !serverSupabase) {
    return { isPremium: false };
  }

  try {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return { isPremium: false };
    }
    return getUserPremiumStatus(session.user.id);
  } catch {
    return { isPremium: false };
  }
}

export async function checkPremiumAccess(
  userId: string,
): Promise<{ data: PremiumStatus | null; error: string | null }> {
  if (!userId) {
    return { data: null, error: 'Authentication required' };
  }

  const status = await getUserPremiumStatus(userId);
  if (!status.isPremium) {
    return { data: status, error: 'Premium subscription required' };
  }

  return { data: status, error: null };
}

export async function getUserTransactionHistory(userId: string) {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data: pstkTxs } = await supabase
      .from('paystack_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const all = (pstkTxs || []).map((t) => ({
      id: t.id,
      amount: t.amount,
      method: 'Paystack',
      status: t.status,
      reference: t.reference,
      created_at: t.created_at,
    }));

    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return all;
  } catch {
    return [];
  }
}
