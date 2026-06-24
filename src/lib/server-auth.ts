import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuditLog } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const serverSupabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          'x-client-info': 'agripride-ai-server',
        },
      },
    })
  : null;

let adminSupabase: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  if (!isConfigured || !serviceRoleKey) return null;
  if (!adminSupabase) {
    adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          'x-client-info': 'agripride-ai-admin',
        },
      },
    });
  }
  return adminSupabase;
}

export function getUserFromRequest(request: Request): { id: string; email: string; role?: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(authHeader.split(' ')[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function writeAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  if (isConfigured && serverSupabase) {
    const admin = getAdminClient();
    if (admin) {
      const { error } = await admin.from('audit_logs').insert({
        ...log,
        id: crypto.randomUUID?.() ?? `audit-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Audit log insert failed:', error.message);
      }
      return;
    }

    const { error } = await serverSupabase.from('audit_logs').insert({
      ...log,
      id: crypto.randomUUID?.() ?? `audit-${Date.now()}`,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Audit log insert failed:', error.message);
    }
    return;
  }

  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem('agripride_demo_data');
    if (!stored) return;
    const store = JSON.parse(stored);
    const auditLogs = store.auditLogs || [];
    auditLogs.push({
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    });
    store.auditLogs = auditLogs;
    localStorage.setItem('agripride_demo_data', JSON.stringify(store));
  } catch {
    // silently fail audit logging in demo mode
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
  if (!isConfigured || !serverSupabase) return null;
  try {
    const admin = getAdminClient();
    if (admin) {
      const { data } = await admin.from('users').select('role').eq('id', userId).single();
      return data?.role ?? null;
    }
    const { data } = await serverSupabase.from('users').select('role').eq('id', userId).single();
    return data?.role ?? null;
  } catch {
    return null;
  }
}
