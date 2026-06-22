import { NextRequest } from 'next/server';
import { mpesaApi, mpesaTransactionService } from '@/services/mpesa.service';
import { userSubscriptionService } from '@/services/subscription.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackData = mpesaApi.extractCallbackData(body);
    const { resultCode, checkoutRequestID, receiptNumber, phoneNumber, amount } = callbackData;

    const existing = await mpesaTransactionService.getByCheckoutID(checkoutRequestID);

    if (resultCode === 0) {
      await mpesaTransactionService.updateTransactionStatus(
        existing?.id ?? checkoutRequestID,
        'success',
        {
          receipt_number: receiptNumber,
          phone: phoneNumber || existing?.phone,
          amount: amount || existing?.amount,
        },
      );

      const tx = existing || await mpesaTransactionService.getByCheckoutID(checkoutRequestID);
      if (tx?.user_id) {
        const subs = await userSubscriptionService.getUserSubscription(tx.user_id);
        if (subs) {
          await userSubscriptionService.update(subs.id, {
            status: 'active',
            mpesa_receipt: receiptNumber,
          } as never);
        }
      }
    } else {
      if (existing) {
        await mpesaTransactionService.updateTransactionStatus(
          existing.id,
          'failed',
          { result_code: resultCode, result_desc: callbackData.resultDesc },
        );
      }
    }

    return Response.json({ success: true, message: 'Callback processed' });
  } catch (err) {
    console.error('M-Pesa callback error:', err);
    return Response.json({ success: true, message: 'Callback received' });
  }
}
