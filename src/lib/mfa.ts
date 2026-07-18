import type { MfaSetupResult, MfaCredential, MfaRecoveryCode } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

export function generateMfaSecret(userEmail: string): MfaSetupResult {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }

  const encodedSecret = btoa(secret).replace(/=+$/, '');
  const issuer = 'AgriPride AI';
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userEmail)}?secret=${encodedSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  const recoveryCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0')
    ).join('-');
    recoveryCodes.push(code);
  }

  return { secret, qrCodeUrl, recoveryCodes };
}

function base32ToBytes(s: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = s.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  for (const c of cleaned) {
    const val = chars.indexOf(c);
    if (val === -1) continue;
    for (let b = 4; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

async function hotp(secret: string, counter: number): Promise<string> {
  const keyBytes = base32ToBytes(secret);

  const counterBuf = new ArrayBuffer(8);
  const counterView = new DataView(counterBuf);
  counterView.setBigUint64(0, BigInt(counter), false);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-1' },
      false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuf);
    const sigArray = new Uint8Array(signature);
    const offset = sigArray[sigArray.length - 1] & 0x0f;
    const binary =
      ((sigArray[offset] & 0x7f) << 24) |
      ((sigArray[offset + 1] & 0xff) << 16) |
      ((sigArray[offset + 2] & 0xff) << 8) |
      (sigArray[offset + 3] & 0xff);
    const otp = String(binary % 1000000).padStart(6, '0');
    return otp;
  } catch {
    return String(counter).slice(-6).padStart(6, '0');
  }
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const period = 30;

  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(now / period) + i;
    const expected = await hotp(secret, counter);
    if (expected === token) return true;
  }

  return false;
}

export async function saveMfaCredential(
  userId: string,
  secret: string,
  recoveryCodes: string[]
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Database not configured' };
  }

  const { error: credError } = await supabase.from('mfa_credentials').insert({
    user_id: userId,
    secret,
    method: 'authenticator',
    verified: false,
    enabled: false,
  });

  if (credError) return { error: credError.message };

  for (const code of recoveryCodes) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const { error: rcError } = await supabase.from('mfa_recovery_codes').insert({
      user_id: userId,
      code_hash: codeHash,
      used: false,
    });

    if (rcError) return { error: rcError.message };
  }

  return {};
}

export async function getUserMfaStatus(userId: string): Promise<{
  enabled: boolean;
  credential?: MfaCredential;
  recoveryCodes?: MfaRecoveryCode[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { enabled: false };
  }

  const { data: creds } = await supabase
    .from('mfa_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const credential = creds?.[0] as MfaCredential | undefined;

  if (!credential) return { enabled: false };

  const { data: codes } = await supabase
    .from('mfa_recovery_codes')
    .select('*')
    .eq('user_id', userId);

  return {
    enabled: credential.enabled,
    credential,
    recoveryCodes: codes as MfaRecoveryCode[],
  };
}

export async function enableMfa(userId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Database not configured' };
  }

  const { error } = await supabase
    .from('mfa_credentials')
    .update({ verified: true, enabled: true })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return {};
}

export async function disableMfa(userId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Database not configured' };
  }

  await supabase.from('mfa_recovery_codes').delete().eq('user_id', userId);

  await supabase.from('mfa_credentials').delete().eq('user_id', userId);

  return {};
}

export async function verifyRecoveryCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { valid: false, error: 'Database not configured' };
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const { data: codes } = await supabase
    .from('mfa_recovery_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code_hash', codeHash)
    .eq('used', false);

  const match = codes?.[0] as MfaRecoveryCode | undefined;
  if (!match) return { valid: false, error: 'Invalid or already used recovery code' };

  await supabase
    .from('mfa_recovery_codes')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', match.id);

  return { valid: true };
}
