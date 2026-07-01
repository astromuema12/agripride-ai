import { NextRequest } from 'next/server';
import { z } from 'zod';
import { contactService } from '@/services/contact.service';
import { activityService } from '@/services/analytics.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeObject } from '@/middleware/security';
import { logger } from '@/lib/logger';

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required').max(5000),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, ContactSchema);
  if (!parsed.success) return parsed.response;

  const bodyStr = JSON.stringify(parsed.data);
  if (bodyStr.length > 10000) {
    return apiError(400, 'Message too large');
  }

  const sanitized = sanitizeObject(parsed.data);
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  const contact = await contactService.create({ ...sanitized, status: 'pending' });

  await activityService.logActivity({
    user_id: undefined,
    event_type: 'contact_submission',
    metadata: { subject: sanitized.subject, email: sanitized.email, contactId: contact.id },
    ip_address: ip,
    user_agent: req.headers.get('user-agent') || undefined,
  }).catch((err) => {
    logger.warn('Failed to log activity', { component: 'contact', error: err });
  });

  return apiSuccess({
    message: 'Thank you for contacting us. We will respond within 24 hours.',
  });
}

export const POST = withErrorHandling(handler);
