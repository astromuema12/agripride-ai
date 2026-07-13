import { NextRequest } from 'next/server';

export const FREE_TIER_LIMIT = 3;
export const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface UsageEntry {
  timestamp: number;
}

const usageStore = new Map<string, UsageEntry[]>();

export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'demo-user';
  return ip;
}

export function getUsage(identifier: string): UsageEntry[] {
  const now = Date.now();
  const entries = usageStore.get(identifier) || [];
  const valid = entries.filter((e) => now - e.timestamp < WEEK_IN_MS);
  usageStore.set(identifier, valid);
  return valid;
}

export function recordUsage(identifier: string): UsageEntry[] {
  const entries = getUsage(identifier);
  entries.push({ timestamp: Date.now() });
  usageStore.set(identifier, entries);
  return entries;
}

export function usageResponse(identifier: string, overrides?: Record<string, unknown>) {
  const entries = getUsage(identifier);
  const used = entries.length;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  const resetsAt = entries[0] ? new Date(entries[0].timestamp + WEEK_IN_MS).toISOString() : '';
  return { used, limit: FREE_TIER_LIMIT, remaining, resetsAt, ...overrides };
}
