import { NextRequest } from 'next/server';
import { z } from 'zod';
import { subscriptionService, userSubscriptionService } from '@/services/subscription.service';
import { mpesaApi, mpesaTransactionService } from '@/services/mpesa.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

const SubscribeSchema = z.object({
  tier: z.enum(['free', 'premium', 'cooperative', 'enterprise']),
  userId: z.string().optional(),
  phone: z.string().optional(),
  paymentMethod: z.enum(['mpesa', 'flutterwave']).optional().default('mpesa'),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, SubscribeSchema);
  if (!parsed.success) return parsed.response;

  const { tier, userId, phone, paymentMethod, email, name } = parsed.data;

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

  if (paymentMethod === 'flutterwave') {
    const flwConfigured = !!(
      process.env.FLW_PUBLIC_KEY &&
      process.env.FLW_SECRET_KEY &&
      process.env.FLW_ENCRYPTION_KEY
    );

    if (!flwConfigured) {
      return apiError(503, 'Flutterwave payment is not configured. Please contact support.');
    }

    const { generateTxRef } = await import('@/lib/flutterwave');
    const txRef = generateTxRef(tier, userId || 'guest');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agripride-ai.vercel.app';

    const { initializeFlutterwavePayment, flutterwaveTransactionService } = await import('@/lib/flutterwave');

    const result = await initializeFlutterwavePayment({
      amount: plan.price_kes,
      currency: 'KES',
      tx_ref: txRef,
      customer: {
        email: email || `${userId || 'guest'}@agripride.ai`,
        name: name || 'Farmer',
        phone_number: phone,
      },
      meta: { userId, tier, planId: plan.id, planName: plan.name },
      redirect_url: `${baseUrl}/api/payments/callback?tx_ref=${txRef}`,
      payment_options: 'mobilemoney,card',
    });

    if (!result.success) {
      return apiError(502, result.error || 'Failed to initialize payment');
    }

    await flutterwaveTransactionService.create({
      user_id: userId || 'guest',
      tx_ref: txRef,
      flw_transaction_id: 0,
      amount: plan.price_kes,
      currency: 'KES',
      payment_method: 'pending',
      status: 'pending',
      email: email || '',
      plan_id: plan.id,
      metadata: { tier, planName: plan.name },
    });

    logger.info('Flutterwave payment initiated from subscribe', {
      component: 'subscribe',
      metadata: { txRef, tier, userId },
    });

    return apiSuccess({
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price_kes: plan.price_kes,
        features: plan.features,
      },
      checkout_url: result.data!.link,
      tx_ref: txRef,
      message: 'Redirecting to payment page...',
    });
  }

  if (!phone) {
    return apiSuccess({
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price_kes: plan.price_kes,
        features: plan.features,
      },
      requiresMpesa: true,
      message: `Selected ${plan.name} plan. Provide phone number for M-Pesa payment.`,
    });
  }

  if (!mpesaApi.isConfigured) {
    return apiError(503, 'M-Pesa payment is not configured yet. Please contact support.');
  }

  const mpesaResult = await mpesaApi.stkPush(
    phone,
    plan.price_kes,
    `AGRIPRIDE_${tier.toUpperCase()}`,
    `${plan.name} Subscription`,
  );

  if (!mpesaResult.success) {
    return apiError(400, mpesaResult.error || 'M-Pesa payment initiation failed');
  }

  if (userId) {
    await userSubscriptionService.create({
      user_id: userId,
      plan_id: plan.id,
      status: 'trial',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as never);
  }

  await mpesaTransactionService.recordTransaction({
    phone,
    amount: plan.price_kes,
    transaction_id: mpesaResult.data!.CheckoutRequestID,
    status: 'pending',
    user_id: userId,
  });

  return apiSuccess({
    plan: {
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      price_kes: plan.price_kes,
      features: plan.features,
    },
    checkoutRequestID: mpesaResult.data!.CheckoutRequestID,
    merchantRequestID: mpesaResult.data!.MerchantRequestID,
    message: 'M-Pesa prompt sent. Check your phone to complete payment.',
  });
}

export const POST = withErrorHandling(handler);
