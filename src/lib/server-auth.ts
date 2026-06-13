import { createClient } from '@supabase/supabase-js'
import type { AuditLog } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isConfigured = !!(supabaseUrl && supabaseAnonKey)

export const serverSupabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null

export function getUserFromRequest(request: Request): { id: string; email: string; role?: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const payload = JSON.parse(atob(authHeader.split(' ')[1]))
    return payload
  } catch {
    return null
  }
}

export async function writeAuditLog(
  log: Omit<AuditLog, 'id' | 'created_at'>
): Promise<void> {
  if (isConfigured && serverSupabase) {
    await serverSupabase.from('audit_logs').insert({
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })
    return
  }

  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem('agripride_demo_data')
    if (!stored) return
    const store = JSON.parse(stored)
    const auditLogs = store.auditLogs || []
    auditLogs.push({
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    })
    store.auditLogs = auditLogs
    localStorage.setItem('agripride_demo_data', JSON.stringify(store))
  } catch {
    // silently fail audit logging in demo mode
  }
}
