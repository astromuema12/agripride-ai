import { NextRequest } from 'next/server';
import { z } from 'zod';
import { subscriptionService } from '@/services/subscription.service';

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

    return Response.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price_kes: plan.price_kes,
        features: plan.features,
      },
      message: `Selected ${plan.name} plan. Complete registration to activate.`,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
