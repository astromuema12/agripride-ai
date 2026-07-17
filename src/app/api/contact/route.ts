import { NextRequest } from 'next/server';
import { z } from 'zod';
import { contactService } from '@/services/contact.service';
import { activityService } from '@/services/analytics.service';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeObject } from '@/middleware/security';
import { sendContactNotification } from '@/lib/email';
import { logger } from '@/lib/logger';
import { serverT } from '@/lib/i18n/server';

const ContactSchema = z.object({
  name: z.string().min(1, serverT('en', 'validation.nameRequired')).max(255),
  email: z.string().email(serverT('en', 'validation.invalidEmail')),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1, serverT('en', 'validation.subjectRequired')).max(255),
  message: z.string().min(1, serverT('en', 'validation.messageRequired')).max(5000),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, ContactSchema);
  if (!parsed.success) return parsed.response;

  const bodyStr = JSON.stringify(parsed.data);
  if (bodyStr.length > 10000) {
    return apiError(400, serverT('en', 'contact.messageTooLarge'));
  }

  const sanitized = sanitizeObject(parsed.data);
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  const contact = await contactService.create({ ...sanitized, status: 'pending' });

  sendContactNotification(
    sanitized.name,
    sanitized.email || '',
    sanitized.subject,
    sanitized.message,
    sanitized.phone,
  ).catch((err) => {
    logger.warn('Failed to send contact notification email', { component: 'contact', error: err });
  });

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
    message: serverT('en', 'contact.successMessage'),
  });
}

export const POST = withErrorHandling(handler);
