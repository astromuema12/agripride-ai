import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { subscriptionService } from '@/services/subscription.service';
import {
  initializeFlutterwavePayment,
  generateTxRef,
  flutterwaveConfig,
  flutterwaveTransactionService,
} from '@/lib/flutterwave';
import { logger } from '@/lib/logger';

const InitPaymentSchema = z.object({
  tier: z.enum(['premium', 'cooperative', 'enterprise']),
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, InitPaymentSchema);
  if (!parsed.success) return parsed.response;

  const { tier, userId, email, name, phone } = parsed.data;

  const { configured } = flutterwaveConfig();
  if (!configured) {
    return apiError(503, 'Payment service is not configured');
  }

  const plan = await subscriptionService.getByTier(tier);
  if (!plan) {
    return apiError(404, 'Plan not found');
  }

  const txRef = generateTxRef(tier, userId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agripride-ai.vercel.app';

  const result = await initializeFlutterwavePayment({
    amount: plan.price_kes,
    currency: 'KES',
    tx_ref: txRef,
    customer: {
      email,
      name,
      phone_number: phone,
    },
    meta: {
      userId,
      tier,
      planId: plan.id,
      planName: plan.name,
    },
    redirect_url: `${baseUrl}/api/payments/callback?tx_ref=${txRef}`,
    payment_options: 'mobilemoney,card',
  });

  if (!result.success) {
    return apiError(502, result.error || 'Failed to initialize payment');
  }

  await flutterwaveTransactionService.create({
    user_id: userId,
    tx_ref: txRef,
    flw_transaction_id: 0,
    amount: plan.price_kes,
    currency: 'KES',
    payment_method: 'pending',
    status: 'pending',
    email,
    phone,
    plan_id: plan.id,
    metadata: { tier, planName: plan.name },
  });

  logger.info('Payment initialized', {
    component: 'payments',
    metadata: { txRef, tier, userId, amount: plan.price_kes },
  });

  return apiSuccess({
    checkout_url: result.data!.link,
    tx_ref: txRef,
    plan: {
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      amount: plan.price_kes,
    },
  });
}

export const POST = withErrorHandling(handler);
