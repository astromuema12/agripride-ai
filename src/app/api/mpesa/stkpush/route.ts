import { NextRequest } from 'next/server';
import { z } from 'zod';
import { mpesaApi, mpesaTransactionService } from '@/services/mpesa.service';

const StkPushSchema = z.object({
  phone: z.string().min(10).max(13),
  amount: z.number().positive(),
  accountReference: z.string().min(1).max(12),
  transactionDesc: z.string().max(50).default('AgriPride AI Subscription'),
  userId: z.string().optional(),
  planId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!mpesaApi.isConfigured) {
      return Response.json(
        { success: false, error: 'M-Pesa is not configured. Set MPESA_* environment variables.' },
        { status: 503 },
      );
    }

    const body = await req.json();
    const parsed = StkPushSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }

    const { phone, amount, accountReference, transactionDesc, userId, planId } = parsed.data;

    const result = await mpesaApi.stkPush(phone, amount, accountReference, transactionDesc);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error || 'STK push failed' },
        { status: 400 },
      );
    }

    await mpesaTransactionService.recordTransaction({
      phone,
      amount,
      transaction_id: result.data!.CheckoutRequestID,
      status: 'pending',
      user_id: userId,
    });

    return Response.json({
      success: true,
      checkoutRequestID: result.data!.CheckoutRequestID,
      merchantRequestID: result.data!.MerchantRequestID,
      message: 'M-Pesa prompt sent. Check your phone to complete payment.',
    });
  } catch (err) {
    console.error('STK Push error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
