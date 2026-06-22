import { NextRequest } from 'next/server';
import { z } from 'zod';
import { mpesaApi, mpesaTransactionService } from '@/services/mpesa.service';

const StatusSchema = z.object({
  checkoutRequestID: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutRequestID = searchParams.get('checkoutRequestID');

    if (!checkoutRequestID) {
      return Response.json(
        { success: false, error: 'checkoutRequestID is required' },
        { status: 400 },
      );
    }

    const tx = await mpesaTransactionService.getByCheckoutID(checkoutRequestID);

    if (!tx) {
      return Response.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      transaction: {
        id: tx.id,
        phone: tx.phone,
        amount: tx.amount,
        status: tx.status,
        receipt_number: tx.receipt_number,
        result_code: tx.result_code,
        result_desc: tx.result_desc,
        created_at: tx.created_at,
      },
    });
  } catch (err) {
    console.error('Status query error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }

    const result = await mpesaApi.queryStatus(parsed.data.checkoutRequestID);

    if (!result.success && result.data?.ResultDesc) {
      return Response.json({
        success: false,
        error: result.data.ResultDesc,
        resultCode: result.data.ResultCode,
      });
    }

    const tx = await mpesaTransactionService.getByCheckoutID(parsed.data.checkoutRequestID);

    return Response.json({
      success: true,
      data: result.data,
      local: tx ? {
        id: tx.id,
        status: tx.status,
        receipt_number: tx.receipt_number,
      } : null,
    });
  } catch (err) {
    console.error('Status query error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
