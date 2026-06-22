import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MpesaTransaction } from '@/types';

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: {
          Name: string;
          Value: string | number;
        }[];
      };
    };
  };
}

class MpesaApiService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private passkey: string;
  private shortcode: string;
  private tillNumber: string;
  private transactionType: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.tillNumber = process.env.MPESA_TILL_NUMBER || '';
    this.transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerBuyGoodsOnline';
    const env = process.env.MPESA_ENV || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  get isConfigured(): boolean {
    return !!(this.consumerKey && this.consumerSecret && this.passkey);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } },
    );

    if (!res.ok) throw new Error('Failed to get M-Pesa access token');

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 10) * 1000;
    return this.accessToken!;
  }

  private getTimestamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${mi}${s}`;
  }

  private getPassword(): string {
    const timestamp = this.getTimestamp();
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
  }

  async stkPush(
    phone: string,
    amount: number,
    accountReference: string,
    transactionDesc: string,
  ): Promise<{ success: boolean; data?: StkPushResponse; error?: string }> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword();

      const cleanedPhone = phone.replace(/\D/g, '');
      const msisdn = cleanedPhone.startsWith('0')
        ? `254${cleanedPhone.slice(1)}`
        : cleanedPhone.startsWith('254')
          ? cleanedPhone
          : `254${cleanedPhone}`;

      const partyB = this.tillNumber || this.shortcode;

      const res = await fetch(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: this.transactionType,
            Amount: Math.round(amount),
            PartyA: msisdn,
            PartyB: partyB,
            PhoneNumber: msisdn,
            CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agripride-ai.vercel.app'}/api/mpesa/callback`,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc,
          }),
        },
      );

      const data: StkPushResponse = await res.json();

      if (data.ResponseCode === '0') {
        return { success: true, data };
      }

      return { success: false, error: data.ResponseDescription || data.CustomerMessage };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'STK push failed' };
    }
  }

  async queryStatus(checkoutRequestID: string): Promise<{ success: boolean; data?: StkQueryResponse; error?: string }> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword();

      const res = await fetch(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID,
          }),
        },
      );

      const data: StkQueryResponse = await res.json();
      return { success: data.ResponseCode === '0', data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Status query failed' };
    }
  }

  extractCallbackData(body: MpesaCallbackBody) {
    const { stkCallback } = body.Body;
    const result: {
      merchantRequestID: string;
      checkoutRequestID: string;
      resultCode: number;
      resultDesc: string;
      receiptNumber?: string;
      phoneNumber?: string;
      amount?: number;
      transactionDate?: string;
    } = {
      merchantRequestID: stkCallback.MerchantRequestID,
      checkoutRequestID: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
    };

    if (stkCallback.CallbackMetadata?.Item) {
      for (const item of stkCallback.CallbackMetadata.Item) {
        switch (item.Name) {
          case 'MpesaReceiptNumber':
            result.receiptNumber = String(item.Value);
            break;
          case 'PhoneNumber':
            result.phoneNumber = String(item.Value);
            break;
          case 'Amount':
            result.amount = Number(item.Value);
            break;
          case 'TransactionDate':
            result.transactionDate = String(item.Value);
            break;
        }
      }
    }

    return result;
  }
}

export class MpesaTransactionService extends BaseService<MpesaTransaction> {
  protected storeName = 'mpesaTransactions' as const;

  async recordTransaction(data: Omit<MpesaTransaction, 'id' | 'created_at'>): Promise<MpesaTransaction> {
    return this.create(data);
  }

  async updateTransactionStatus(
    id: string,
    status: MpesaTransaction['status'],
    updates: Partial<MpesaTransaction>,
  ): Promise<MpesaTransaction | null> {
    return this.update(id, { ...updates, status } as Partial<MpesaTransaction>);
  }

  async getByCheckoutID(checkoutRequestID: string): Promise<MpesaTransaction | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('mpesa_transactions')
        .select('*')
        .eq('transaction_id', checkoutRequestID)
        .single();
      return data as MpesaTransaction | null;
    }
    const all = await this.getAll();
    return all.find((t) => t.transaction_id === checkoutRequestID) ?? null;
  }
}

export const mpesaApi = new MpesaApiService();
export const mpesaTransactionService = new MpesaTransactionService();
