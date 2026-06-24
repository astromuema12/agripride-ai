import { NextRequest, NextResponse } from 'next/server';
import { verifyFlutterwaveTransaction, flutterwaveTransactionService } from '@/lib/flutterwave';
import { userSubscriptionService } from '@/services/subscription.service';
import { writeAuditLog } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { trackMetric } from '@/lib/monitoring';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');
  const transactionId = searchParams.get('transaction_id');

  if (!txRef) {
    return NextResponse.redirect(
      new URL('/pricing?payment=failed&reason=invalid_ref', req.url),
    );
  }

  if (status === 'cancelled') {
    await flutterwaveTransactionService.updateStatus(txRef, 'cancelled');
    return NextResponse.redirect(
      new URL('/pricing?payment=cancelled', req.url),
    );
  }

  if (status === 'successful' && transactionId) {
    const verify = await verifyFlutterwaveTransaction(Number(transactionId));
    if (verify.success && verify.data) {
      const tx = await flutterwaveTransactionService.getByTxRef(txRef);
      if (!tx) {
        return NextResponse.redirect(
          new URL('/pricing?payment=failed&reason=not_found', req.url),
        );
      }

      if (tx.status === 'successful') {
        return NextResponse.redirect(
          new URL('/dashboard/farmer?payment=already_active', req.url),
        );
      }

      const paymentStatus = verify.data.status;
      if (paymentStatus === 'successful') {
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

        await flutterwaveTransactionService.updateStatus(
          txRef,
          'successful',
          Number(transactionId),
          { verified: true, verifiedAt: new Date().toISOString() },
        );

        await writeAuditLog({
          user_id: tx.user_id,
          action: 'subscription_activated',
          resource: 'user_subscriptions',
          details: { planId, txRef, transactionId: Number(transactionId) },
        });

        trackMetric('payment_success', 1, { tier: planId, method: 'flutterwave' });

        logger.info('Payment successful via callback', {
          component: 'payments',
          metadata: { txRef, userId: tx.user_id, planId },
        });

        return NextResponse.redirect(
          new URL(`/dashboard/farmer?payment=success&tx_ref=${txRef}`, req.url),
        );
      }

      await flutterwaveTransactionService.updateStatus(txRef, 'failed', Number(transactionId));
      return NextResponse.redirect(
        new URL(`/pricing?payment=failed&reason=${paymentStatus}`, req.url),
      );
    }
  }

  const pendingTx = await flutterwaveTransactionService.getByTxRef(txRef);
  if (pendingTx && pendingTx.status === 'successful') {
    return NextResponse.redirect(
      new URL('/dashboard/farmer?payment=success', req.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/pricing?payment=pending&tx_ref=${txRef}`, req.url),
  );
}
