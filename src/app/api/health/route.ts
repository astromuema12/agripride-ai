import { NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.NEXT_PUBLIC_APP_NAME || 'AgriPride AI',
    nodeEnv: process.env.NODE_ENV,
  };

  const checks: Record<string, string> = {};

  if (serverSupabase) {
    try {
      const { data: { session } } = await serverSupabase.auth.getSession();
      if (session?.user) {
        const { data: userData, error } = await serverSupabase
          .from('users')
          .select('id')
          .limit(1);
        checks.database = error ? 'error' : 'connected';
        if (error) {
          health.databaseError = error.message;
        }
      } else {
        checks.database = 'no_session';
      }
    } catch (err) {
      checks.database = 'error';
      health.databaseError = err instanceof Error ? err.message : 'unknown';
    }
  } else {
    checks.database = 'demo_mode';
  }

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  checks.ai = hasOpenAI ? 'configured' : 'demo_mode';

  const hasPaystack = !!(
    process.env.PAYSTACK_PUBLIC_KEY &&
    process.env.PAYSTACK_SECRET_KEY
  );
  checks.paystack = hasPaystack ? 'configured' : 'not_configured';

  health.checks = checks;
  health.responseTimeMs = Date.now() - startTime;

  const isHealthy = checks.database !== 'error';

  logger.info('Health check', {
    component: 'health',
    durationMs: Date.now() - startTime,
    metadata: { status: isHealthy ? 'healthy' : 'degraded' },
  });

  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
