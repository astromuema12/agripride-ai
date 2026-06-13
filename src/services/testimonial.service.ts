import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Testimonial } from '@/types';

export class TestimonialService extends BaseService<Testimonial> {
  protected storeName = 'testimonials' as const;

  async getApproved(): Promise<Testimonial[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('testimonials')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      return (data ?? []) as Testimonial[];
    }
    const all = await this.getAll();
    return all.filter((t) => t.is_approved);
  }

  async approve(id: string, approvedBy: string): Promise<Testimonial | null> {
    return this.update(id, {
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    } as Partial<Testimonial>);
  }

  async reject(id: string): Promise<void> {
    return this.delete(id);
  }

  async getPending(): Promise<Testimonial[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('testimonials')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      return (data ?? []) as Testimonial[];
    }
    const all = await this.getAll();
    return all.filter((t) => !t.is_approved);
  }
}

export const testimonialService = new TestimonialService();
