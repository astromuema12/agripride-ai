import { Resend } from 'resend';
import { logger } from './logger';
import { serverT } from './i18n/server';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string,
  phone?: string,
  locale?: string,
): Promise<void> {
  const client = getClient();
  if (!client) {
    logger.warn('RESEND_API_KEY not configured — skipping contact notification email', { component: 'email' });
    return;
  }

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'musauedwin2004@gmail.com';
  const fromEmail = process.env.RESEND_FROM || 'noreply@agripride.ai';

  const loc = locale || 'en';
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#059670;">${serverT(loc, 'email.newContactInquiry')}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${serverT(loc, 'email.name')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${serverT(loc, 'email.email')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${serverT(loc, 'email.phone')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${phone}</td></tr>` : ''}
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${serverT(loc, 'email.subject')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${subject}</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;white-space:pre-wrap;">${message}</div>
      <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px;color:#9ca3af;">${serverT(loc, 'email.sentFrom')}</p>
    </div>
  `;

  const { error } = await client.emails.send({
    from: `AgriPride Contact <${fromEmail}>`,
    to: contactEmail,
    replyTo: email,
    subject: `[AgriPride] ${subject}`,
    html,
  });

  if (error) {
    logger.error('Resend send failed', { component: 'email', error });
    throw error;
  }
}
