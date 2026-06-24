'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'musauedwin2004@gmail.com', href: 'mailto:musauedwin2004@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+254 7 ...', href: 'tel:+2547...' },
  { icon: MapPin, label: 'Location', value: 'Nairobi, Kenya' },
  { icon: FaWhatsapp, label: 'WhatsApp', value: 'Chat on WhatsApp', href: 'https://whatsapp.com/dl/' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-earth-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12 text-center"
        >
          <Badge variant="primary" className="mb-3 sm:mb-4">Get In Touch</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-balance">Contact Us</h1>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-base sm:text-lg text-gray-500">
            Have a question about AgriPride AI? Want to partner with us? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 lg:col-span-1"
          >
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className="rounded-lg bg-emerald-50 p-2.5 sm:p-3 text-emerald-600 shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors truncate block">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-emerald-600 border-emerald-600">
              <CardContent className="p-4 sm:p-5 text-center">
                <FaWhatsapp className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 text-white" />
                <p className="font-semibold text-white text-sm sm:text-base">Quick Response on WhatsApp</p>
                <p className="mt-1 text-xs sm:text-sm text-emerald-100">Usually responds within 1 hour</p>
                <a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="mt-3 w-full bg-white text-emerald-700 hover:bg-emerald-50">
                    <FaWhatsapp className="mr-2 h-4 w-4" />
                    Chat on WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold text-gray-900">Follow Us</p>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-50 px-2.5 sm:px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">LinkedIn</a>
                  <a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-50 px-2.5 sm:px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">Facebook</a>
                  <a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-pink-50 px-2.5 sm:px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-100 transition-colors">Instagram</a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardContent className="p-5 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center py-8 sm:py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Message Sent!</h3>
                    <p className="mt-2 max-w-md text-sm sm:text-base text-gray-500">
                      Thank you for reaching out. Our team will get back to you within 24 hours.
                      In the meantime, feel free to chat with us on WhatsApp for quick questions.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" placeholder="John Farmer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="farmer@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="+254 7XX XXX XXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input id="subject" placeholder="How can we help?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <textarea
                        id="message"
                        rows={5}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Tell us more about your inquiry..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <p className="text-xs text-gray-400">
                        By submitting, you agree to our{' '}
                        <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
                      </p>
                      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
