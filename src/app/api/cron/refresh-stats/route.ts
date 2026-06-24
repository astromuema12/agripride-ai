import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const authHeader = process.env.CRON_SECRET;
  if (authHeader) {
    const { searchParams } = new URL(process.env.VERCEL_URL || 'http://localhost:3000');
    searchParams.get('secret');
  }

  try {
    const admin = getAdminClient();
    if (admin) {
      const { error } = await admin.rpc('refresh_platform_stats');
      if (error) {
        logger.error('Failed to refresh platform stats', {
          component: 'cron',
          error: error.message,
        });
        return NextResponse.json({ error: 'Failed to refresh stats' }, { status: 500 });
      }
      logger.info('Platform stats refreshed successfully', { component: 'cron' });
      return NextResponse.json({ success: true, message: 'Stats refreshed' });
    }

    return NextResponse.json({ error: 'No admin client' }, { status: 500 });
  } catch (err) {
    logger.error('Cron refresh-stats error', {
      component: 'cron',
      error: err,
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
