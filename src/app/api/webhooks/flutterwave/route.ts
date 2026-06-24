import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  parseFlutterwaveWebhook,
  verifyFlutterwaveTransaction,
  flutterwaveTransactionService,
} from '@/lib/flutterwave';
import { userSubscriptionService } from '@/services/subscription.service';
import { writeAuditLog } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { reportError, trackMetric } from '@/lib/monitoring';

async function handler(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-verify-hash');

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn('Flutterwave webhook invalid signature', {
      component: 'flutterwave',
    });
    return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseFlutterwaveWebhook(body);

  logger.info('Flutterwave webhook received', {
    component: 'flutterwave',
    metadata: {
      event: parsed.event,
      txRef: parsed.txRef,
      status: parsed.status,
      transactionId: parsed.transactionId,
    },
  });

  if (parsed.event !== 'charge.completed') {
    return NextResponse.json({ status: 'ignored', message: 'Event not handled' });
  }

  if (!parsed.txRef || !parsed.transactionId) {
    logger.warn('Flutterwave webhook missing tx_ref or transaction_id', {
      component: 'flutterwave',
    });
    return NextResponse.json({ status: 'ignored', message: 'Missing required fields' });
  }

  const existing = await flutterwaveTransactionService.getByTxRef(parsed.txRef);
  if (!existing) {
    logger.warn('Flutterwave webhook unknown tx_ref', {
      component: 'flutterwave',
      metadata: { txRef: parsed.txRef },
    });
    return NextResponse.json({ status: 'ignored', message: 'Unknown transaction' });
  }

  if (existing.status === 'successful') {
    logger.info('Flutterwave webhook duplicate for completed tx', {
      component: 'flutterwave',
      metadata: { txRef: parsed.txRef },
    });
    return NextResponse.json({ status: 'ok', message: 'Already processed' });
  }

  const verify = await verifyFlutterwaveTransaction(parsed.transactionId);
  if (!verify.success) {
    await reportError(new Error('Flutterwave verification failed'), {
      txRef: parsed.txRef,
      transactionId: parsed.transactionId,
    });
    return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 502 });
  }

  const verifiedData = verify.data!;
  const paymentSuccessful = verifiedData.status === 'successful';

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

    await flutterwaveTransactionService.updateStatus(
      parsed.txRef,
      'successful',
      parsed.transactionId,
      {
        verified: true,
        verifiedAt: new Date().toISOString(),
        paymentType: verifiedData.payment_type,
      },
    );

    await writeAuditLog({
      user_id: existing.user_id,
      action: 'subscription_activated',
      resource: 'user_subscriptions',
      details: {
        planId: existing.plan_id,
        txRef: parsed.txRef,
        transactionId: parsed.transactionId,
        source: 'webhook',
      },
    });

    trackMetric('payment_success', 1, {
      tier: existing.plan_id,
      method: 'flutterwave_webhook',
    });

    logger.info('Subscription activated via webhook', {
      component: 'flutterwave',
      metadata: {
        userId: existing.user_id,
        planId: existing.plan_id,
        txRef: parsed.txRef,
      },
    });
  } else {
    await flutterwaveTransactionService.updateStatus(
      parsed.txRef,
      'failed',
      parsed.transactionId,
    );

    trackMetric('payment_failed', 1, {
      tier: existing.plan_id,
      method: 'flutterwave_webhook',
    });

    logger.info('Payment failed via webhook', {
      component: 'flutterwave',
      metadata: { txRef: parsed.txRef, status: verifiedData.status },
    });

    await writeAuditLog({
      user_id: existing.user_id,
      action: 'payment_failed',
      resource: 'flutterwave_transactions',
      details: { txRef: parsed.txRef, status: verifiedData.status },
    });
  }

  return NextResponse.json({ status: 'ok', message: 'Webhook processed' });
}

export const POST = handler;
