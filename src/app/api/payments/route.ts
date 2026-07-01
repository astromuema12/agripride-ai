import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeObject } from '@/middleware/security';
import { subscriptionService } from '@/services/subscription.service';
import {
  initializePaystackPayment,
  generateReference,
  paystackConfig,
  paystackTransactionService,
} from '@/lib/paystack';
import { logger } from '@/lib/logger';

const InitPaymentSchema = z.object({
  tier: z.enum(['premium', 'cooperative', 'enterprise']),
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required'),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, InitPaymentSchema);
  if (!parsed.success) return parsed.response;

  const sanitized = sanitizeObject({ name: parsed.data.name });
  const { tier, userId, email, name } = { ...parsed.data, ...sanitized };

  const { configured } = paystackConfig();
  if (!configured) {
    return apiError(503, 'Payment service is not configured');
  }

  const plan = await subscriptionService.getByTier(tier);
  if (!plan) {
    return apiError(404, 'Plan not found');
  }

  const reference = generateReference(tier, userId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agripride-ai.vercel.app';

  const result = await initializePaystackPayment({
    amount: plan.price_kes,
    email,
    reference,
    metadata: {
      userId,
      tier,
      planId: plan.id,
      planName: plan.name,
    },
    callback_url: `${baseUrl}/api/payments/callback?reference=${reference}`,
  });

  if (!result.success) {
    return apiError(502, result.error || 'Failed to initialize payment');
  }

  await paystackTransactionService.create({
    user_id: userId,
    reference,
    paystack_id: 0,
    amount: plan.price_kes,
    currency: 'KES',
    status: 'pending',
    email,
    plan_id: plan.id,
    metadata: { tier, planName: plan.name },
  });

  logger.info('Payment initialized', {
    component: 'payments',
    metadata: { reference, tier, userId, amount: plan.price_kes },
  });

  return apiSuccess({
    authorization_url: result.data!.authorization_url,
    reference,
    plan: {
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      amount: plan.price_kes,
    },
  });
}

export const POST = withErrorHandling(handler);
