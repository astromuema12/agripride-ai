'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testimonialService } from '@/services/testimonial.service';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import type { Testimonial } from '@/types';

export default function TestimonialsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', farm_type: '', content: '' });

  useEffect(() => {
    testimonialService.getApproved().then((data) => {
      setApproved(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() || !form.name.trim()) {
      toast.error(t('testimonials.toastRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user?.id }),
      });
      toast.success(t('testimonials.toastSubmitted'));
      setForm({ name: '', location: '', farm_type: '', content: '' });
    } catch {
      toast.error(t('testimonials.toastFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Quote className="mr-1 h-3 w-3" />
            {t('testimonials.title')}
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900">{t('testimonials.pageTitle')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">
            {t('testimonials.pageSubtitle')}
          </p>
        </motion.div>

        {/* Submit Form */}
        <Card className="mb-12">
          <CardContent className="p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{t('testimonials.submitTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tname">{t('testimonials.name')} *</Label>
                  <Input id="tname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Edwin Musau" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tlocation">{t('common.location')}</Label>
                  <Input id="tlocation" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nairobi, Kenya" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tfarm">{t('testimonials.farmType')}</Label>
                  <Input id="tfarm" value={form.farm_type} onChange={(e) => setForm({ ...form, farm_type: e.target.value })} placeholder="Maize Farmer" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcontent">{t('testimonials.message')} *</Label>
                <textarea
                  id="tcontent"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#445c8c] focus:border-transparent"
                  placeholder={t('testimonials.submitSubtitle')}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? t('testimonials.submitting') : t('testimonials.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Approved Testimonials */}
        {loading ? (
          <div className="text-center text-gray-400">{t('testimonials.loading')}</div>
        ) : approved.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
            <Quote className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">{t('testimonials.noTestimonials')}. {t('testimonials.noTestimonialsDesc')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((tItem) => (
              <motion.div key={tItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= 5 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">&ldquo;{tItem.content}&rdquo;</p>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tItem.name}</div>
                      {(tItem.location || tItem.farm_type) && (
                        <div className="text-xs text-gray-500">{[tItem.location, tItem.farm_type].filter(Boolean).join(' · ')}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
