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
import type { Testimonial } from '@/types';

export default function TestimonialsPage() {
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
      toast.error('Name and testimonial are required');
      return;
    }
    setSubmitting(true);
    try {
      await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user?.id }),
      });
      toast.success('Testimonial submitted for review!');
      setForm({ name: '', location: '', farm_type: '', content: '' });
    } catch {
      toast.error('Failed to submit');
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
            Testimonials
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900">What Farmers Say</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">
            Real experiences from our growing community of beta testers.
          </p>
        </motion.div>

        {/* Submit Form */}
        <Card className="mb-12">
          <CardContent className="p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Share Your Experience</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tname">Your Name *</Label>
                  <Input id="tname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Edwin Musau" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tlocation">Location</Label>
                  <Input id="tlocation" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nairobi, Kenya" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tfarm">Farm Type</Label>
                  <Input id="tfarm" value={form.farm_type} onChange={(e) => setForm({ ...form, farm_type: e.target.value })} placeholder="Maize Farmer" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcontent">Your Testimonial *</Label>
                <textarea
                  id="tcontent"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Tell us how AgriPride AI has helped you..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Testimonial'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Approved Testimonials */}
        {loading ? (
          <div className="text-center text-gray-400">Loading testimonials...</div>
        ) : approved.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
            <Quote className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">No testimonials yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= 5 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">&ldquo;{t.content}&rdquo;</p>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                      {(t.location || t.farm_type) && (
                        <div className="text-xs text-gray-500">{[t.location, t.farm_type].filter(Boolean).join(' · ')}</div>
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
