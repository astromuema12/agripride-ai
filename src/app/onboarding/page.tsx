'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Leaf, MapPin, Sprout, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import { toast } from 'sonner';

const steps = [
  { id: 1, icon: MapPin },
  { id: 2, icon: Sprout },
  { id: 3, icon: Target },
  { id: 4, icon: Leaf },
];

const cropOptions = ['Maize', 'Wheat', 'Rice', 'Coffee', 'Tea', 'Sugar Cane', 'Cassava', 'Beans', 'Potatoes', 'Tomatoes', 'Bananas', 'Other'];
const cropToKey = (crop: string) => crop.toLowerCase().replace(/\s+/g, '_');


const GOAL_KEYS = [
  'increaseCropYield',
  'reduceDiseaseLoss',
  'optimizeIrrigation',
  'marketAccess',
  'weatherForecasting',
  'sustainableFarming',
  'aiCropDiagnosis',
  'accessToFinancing',
  'soilHealthMonitoring',
];

type FormData = {
  name: string;
  phone: string;
  county: string;
  farm_size_acres: string;
  crop_types: string[];
  goals: string[];
  consent_ai: boolean;
  current_step: number;
};

export default function OnboardingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    county: '',
    farm_size_acres: '',
    crop_types: [],
    goals: [],
    consent_ai: false,
    current_step: 1,
  });
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      onboardingService.getProfile(user.id).then((profile) => {
        if (profile) {
          setStep(profile.current_step || 1);
          setForm((prev) => ({
            ...prev,
            name: profile.name || user.name,
            phone: profile.phone || '',
            county: profile.county || '',
            farm_size_acres: profile.farm_size_acres?.toString() || '',
            crop_types: profile.crop_types || [],


            goals: profile.goals || [],
            current_step: profile.current_step || 1,
          }));
        }
      });
    }
  }, [user]);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const saveAndGo = async (next: number) => {
    if (!user) {       toast.error(t('onboarding.signInFirst')); return; }
    setSaving(true);
    try {
      await onboardingService.saveProgress(user.id, {
        current_step: next,
        name: form.name,
        phone: form.phone,
        county: form.county,
        farm_size_acres: form.farm_size_acres ? Number(form.farm_size_acres) : undefined,
        crop_types: form.crop_types,


        goals: form.goals,
      });
      setStep(next);
    } catch {
      toast.error(t('onboarding.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onboardingService.saveProgress(user.id, {
        current_step: 4,
        consent_ai: form.consent_ai,
      });
      await onboardingService.completeOnboarding(user.id);
      setCompleted(true);
      toast.success(t('onboarding.complete'));
      setTimeout(() => router.push('/dashboard/farmer'), 1500);
    } catch {
      toast.error(t('onboarding.failedToComplete'));
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#e2f0ee] to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f0ee]">
            <Check className="h-8 w-8 text-[#14b8a6]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.allSet')}</h1>
          <p className="mt-2 text-gray-500">{t('onboarding.takingYouToDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f8] to-white py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Progress */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('onboarding.setUpFarmProfile')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('onboarding.stepOf', { current: step, total: 4 })} — {t(`onboarding.step${step}`)}</p>
          <Progress value={progressPercent} className="mt-3 sm:mt-4 h-2" />
        </div>

        {/* Step indicators */}
        <div className="mb-6 sm:mb-8 hidden justify-between sm:flex">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  s.id === step
                    ? 'bg-[#0f766e] text-white'
                    : s.id < step
                      ? 'bg-[#e2f0ee] text-[#0f766e]'
                      : 'bg-[#f0f4f8] text-gray-400'
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <span className={`text-xs ${s.id === step ? 'font-semibold text-[#0f766e]' : 'text-gray-400'}`}>
                {t(`onboarding.step${s.id}`)}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-[#d1d5db] bg-white p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('onboarding.personalInfo')}</h2>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('onboarding.fullName')}</Label>
                    <Input id="name" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder={t('onboarding.namePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('onboarding.phoneNumber')}</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} placeholder={t('onboarding.phonePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">{t('onboarding.countyRegion')}</Label>
                    <Input id="county" value={form.county} onChange={(e) => updateForm({ county: e.target.value })} placeholder={t('onboarding.countyPlaceholder')} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('onboarding.farmDetails')}</h2>
                  <div className="space-y-2">
                    <Label htmlFor="farm_size">{t('onboarding.farmSizeAcres')}</Label>
                    <Input id="farm_size" type="number" value={form.farm_size_acres} onChange={(e) => updateForm({ farm_size_acres: e.target.value })} placeholder={t('onboarding.farmSizePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('onboarding.cropsYouGrow')}</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {cropOptions.map((crop) => (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => updateForm({ crop_types: toggleArray(form.crop_types, crop) })}
                          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                            form.crop_types.includes(crop)
                              ? 'bg-[#0f766e] text-white'
                              : 'bg-gray-50 text-gray-600 hover:bg-[#e2f0ee]'
                          }`}
                        >
                          {t(`onboarding.crops.${cropToKey(crop)}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('onboarding.yourGoals')}</h2>
                  <p className="text-sm text-gray-500">{t('onboarding.selectAllThatApply')}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {GOAL_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateForm({ goals: toggleArray(form.goals, t(`onboarding.goal.${key}`)) })}
                        className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                          form.goals.includes(t(`onboarding.goal.${key}`))
                            ? 'bg-[#0f766e] text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-[#e2f0ee]'
                        }`}
                      >
                        {t(`onboarding.goal.${key}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">{t('onboarding.aiPersonalization')}</h2>
                  <p className="text-sm text-gray-500">
                    {t('onboarding.aiPersonalizationDesc')}
                  </p>
                  <div className="rounded-lg border border-[#14b8a6] bg-[#e2f0ee] p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-[#0f766e]">{t('onboarding.summary')}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-[#59a85e]">
                      <li>📍 {form.county || t('onboarding.countyNotSet')}</li>
                      <li>🌱 {t('onboarding.cropTypesSelected', { count: form.crop_types.length || 0 })}</li>
                      <li>🎯 {t('onboarding.goalsSelected', { count: form.goals.length || 0 })}</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border border-[#d1d5db] p-3 sm:p-4 cursor-pointer hover:bg-[#f9fafb]">
                    <input
                      type="checkbox"
                      checked={form.consent_ai}
                      onChange={(e) => updateForm({ consent_ai: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0f766e] focus:ring-[#0f766e] shrink-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t('onboarding.consentLabel')}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('onboarding.consentDesc')}
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between border-t border-[#d1d5db] pt-5 sm:pt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveAndGo(step - 1)}
              disabled={step === 1 || saving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <Badge variant="primary" className="text-xs">
              {t('onboarding.stepIndicator', { current: step, total: 4 })}
            </Badge>
            {step < 4 ? (
              <Button size="sm" onClick={() => saveAndGo(step + 1)} disabled={saving}>
                {saving ? t('common.saving') : t('onboarding.continue')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete} disabled={saving || !form.consent_ai}>
                {saving ? t('common.saving') : t('onboarding.completeSetup')}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
