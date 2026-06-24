import { logger } from './logger';

const isBrowser = typeof window !== 'undefined';

interface MetricEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: string;
}

const pendingMetrics: MetricEvent[] = [];

export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  const event: MetricEvent = { name, value, tags, timestamp: new Date().toISOString() };

  if (!isBrowser) {
    pendingMetrics.push(event);
    if (pendingMetrics.length >= 20) {
      flushMetrics();
    }
  }

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Metric: ${name}=${value}`, { component: 'monitoring' });
  }
}

export function flushMetrics() {
  if (pendingMetrics.length === 0) return;
  const batch = pendingMetrics.splice(0, pendingMetrics.length);
  logger.info(`Flushing ${batch.length} metrics`, {
    component: 'monitoring',
    metadata: { metrics: batch },
  });
}

export function trackApiCall(endpoint: string, durationMs: number, statusCode: number, userId?: string) {
  trackMetric('api_call', 1, {
    endpoint,
    status: String(statusCode),
    user: userId ?? 'anonymous',
  });
  if (durationMs > 2000) {
    logger.warn(`Slow API call: ${endpoint} took ${durationMs}ms`, {
      component: 'api',
      durationMs,
      userId,
    });
  }
}

export function trackAiUsage(
  endpoint: string,
  durationMs: number,
  success: boolean,
  model?: string,
  userId?: string,
) {
  trackMetric('ai_usage', 1, {
    endpoint,
    success: String(success),
    model: model ?? 'unknown',
    user: userId ?? 'anonymous',
  });
  logger.info(`AI ${endpoint} ${success ? 'success' : 'failure'}`, {
    component: 'ai',
    durationMs,
    userId,
    metadata: { model, success },
  });
}

export async function reportError(error: unknown, context?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(errorMessage, {
    component: 'error',
    error: { message: errorMessage, stack: errorStack },
    metadata: context,
  });

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const body = {
        exception: {
          values: [{
            type: error instanceof Error ? error.constructor.name : 'Unknown',
            value: errorMessage,
            stacktrace: errorStack ? { frames: parseStackFrames(errorStack) } : undefined,
          }],
        },
        extra: context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      };
      const sentryKey = process.env.NEXT_PUBLIC_SENTRY_DSN;
      const projectId = sentryKey?.split('/').pop() ?? '';
      const sentryHost = sentryKey?.includes('@')
        ? sentryKey?.split('@')[1]?.split('/')[0]
        : 'o0.ingest.sentry.io';
      if (projectId && sentryHost) {
        await fetch(`https://${sentryHost}/api/${projectId}/store/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(() => {});
      }
    } catch {
      // silently fail sentry reporting
    }
  }
}

function parseStackFrames(stack: string): Array<{ filename?: string; lineno?: number; colno?: number; function?: string }> {
  return stack.split('\n').slice(1).map((line) => {
    const match = line.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))?\)?/);
    if (match) {
      return {
        function: match[1] || '<anonymous>',
        filename: match[2],
        lineno: match[3] ? parseInt(match[3]) : undefined,
        colno: match[4] ? parseInt(match[4]) : undefined,
      };
    }
    return {};
  });
}
