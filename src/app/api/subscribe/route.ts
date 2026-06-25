import { NextRequest } from 'next/server';
import { z } from 'zod';
import { subscriptionService, userSubscriptionService } from '@/services/subscription.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

const SubscribeSchema = z.object({
  tier: z.enum(['free', 'premium', 'cooperative', 'enterprise']),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, SubscribeSchema);
  if (!parsed.success) return parsed.response;

  const { tier, userId, email, name } = parsed.data;

  await subscriptionService.seedPlans();

  const plan = await subscriptionService.getByTier(tier);
  if (!plan) {
    return apiError(404, 'Plan not found');
  }

  if (plan.price_kes === 0) {
    if (userId) {
      await userSubscriptionService.create({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        started_at: new Date().toISOString(),
      } as never);
    }

    return apiSuccess({
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price_kes: plan.price_kes,
        features: plan.features,
      },
      message: 'Free plan selected. Account activated.',
    });
  }

  const pstkConfigured = !!(
    process.env.PAYSTACK_PUBLIC_KEY &&
    process.env.PAYSTACK_SECRET_KEY
  );

  if (!pstkConfigured) {
    return apiError(503, 'Paystack payment is not configured. Please contact support.');
  }

  const { generateReference, initializePaystackPayment, paystackTransactionService } = await import('@/lib/paystack');
  const reference = generateReference(tier, userId || 'guest');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agripride-ai.vercel.app';

  const result = await initializePaystackPayment({
    amount: plan.price_kes,
    email: email || `${userId || 'guest'}@agripride.ai`,
    reference,
    metadata: { userId, tier, planId: plan.id, planName: plan.name },
    callback_url: `${baseUrl}/api/payments/callback?reference=${reference}`,
  });

  if (!result.success) {
    return apiError(502, result.error || 'Failed to initialize payment');
  }

  await paystackTransactionService.create({
    user_id: userId || 'guest',
    reference,
    paystack_id: 0,
    amount: plan.price_kes,
    currency: 'KES',
    status: 'pending',
    email: email || '',
    plan_id: plan.id,
    metadata: { tier, planName: plan.name },
  });

  logger.info('Paystack payment initiated from subscribe', {
    component: 'subscribe',
    metadata: { reference, tier, userId },
  });

  return apiSuccess({
    plan: {
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      price_kes: plan.price_kes,
      features: plan.features,
    },
    authorization_url: result.data!.authorization_url,
    reference,
    message: 'Redirecting to payment page...',
  });
}

export const POST = withErrorHandling(handler);
