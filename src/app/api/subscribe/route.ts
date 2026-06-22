import { NextRequest } from 'next/server';
import { z } from 'zod';
import { subscriptionService, userSubscriptionService } from '@/services/subscription.service';
import { mpesaApi, mpesaTransactionService } from '@/services/mpesa.service';

const SubscribeSchema = z.object({
  tier: z.enum(['free', 'premium', 'cooperative', 'enterprise']),
  userId: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    await subscriptionService.seedPlans();

    const plan = await subscriptionService.getByTier(parsed.data.tier);
    if (!plan) {
      return Response.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    if (plan.price_kes === 0) {
      if (parsed.data.userId) {
        await userSubscriptionService.create({
          user_id: parsed.data.userId,
          plan_id: plan.id,
          status: 'active',
          started_at: new Date().toISOString(),
        } as never);
      }

      return Response.json({
        success: true,
        plan: {
          id: plan.id,
          name: plan.name,
          tier: plan.tier,
          price_kes: plan.price_kes,
          features: plan.features,
        },
        message: `Free plan selected. Account activated.`,
      });
    }

    if (!parsed.data.phone) {
      return Response.json({
        success: true,
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
      return Response.json({
        success: false,
        error: 'M-Pesa payment is not configured yet. Please contact support.',
      }, { status: 503 });
    }

    const mpesaResult = await mpesaApi.stkPush(
      parsed.data.phone,
      plan.price_kes,
      `AGRIPRIDE_${plan.tier.toUpperCase()}`,
      `${plan.name} Subscription`,
    );

    if (!mpesaResult.success) {
      return Response.json({
        success: false,
        error: mpesaResult.error || 'M-Pesa payment initiation failed',
      }, { status: 400 });
    }

    if (parsed.data.userId) {
      await userSubscriptionService.create({
        user_id: parsed.data.userId,
        plan_id: plan.id,
        status: 'trial',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as never);
    }

    await mpesaTransactionService.recordTransaction({
      phone: parsed.data.phone,
      amount: plan.price_kes,
      transaction_id: mpesaResult.data!.CheckoutRequestID,
      status: 'pending',
      user_id: parsed.data.userId,
    });

    return Response.json({
      success: true,
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
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
