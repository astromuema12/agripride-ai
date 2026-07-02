import { BaseService } from './base.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { FarmerProfile } from '@/types';

export class OnboardingService extends BaseService<FarmerProfile> {
  protected storeName = 'farmerProfiles' as const;

  async getProfile(userId: string): Promise<FarmerProfile | null> {
    if (isSupabaseConfigured) {
      const { data } = await supabase!
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data as FarmerProfile | null;
    }
    const all = await this.getAll();
    return all.find((p) => p.user_id === userId) ?? null;
  }

  async saveProgress(
    userId: string,
    updates: Partial<FarmerProfile>,
  ): Promise<FarmerProfile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const updated = await this.update(existing.id, {
        ...updates,
        updated_at: new Date().toISOString(),
      } as Partial<FarmerProfile>);
      return updated!;
    }
    return this.create({
      user_id: userId,
      onboarding_completed: false,
      current_step: updates.current_step ?? 1,
      crop_types: updates.crop_types ?? [],
      goals: updates.goals ?? [],
      ai_personalized: false,
      ...updates,
    } as Omit<FarmerProfile, 'id' | 'created_at'>);
  }

  async completeOnboarding(userId: string): Promise<FarmerProfile | null> {
    const profile = await this.getProfile(userId);
    if (!profile) return null;
    return this.update(profile.id, {
      onboarding_completed: true,
      current_step: 4,
      updated_at: new Date().toISOString(),
    } as Partial<FarmerProfile>);
  }
}

export const onboardingService = new OnboardingService();
