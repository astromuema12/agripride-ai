import { supabase, isSupabaseConfigured } from './supabase';
import type { UserSession } from '@/types';

export async function getCurrentSessionId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    let sessionId = sessionStorage.getItem('agripride_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID?.() ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('agripride_session_id', sessionId);
    }
    return sessionId;
  } catch {
    return null;
  }
}

export function detectDeviceInfo() {
  if (typeof window === 'undefined') {
    return { deviceName: 'Server', browser: 'unknown', os: 'unknown', deviceType: 'server' };
  }

  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';

  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) deviceType = 'tablet';
  else if (/Mobile|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) deviceType = 'mobile';

  const deviceName = `${os} ${browser}`;

  return { deviceName, browser, os, deviceType };
}

export async function recordSession(userId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Database not configured' };

  const sessionToken = await getCurrentSessionId();
  if (!sessionToken) return { error: 'Could not generate session token' };

  const { deviceName, browser, os, deviceType } = detectDeviceInfo();

  await supabase
    .from('user_sessions')
    .update({ is_current: false })
    .eq('user_id', userId)
    .eq('is_current', true);

  const ipAddress = null;

  const { error } = await supabase.from('user_sessions').insert({
    user_id: userId,
    session_token: sessionToken,
    device_name: deviceName,
    device_type: deviceType,
    browser,
    os,
    ip_address: ipAddress,
    is_current: true,
  });

  if (error) return { error: error.message };
  return {};
}

export async function getUserSessions(userId: string): Promise<{ data: UserSession[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: 'Database not configured' };

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as UserSession[] };
}

export async function revokeSession(sessionId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Database not configured' };

  const { error } = await supabase.from('user_sessions').delete().eq('id', sessionId);
  if (error) return { error: error.message };
  return {};
}

export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Database not configured' };

  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('session_token', currentSessionId);

  if (error) return { error: error.message };
  return {};
}
