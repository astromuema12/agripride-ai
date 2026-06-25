import { BaseService } from '@/services/base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/monitoring';
import type { PaystackTransaction, PaystackPaymentStatus } from '@/types';

const PAYSTACK_BASE = 'https://api.paystack.co';

function getConfig() {
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || '';
  const configured = !!(publicKey && secretKey);
  return { publicKey, secretKey, webhookSecret, configured };
}

export const paystackConfig = getConfig;

export interface InitPaymentParams {
  amount: number;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url: string;
  currency?: string;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel: string;
    customer: { email: string; customer_code?: string };
    paid_at: string;
    metadata?: Record<string, unknown>;
  };
}

export function generateReference(tier: string, userId: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AP_${tier.toUpperCase()}_${userId.slice(0, 8)}_${ts}_${rand}`;
}

export async function initializePaystackPayment(
  params: InitPaymentParams,
): Promise<{ success: boolean; data?: { authorization_url: string; reference: string }; error?: string }> {
  const { secretKey, configured } = getConfig();
  if (!configured) {
    return { success: false, error: 'Paystack is not configured' };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        reference: params.reference,
        amount: Math.round(params.amount * 100),
        currency: params.currency || 'KES',
        email: params.email,
        callback_url: params.callback_url,
        metadata: params.metadata || {},
      }),
    });

    const data: PaystackInitResponse = await response.json();

    if (!response.ok || !data.status) {
      logger.error('Paystack init failed', {
        component: 'paystack',
        metadata: { status: response.status, response: data },
      });
      return {
        success: false,
        error: data.message || 'Payment initialization failed',
      };
    }

    logger.info('Paystack payment initialized', {
      component: 'paystack',
      metadata: { reference: params.reference, url: data.data?.authorization_url },
    });

    return {
      success: true,
      data: { authorization_url: data.data!.authorization_url, reference: params.reference },
    };
  } catch (err) {
    await reportError(err, { reference: params.reference, component: 'paystack' });
    return { success: false, error: 'Payment service unavailable' };
  }
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<{ success: boolean; data?: PaystackVerifyResponse['data']; error?: string }> {
  const { secretKey, configured } = getConfig();
  if (!configured) {
    return { success: false, error: 'Paystack is not configured' };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data: PaystackVerifyResponse = await response.json();

    if (!response.ok || !data.status) {
      logger.error('Paystack verification failed', {
        component: 'paystack',
        metadata: { reference, status: response.status },
      });
      return {
        success: false,
        error: data.message || 'Verification failed',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    await reportError(err, { reference, component: 'paystack' });
    return { success: false, error: 'Verification service unavailable' };
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const { webhookSecret } = getConfig();
  if (!webhookSecret) {
    logger.warn('Paystack webhook secret not configured', {
      component: 'paystack',
    });
    return false;
  }

  try {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha512', webhookSecret)
      .update(body)
      .digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
    return isValid;
  } catch {
    return false;
  }
}

export function parsePaystackWebhook(body: Record<string, unknown>): {
  event: string;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  customer?: { email?: string };
  paid_at?: string;
  metadata?: Record<string, unknown>;
} {
  const event = (body.event as string) || '';
  const data = body.data as Record<string, unknown> | undefined;

  if (!data) {
    return { event };
  }

  return {
    event,
    reference: data.reference as string,
    status: data.status as string,
    amount: data.amount as number,
    currency: data.currency as string,
    customer: data.customer as { email?: string } | undefined,
    paid_at: data.paid_at as string,
    metadata: data.metadata as Record<string, unknown> | undefined,
  };
}

export class PaystackTransactionService extends BaseService<PaystackTransaction> {
  protected storeName = 'paystackTransactions' as const;

  async getByReference(reference: string): Promise<PaystackTransaction | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('paystack_transactions')
        .select('*')
        .eq('reference', reference)
        .single();
      return data as PaystackTransaction | null;
    }
    const all = await this.getAll();
    return all.find((t) => t.reference === reference) ?? null;
  }

  async getByPaystackId(paystackId: number): Promise<PaystackTransaction | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('paystack_transactions')
        .select('*')
        .eq('paystack_id', paystackId)
        .maybeSingle();
      return data as PaystackTransaction | null;
    }
    const all = await this.getAll();
    return all.find((t) => t.paystack_id === paystackId) ?? null;
  }

  async getUserTransactions(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: PaystackTransaction[]; total: number }> {
    if (isSupabaseConfigured) {
      const [{ data, count, error }, { count: total }] = await Promise.all([
        supabase!
          .from('paystack_transactions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase!
          .from('paystack_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);
      if (error) throw error;
      return { data: (data ?? []) as PaystackTransaction[], total: total ?? 0 };
    }
    const all = await this.getAll();
    const filtered = all.filter((t) => t.user_id === userId);
    return {
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async updateStatus(
    reference: string,
    status: PaystackPaymentStatus,
    paystackId?: number,
    metadata?: Record<string, unknown>,
  ): Promise<PaystackTransaction | null> {
    const existing = await this.getByReference(reference);
    if (!existing) return null;

    const updates: Record<string, unknown> = { status };
    if (paystackId) updates.paystack_id = paystackId;
    if (metadata) updates.metadata = metadata;

    return this.update(existing.id, updates as Partial<PaystackTransaction>);
  }

  async getAllTransactions(
    limit = 50,
    offset = 0,
  ): Promise<{ data: PaystackTransaction[]; total: number }> {
    if (isSupabaseConfigured) {
      const [{ data, count, error }, { count: total }] = await Promise.all([
        supabase!
          .from('paystack_transactions')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase!
          .from('paystack_transactions')
          .select('*', { count: 'exact', head: true }),
      ]);
      if (error) throw error;
      return { data: (data ?? []) as PaystackTransaction[], total: total ?? 0 };
    }
    const all = await this.getAll();
    return {
      data: all.slice(offset, offset + limit),
      total: all.length,
    };
  }
}

export const paystackTransactionService = new PaystackTransactionService();
