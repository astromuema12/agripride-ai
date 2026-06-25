import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  parsePaystackWebhook,
  verifyPaystackTransaction,
  paystackTransactionService,
} from '@/lib/paystack';
import { userSubscriptionService } from '@/services/subscription.service';
import { writeAuditLog } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { reportError, trackMetric } from '@/lib/monitoring';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn('Paystack webhook invalid signature', {
      component: 'paystack',
    });
    return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parsePaystackWebhook(body);

  logger.info('Paystack webhook received', {
    component: 'paystack',
    metadata: {
      event: parsed.event,
      reference: parsed.reference,
      status: parsed.status,
    },
  });

  if (parsed.event !== 'charge.success') {
    return NextResponse.json({ status: 'ignored', message: 'Event not handled' });
  }

  if (!parsed.reference) {
    logger.warn('Paystack webhook missing reference', {
      component: 'paystack',
    });
    return NextResponse.json({ status: 'ignored', message: 'Missing reference' });
  }

  const existing = await paystackTransactionService.getByReference(parsed.reference);
  if (!existing) {
    logger.warn('Paystack webhook unknown reference', {
      component: 'paystack',
      metadata: { reference: parsed.reference },
    });
    return NextResponse.json({ status: 'ignored', message: 'Unknown transaction' });
  }

  if (existing.status === 'success') {
    logger.info('Paystack webhook duplicate for completed tx', {
      component: 'paystack',
      metadata: { reference: parsed.reference },
    });
    return NextResponse.json({ status: 'ok', message: 'Already processed' });
  }

  const verify = await verifyPaystackTransaction(parsed.reference);
  if (!verify.success) {
    await reportError(new Error('Paystack verification failed'), {
      reference: parsed.reference,
    });
    return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 502 });
  }

  const verifiedData = verify.data!;
  const paymentSuccessful = verifiedData.status === 'success';

  if (paymentSuccessful) {
    const existingActive = await userSubscriptionService.getUserSubscription(existing.user_id);
    if (existingActive) {
      await userSubscriptionService.update(existingActive.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      } as never);
    }

    await userSubscriptionService.create({
      user_id: existing.user_id,
      plan_id: existing.plan_id,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as never);

    await paystackTransactionService.updateStatus(
      parsed.reference,
      'success',
      verifiedData.id,
      {
        verified: true,
        verifiedAt: new Date().toISOString(),
        channel: verifiedData.channel,
        paid_at: verifiedData.paid_at,
      },
    );

    await writeAuditLog({
      user_id: existing.user_id,
      action: 'subscription_activated',
      resource: 'user_subscriptions',
      details: {
        planId: existing.plan_id,
        reference: parsed.reference,
        transactionId: verifiedData.id,
        source: 'webhook',
      },
    });

    trackMetric('payment_success', 1, {
      tier: existing.plan_id,
      method: 'paystack_webhook',
    });

    logger.info('Subscription activated via webhook', {
      component: 'paystack',
      metadata: {
        userId: existing.user_id,
        planId: existing.plan_id,
        reference: parsed.reference,
      },
    });
  } else {
    await paystackTransactionService.updateStatus(
      parsed.reference,
      'failed',
      verifiedData.id,
    );

    trackMetric('payment_failed', 1, {
      tier: existing.plan_id,
      method: 'paystack_webhook',
    });

    logger.info('Payment failed via webhook', {
      component: 'paystack',
      metadata: { reference: parsed.reference, status: verifiedData.status },
    });

    await writeAuditLog({
      user_id: existing.user_id,
      action: 'payment_failed',
      resource: 'paystack_transactions',
      details: { reference: parsed.reference, status: verifiedData.status },
    });
  }

  return NextResponse.json({ status: 'ok', message: 'Webhook processed' });
}
