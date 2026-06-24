import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';
import { reportError, trackApiCall } from './monitoring';
import { getRequestId, setRequestId } from './request-id';

export interface ApiHandlerOptions {
  parseJson?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
}

export function apiError(status: number, message: string, details?: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
      requestId: getRequestId(),
    },
    { status },
  );
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId: getRequestId(),
    },
    { status },
  );
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        response: apiError(
          400,
          parsed.error.issues.map((e) => e.message).join(', '),
        ),
      };
    }
    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: apiError(400, 'Invalid JSON body'),
    };
  }
}

export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
) {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    const requestId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    setRequestId(requestId);
    const startTime = Date.now();
    const url = new URL(request.url);

    try {
      logger.info(`${request.method} ${url.pathname}`, {
        requestId,
        component: 'api',
      });

      const response = await handler(request, ...args);

      const duration = Date.now() - startTime;
      trackApiCall(url.pathname, duration, response.status);

      response.headers.set('X-Request-Id', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      await reportError(error, {
        requestId,
        method: request.method,
        path: url.pathname,
        durationMs: duration,
      });

      trackApiCall(url.pathname, duration, 500);

      return apiError(500, 'Internal server error');
    }
  };
}
