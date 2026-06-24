import { supabase, isSupabaseConfigured } from './supabase';

export async function checkEmailVerified(userId: string): Promise<{
  verified: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) return { verified: true };

  const { data, error } = await supabase
    .from('users')
    .select('email_verified')
    .eq('id', userId)
    .single();

  if (error) return { verified: false, error: error.message };
  return { verified: data?.email_verified ?? false };
}

export async function resendVerificationEmail(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Email verification not available in demo mode' };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: '',
  });

  if (error) return { error: error.message };

  return {};
}

export async function sendVerificationEmail(email: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Email verification not available in demo mode' };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) return { error: error.message };
  return {};
}
