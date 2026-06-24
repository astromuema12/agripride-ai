import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const admin = getAdminClient();
    if (admin) {
      const { error } = await admin
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'active');

      if (error) {
        logger.error('Failed to cleanup expired subscriptions', {
          component: 'cron',
          error: error.message,
        });
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
      }

      logger.info('Expired subscriptions cleaned up', { component: 'cron' });
      return NextResponse.json({ success: true, message: 'Expired subscriptions cleaned up' });
    }

    return NextResponse.json({ error: 'No admin client' }, { status: 500 });
  } catch (err) {
    logger.error('Cron cleanup-expired error', {
      component: 'cron',
      error: err,
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
