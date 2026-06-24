import { BaseService } from '@/services/base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/monitoring';
import type { FlutterwaveTransaction, FlutterwavePaymentStatus } from '@/types';

const FLW_BASE = 'https://api.flutterwave.com/v3';

function getConfig() {
  const publicKey = process.env.FLW_PUBLIC_KEY || '';
  const secretKey = process.env.FLW_SECRET_KEY || '';
  const encryptionKey = process.env.FLW_ENCRYPTION_KEY || '';
  const webhookSecret = process.env.FLW_WEBHOOK_SECRET || '';
  const configured = !!(publicKey && secretKey);
  return { publicKey, secretKey, encryptionKey, webhookSecret, configured };
}

export const flutterwaveConfig = getConfig;

export interface InitPaymentParams {
  amount: number;
  currency?: string;
  tx_ref: string;
  customer: { email: string; name: string; phone_number?: string };
  meta?: Record<string, unknown>;
  redirect_url: string;
  payment_options?: string;
}

export interface FlutterwaveInitResponse {
  success: boolean;
  data?: { link: string; tx_ref: string };
  error?: string;
}

export interface FlutterwaveVerifyResponse {
  success: boolean;
  data?: {
    id: number;
    tx_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    customer: { email: string; phone_number?: string; name?: string };
  };
  error?: string;
}

export function generateTxRef(tier: string, userId: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AP_${tier.toUpperCase()}_${userId.slice(0, 8)}_${ts}_${rand}`;
}

export async function initializeFlutterwavePayment(
  params: InitPaymentParams,
): Promise<FlutterwaveInitResponse> {
  const { secretKey, configured } = getConfig();
  if (!configured) {
    return { success: false, error: 'Flutterwave is not configured' };
  }

  try {
    const response = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        tx_ref: params.tx_ref,
        amount: params.amount,
        currency: params.currency || 'KES',
        redirect_url: params.redirect_url,
        payment_options: params.payment_options || 'mobilemoney,card',
        meta: params.meta || {},
        customer: {
          email: params.customer.email,
          name: params.customer.name,
          phone_number: params.customer.phone_number,
        },
        customizations: {
          title: 'AgriPride AI',
          description: 'Subscription Payment',
          logo: 'https://agripride-ai.vercel.app/favicon.ico',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      logger.error('Flutterwave init failed', {
        component: 'flutterwave',
        metadata: { status: response.status, response: data },
      });
      return {
        success: false,
        error: data.message || 'Payment initialization failed',
      };
    }

    logger.info('Flutterwave payment initialized', {
      component: 'flutterwave',
      metadata: { tx_ref: params.tx_ref, link: data.data?.link },
    });

    return {
      success: true,
      data: { link: data.data.link, tx_ref: params.tx_ref },
    };
  } catch (err) {
    await reportError(err, { tx_ref: params.tx_ref, component: 'flutterwave' });
    return { success: false, error: 'Payment service unavailable' };
  }
}

export async function verifyFlutterwaveTransaction(
  transactionId: number,
): Promise<FlutterwaveVerifyResponse> {
  const { secretKey, configured } = getConfig();
  if (!configured) {
    return { success: false, error: 'Flutterwave is not configured' };
  }

  try {
    const response = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      logger.error('Flutterwave verification failed', {
        component: 'flutterwave',
        metadata: { transactionId, status: response.status },
      });
      return {
        success: false,
        error: data.message || 'Verification failed',
      };
    }

    return {
      success: true,
      data: {
        id: data.data.id,
        tx_ref: data.data.tx_ref,
        amount: data.data.amount,
        currency: data.data.currency,
        status: data.data.status,
        payment_type: data.data.payment_type,
        customer: data.data.customer,
      },
    };
  } catch (err) {
    await reportError(err, { transactionId, component: 'flutterwave' });
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
    logger.warn('Flutterwave webhook secret not configured', {
      component: 'flutterwave',
    });
    return false;
  }

  try {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', webhookSecret)
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

export function parseFlutterwaveWebhook(body: Record<string, unknown>): {
  event: string;
  transactionId?: number;
  txRef?: string;
  status?: string;
  amount?: number;
  currency?: string;
  customer?: { email?: string; phone?: string };
} {
  const event = (body.event as string) || '';
  const data = body.data as Record<string, unknown> | undefined;

  if (!data) {
    return { event };
  }

  return {
    event,
    transactionId: data.id as number,
    txRef: data.tx_ref as string,
    status: data.status as string,
    amount: data.amount as number,
    currency: data.currency as string,
    customer: data.customer as { email?: string; phone?: string } | undefined,
  };
}

export class FlutterwaveTransactionService extends BaseService<FlutterwaveTransaction> {
  protected storeName = 'flutterwaveTransactions' as const;

  async getByTxRef(txRef: string): Promise<FlutterwaveTransaction | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('flutterwave_transactions')
        .select('*')
        .eq('tx_ref', txRef)
        .single();
      return data as FlutterwaveTransaction | null;
    }
    const all = await this.getAll();
    return all.find((t) => t.tx_ref === txRef) ?? null;
  }

  async getByFlwId(flwId: number): Promise<FlutterwaveTransaction | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('flutterwave_transactions')
        .select('*')
        .eq('flw_transaction_id', flwId)
        .maybeSingle();
      return data as FlutterwaveTransaction | null;
    }
    const all = await this.getAll();
    return all.find((t) => t.flw_transaction_id === flwId) ?? null;
  }

  async getUserTransactions(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: FlutterwaveTransaction[]; total: number }> {
    if (isSupabaseConfigured) {
      const [{ data, count, error }, { count: total }] = await Promise.all([
        supabase!
          .from('flutterwave_transactions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase!
          .from('flutterwave_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);
      if (error) throw error;
      return { data: (data ?? []) as FlutterwaveTransaction[], total: total ?? 0 };
    }
    const all = await this.getAll();
    const filtered = all.filter((t) => t.user_id === userId);
    return {
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async updateStatus(
    txRef: string,
    status: FlutterwavePaymentStatus,
    flwTransactionId?: number,
    metadata?: Record<string, unknown>,
  ): Promise<FlutterwaveTransaction | null> {
    const existing = await this.getByTxRef(txRef);
    if (!existing) return null;

    const updates: Record<string, unknown> = { status };
    if (flwTransactionId) updates.flw_transaction_id = flwTransactionId;
    if (metadata) updates.metadata = metadata;

    return this.update(existing.id, updates as Partial<FlutterwaveTransaction>);
  }
}

export const flutterwaveTransactionService = new FlutterwaveTransactionService();
