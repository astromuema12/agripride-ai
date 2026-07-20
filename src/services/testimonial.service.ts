import { BaseService } from "./base.service";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Testimonial } from "@/types";

export class TestimonialService extends BaseService<Testimonial> {
  protected storeName = "testimonials" as const;

  async getApproved(limit = 100, offset = 0): Promise<{ data: Testimonial[]; total: number }> {
    if (isSupabaseConfigured) {
      try {
        const [{ data, error }, { count: total, error: countError }] = await Promise.all([
          supabase!
            .from("testimonials")
            .select("*", { count: "exact" })
            .eq("is_approved", true)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1),
          supabase!.from("testimonials").select("*", { count: "exact", head: true }).eq("is_approved", true),
        ]);
        if (!error && !countError) {
          return { data: (data ?? []) as Testimonial[], total: total ?? 0 };
        }
      } catch {}
    }
    const all = await this.getAll();
    const approved = all.filter((t) => t.is_approved);
    return { data: approved.slice(offset, offset + limit), total: approved.length };
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

  async getPending(limit = 100, offset = 0): Promise<{ data: Testimonial[]; total: number }> {
    if (isSupabaseConfigured) {
      try {
        const [{ data, error }, { count: total, error: countError }] = await Promise.all([
          supabase!
            .from("testimonials")
            .select("*", { count: "exact" })
            .eq("is_approved", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1),
          supabase!.from("testimonials").select("*", { count: "exact", head: true }).eq("is_approved", false),
        ]);
        if (!error && !countError) {
          return { data: (data ?? []) as Testimonial[], total: total ?? 0 };
        }
      } catch {}
    }
    const all = await this.getAll();
    const pending = all.filter((t) => !t.is_approved);
    return { data: pending.slice(offset, offset + limit), total: pending.length };
  }
}

export const testimonialService = new TestimonialService();
