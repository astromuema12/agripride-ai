import { NextRequest } from 'next/server';
import { z } from 'zod';
import { contactService } from '@/services/contact.service';
import { activityService } from '@/services/analytics.service';

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required').max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 10000) {
      return Response.json({ success: false, error: 'Message too large' }, { status: 400 });
    }

    await contactService.create({ ...parsed.data, status: 'pending' });

    await activityService.logActivity({
      user_id: undefined,
      event_type: 'contact_submission',
      metadata: { subject: parsed.data.subject, email: parsed.data.email },
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return Response.json({
      success: true,
      message: 'Thank you for contacting us. We will respond within 24 hours.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return Response.json({
      success: false,
      error: 'Failed to submit form. Please try again.',
    }, { status: 500 });
  }
}
