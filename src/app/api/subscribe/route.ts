import { NextRequest } from 'next/server';
import { z } from 'zod';
import { subscriptionService, userSubscriptionService } from '@/services/subscription.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeObject } from '@/middleware/security';
import { generateReference, initializePaystackPayment, paystackTransactionService } from '@/lib/paystack';
import { logger } from '@/lib/logger';
import { serverT } from '@/lib/i18n/server';

const SubscribeSchema = z.object({
  tier: z.enum(['free', 'premium', 'cooperative', 'enterprise']),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, SubscribeSchema);
  if (!parsed.success) return parsed.response;

  const sanitized = sanitizeObject({ name: parsed.data.name, email: parsed.data.email });
  const { tier, userId, email, name } = { ...parsed.data, ...sanitized };

  await subscriptionService.seedPlans();

  const plan = await subscriptionService.getByTier(tier);
  if (!plan) {
    return apiError(404, serverT('en', 'payments.planNotFound'));
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
      message: serverT('en', 'subscribe.freePlanActivated'),
    });
  }

  const pstkConfigured = !!(
    process.env.PAYSTACK_PUBLIC_KEY &&
    process.env.PAYSTACK_SECRET_KEY
  );

  if (!pstkConfigured) {
    return apiError(503, serverT('en', 'payments.paystackNotConfigured'));
  }

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
    return apiError(502, result.error || serverT('en', 'payments.initFailed'));
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
  }).catch((err) => {
    logger.error('Failed to persist Paystack transaction', {
      component: 'subscribe',
      error: err,
      metadata: { reference },
    });
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
    message: serverT('en', 'subscribe.redirectingToPayment'),
  });
}

export const POST = withErrorHandling(handler);
