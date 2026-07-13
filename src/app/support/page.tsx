'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, BookOpen, HelpCircle, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-[var(--foreground)] font-body">{question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-[var(--muted-foreground)]">{answer}</p>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { t } = useI18n();
  const faqs = [
    {
      q: 'What is AgriPride AI?',
      a: 'AgriPride AI is an agricultural intelligence platform that uses artificial intelligence to help farmers detect crop diseases early, get weather forecasts, access market prices, and receive personalized farming recommendations.',
    },
    {
      q: 'Is AgriPride AI currently available?',
      a: 'Yes, AgriPride AI is live and available to farmers in Kenya. Sign up for a free account to get started with AI disease detection, weather forecasts, and market intelligence.',
    },
    {
      q: 'How much does it cost?',
      a: 'We offer a Free tier with basic features. Premium plans start at KES 299/month. Cooperative and Enterprise plans are also available. See our Pricing page for details.',
    },
    {
      q: 'How does the AI disease diagnosis work?',
      a: 'Upload a photo of your crop, describe the symptoms, and our AI analyzes the image and text to provide a diagnosis, confidence score, treatment recommendations, and prevention strategies.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. We use encryption, row-level security in our database, and follow strict data protection practices. We never share your personal data without your explicit consent.',
    },
    {
      q: 'How do I get started?',
      a: 'Create a free account on our platform and complete the onboarding process. You will get immediate access to all features and support.',
    },
    {
      q: 'Do you offer support in local languages?',
      a: 'Currently our platform supports English, with Swahili support coming soon. Our support team can assist in English and Swahili.',
    },
    {
      q: 'How do I contact support?',
      a: 'You can reach us via the Contact page, email us at musauedwin2004@gmail.com, or chat with us on WhatsApp for quick responses.',
    },
  ];
  const [loading, setLoading] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) {
      toast.error(t('support.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Support User',
          email: 'user@agripride.ai',
          subject: `[SUPPORT] ${ticketForm.subject}`,
          message: ticketForm.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      toast.success(t('support.ticketCreated'));
      setTicketForm({ subject: '', message: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-12 text-center">
          <Badge variant="primary" className="mb-3 sm:mb-4">{t('support.title')}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance font-body">{t('support.title')}</h1>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)] font-body">
            {t('support.subtitle')}
          </p>
        </motion.div>

        <div className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          <a href="mailto:musauedwin2004@gmail.com">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              {t('support.contact.email')}
            </Button>
          </a>
          <a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {t('support.contact.whatsapp')}
            </Button>
          </a>
        </div>

        <Tabs defaultValue="faq" className="mx-auto max-w-4xl">
          <TabsList className="w-full">
            <TabsTrigger value="faq" className="flex-1 gap-2">
              <BookOpen className="h-4 w-4" />
              {t('support.faq')}
            </TabsTrigger>
            <TabsTrigger value="ticket" className="flex-1 gap-2">
              <HelpCircle className="h-4 w-4" />
              {t('support.submitTicket')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardContent className="p-6">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticket">
            <Card>
              <CardHeader>
                <CardTitle className="font-body">{t('support.submitTicket')}</CardTitle>
                <p className="text-sm text-[var(--muted-foreground)]">{t('support.contact.emailDesc')}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">{t('support.subject')}</Label>
                    <Input
                      id="ticket-subject"
                      placeholder={t('support.subjectPlaceholder')}
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-message">{t('common.description')}</Label>
                    <textarea
                      id="ticket-message"
                      rows={6}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] dark:focus:ring-[#5e9a6b]"
                      placeholder={t('support.descriptionPlaceholder')}
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {t('support.submitTicket')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
