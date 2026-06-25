import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackTransaction, paystackTransactionService } from '@/lib/paystack';
import { userSubscriptionService } from '@/services/subscription.service';
import { writeAuditLog } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { trackMetric } from '@/lib/monitoring';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');
  const status = searchParams.get('status');
  const trxref = searchParams.get('trxref');

  const activeRef = reference || trxref;

  if (!activeRef) {
    return NextResponse.redirect(
      new URL('/pricing?payment=failed&reason=invalid_ref', req.url),
    );
  }

  if (status === 'cancelled') {
    await paystackTransactionService.updateStatus(activeRef, 'cancelled');
    return NextResponse.redirect(
      new URL('/pricing?payment=cancelled', req.url),
    );
  }

  const verify = await verifyPaystackTransaction(activeRef);
  if (verify.success && verify.data) {
    const tx = await paystackTransactionService.getByReference(activeRef);
    if (!tx) {
      return NextResponse.redirect(
        new URL('/pricing?payment=failed&reason=not_found', req.url),
      );
    }

    if (tx.status === 'success') {
      return NextResponse.redirect(
        new URL('/dashboard/farmer?payment=already_active', req.url),
      );
    }

    const paymentSuccessful = verify.data.status === 'success';

    if (paymentSuccessful) {
      const planId = tx.plan_id;

      const existingActive = await userSubscriptionService.getUserSubscription(tx.user_id);
      if (existingActive) {
        await userSubscriptionService.update(existingActive.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        } as never);
      }

      await userSubscriptionService.create({
        user_id: tx.user_id,
        plan_id: planId,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as never);

      await paystackTransactionService.updateStatus(
        activeRef,
        'success',
        verify.data.id,
        { verified: true, verifiedAt: new Date().toISOString(), channel: verify.data.channel },
      );

      await writeAuditLog({
        user_id: tx.user_id,
        action: 'subscription_activated',
        resource: 'user_subscriptions',
        details: { planId, reference: activeRef, transactionId: verify.data.id },
      });

      trackMetric('payment_success', 1, { tier: planId, method: 'paystack' });

      logger.info('Payment successful via callback', {
        component: 'payments',
        metadata: { reference: activeRef, userId: tx.user_id, planId },
      });

      return NextResponse.redirect(
        new URL(`/dashboard/farmer?payment=success&reference=${activeRef}`, req.url),
      );
    }

    await paystackTransactionService.updateStatus(activeRef, 'failed', verify.data.id);
    return NextResponse.redirect(
      new URL(`/pricing?payment=failed&reason=${verify.data.status}`, req.url),
    );
  }

  const pendingTx = await paystackTransactionService.getByReference(activeRef);
  if (pendingTx && pendingTx.status === 'success') {
    return NextResponse.redirect(
      new URL('/dashboard/farmer?payment=success', req.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/pricing?payment=pending&reference=${activeRef}`, req.url),
  );
}
