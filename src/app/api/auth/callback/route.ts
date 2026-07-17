import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverT } from '@/lib/i18n/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard/farmer';

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        const email = data.user.email ?? '';
        const metadata = data.user.user_metadata;
        const name = metadata?.name ?? metadata?.full_name ?? email.split('@')[0] ?? serverT('en', 'authExtra.defaultUserName');
        const avatar = metadata?.avatar_url ?? metadata?.picture ?? null;

        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role: 'farmer',
          avatar_url: avatar,
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        }).select().single();
      } else {
        const email = data.user.email ?? '';
        const metadata = data.user.user_metadata;
        const avatar = metadata?.avatar_url ?? metadata?.picture ?? null;

        await supabase
          .from('users')
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            ...(avatar ? { avatar_url: avatar } : {}),
          })
          .eq('id', data.user.id);
      }

      const provider = data.user.app_metadata?.provider ?? 'unknown';
      const providerAccountId = data.user.identities?.[0]?.id ?? data.user.id;

      if (provider !== 'email' && provider !== 'unknown') {
        await supabase.from('oauth_accounts').upsert({
          user_id: data.user.id,
          provider,
          provider_account_id: providerAccountId,
          provider_email: data.user.email,
        }, { onConflict: 'provider,provider_account_id' });
      }

      const forwardUrl = new URL(`${origin}/auth/callback`);
      forwardUrl.searchParams.set('provider', provider);
      forwardUrl.searchParams.set('provider_account_id', providerAccountId);
      forwardUrl.searchParams.set('next', next);
      return NextResponse.redirect(forwardUrl.toString());
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
