import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverT } from '@/lib/i18n/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: serverT('en', 'api.supabaseNotConfigured') }, { status: 500 });
    }

    const { userId, provider, providerAccountId, providerEmail } = await request.json();

    if (!userId || !provider || !providerAccountId) {
      return NextResponse.json({ error: serverT('en', 'api.missingRequiredFields') }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: existing } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (existing) {
      if (existing.user_id !== userId) {
        await supabase
          .from('oauth_accounts')
          .update({ user_id: userId })
          .eq('id', existing.id);
      }
    } else {
      const { error: insertError } = await supabase.from('oauth_accounts').insert({
        user_id: userId,
        provider,
        provider_account_id: providerAccountId,
        provider_email: providerEmail ?? null,
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    await supabase
      .from('users')
      .update({ email_verified: true, email_verified_at: new Date().toISOString() })
      .eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : serverT('en', 'api.internalServerError');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
