'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ContactPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error(t('support.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('contact.failedToSend'));
      setSubmitted(true);
      toast.success(t('contact.successMessage'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('contact.failedToSendMessage'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20 sm:px-8 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          {/* Left — Info */}
          <RevealSection className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#c4704b]" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">{t('contact.badge')}</span>
            </div>
            <h1 className="display-lg text-[var(--foreground)] mb-4">{t('contact.title')}</h1>
            <p className="text-base text-[var(--muted-foreground)] font-body leading-relaxed mb-10">
              {t('contact.subtitle')}
            </p>

            <div className="space-y-6">
              <a href="mailto:musauedwin2004@gmail.com" className="group flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f5f1] dark:bg-[#1a2e20] text-[#2d6a4f] dark:text-[#5e9a6b] transition-colors group-hover:bg-[#2d6a4f] group-hover:text-white dark:group-hover:bg-[#5e9a6b]">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] font-body mb-0.5">{t('contact.emailUs')}</div>
                  <div className="text-sm font-semibold text-[var(--foreground)] font-body group-hover:text-[#2d6a4f] dark:group-hover:text-[#5e9a6b] transition-colors">musauedwin2004@gmail.com</div>
                </div>
              </a>

              <a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f5f1] dark:bg-[#1a2e20] text-[#2d6a4f] dark:text-[#5e9a6b] transition-colors group-hover:bg-[#2d6a4f] group-hover:text-white dark:group-hover:bg-[#5e9a6b]">
                  <FaWhatsapp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] font-body mb-0.5">{t('contact.whatsapp')}</div>
                  <div className="text-sm font-semibold text-[var(--foreground)] font-body group-hover:text-[#2d6a4f] dark:group-hover:text-[#5e9a6b] transition-colors">{t('contact.chatOnWhatsApp')}</div>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f5f1] dark:bg-[#1a2e20] text-[#2d6a4f] dark:text-[#5e9a6b]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] font-body mb-0.5">{t('contact.location')}</div>
                  <div className="text-sm font-semibold text-[var(--foreground)] font-body">{t('contact.locationDesc')}</div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="mt-10 pt-8 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--muted-foreground)] font-body mb-3">{t('footer.followUs')}</div>
              <div className="flex gap-2">
                {[
                  { key: 'linkedin', label: t('contact.socialPlatforms.linkedin') },
                  { key: 'facebook', label: t('contact.socialPlatforms.facebook') },
                  { key: 'instagram', label: t('contact.socialPlatforms.instagram') },
                ].map(s => (
                  <span key={s.key} className="rounded-md bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] font-body">{s.label}</span>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* Right — Form */}
          <RevealSection className="lg:col-span-8" delay={0.1}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f5f1] dark:bg-[#1a2e20]">
                  <CheckCircle className="h-7 w-7 text-[#2d6a4f] dark:text-[#5e9a6b]" />
                </div>
                <h3 className="font-display text-xl text-[var(--foreground)]">{t('contact.successMessage')}</h3>
                <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)] font-body">{t('contact.successDesc')}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>{t('contact.sendAnother')}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 lg:p-10 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-[var(--foreground)] font-body">{t('contact.name')} *</Label>
                    <Input id="name" placeholder={t('contact.namePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="font-body" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-[var(--foreground)] font-body">{t('contact.email')} *</Label>
                    <Input id="email" type="email" placeholder={t('contact.emailPlaceholder')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="font-body" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium text-[var(--foreground)] font-body">{t('contact.phoneNumber')}</Label>
                    <Input id="phone" type="tel" placeholder={t('contact.phonePlaceholder')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="font-body" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-sm font-medium text-[var(--foreground)] font-body">{t('contact.subject')} *</Label>
                    <Input id="subject" placeholder={t('contact.subjectPlaceholder')} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="font-body" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-[var(--foreground)] font-body">{t('contact.message')} *</Label>
                  <textarea
                    id="message" rows={5}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-body placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                    placeholder={t('contact.messagePlaceholder')}
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-[var(--muted-foreground)]/60 font-body">{t('contact.privacyNotice')}</p>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {t('contact.send')}
                  </Button>
                </div>
              </form>
            )}
          </RevealSection>
        </div>
      </div>
    </div>
  );
}
