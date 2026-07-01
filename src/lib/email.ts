import nodemailer from 'nodemailer';
import { logger } from './logger';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string,
  phone?: string,
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('SMTP not configured — skipping contact notification email', { component: 'email' });
    return;
  }

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'musauedwin2004@gmail.com';

  await transporter.sendMail({
    from: `"AgriPride Contact" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: contactEmail,
    replyTo: email,
    subject: `[AgriPride] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\n\nMessage:\n${message}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#059669;">New Contact Inquiry</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Phone</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${phone}</td></tr>` : ''}
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Subject</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${subject}</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;white-space:pre-wrap;">${message}</div>
      <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px;color:#9ca3af;">Sent from AgriPride AI contact form</p>
    </div>`,
  });
}
