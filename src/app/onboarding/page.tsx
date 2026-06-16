'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  { id: 1, label: 'Personal Info', icon: MapPin },
  { id: 2, label: 'Farm Details', icon: Sprout },
  { id: 3, label: 'Your Goals', icon: Target },
  { id: 4, label: 'AI Setup', icon: Leaf },
];

const cropOptions = ['Maize', 'Wheat', 'Rice', 'Coffee', 'Tea', 'Sugar Cane', 'Cassava', 'Beans', 'Potatoes', 'Tomatoes', 'Bananas', 'Other'];
const livestockOptions = ['Cattle', 'Goats', 'Sheep', 'Chickens', 'Pigs', 'None'];
const goalOptions = [
  'Increase crop yield',
  'Reduce disease loss',
  'Optimize irrigation',
  'Market access',
  'Weather forecasting',
  'Sustainable farming',
  'AI crop diagnosis',
  'Access to financing',
  'Soil health monitoring',
];

type FormData = {
  name: string;
  phone: string;
  county: string;
  farm_size_acres: string;
  crop_types: string[];
  has_livestock: boolean;
  livestock_details: string;
  goals: string[];
  consent_ai: boolean;
  current_step: number;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    county: '',
    farm_size_acres: '',
    crop_types: [],
    has_livestock: false,
    livestock_details: '',
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
            has_livestock: profile.has_livestock || false,
            livestock_details: profile.livestock_details || '',
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
    if (!user) { toast.error('Please sign in first'); return; }
    setSaving(true);
    try {
      await onboardingService.saveProgress(user.id, {
        current_step: next,
        name: form.name,
        phone: form.phone,
        county: form.county,
        farm_size_acres: form.farm_size_acres ? Number(form.farm_size_acres) : undefined,
        crop_types: form.crop_types,
        has_livestock: form.has_livestock,
        livestock_details: form.livestock_details,
        goals: form.goals,
      });
      setStep(next);
    } catch {
      toast.error('Failed to save progress');
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
      toast.success('Onboarding complete! Welcome to AgriPride AI.');
      setTimeout(() => router.push('/dashboard/farmer'), 1500);
    } catch {
      toast.error('Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">All Set!</h1>
          <p className="mt-2 text-gray-500">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Progress */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Set Up Your Farm Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Step {step} of 4 — {steps[step - 1].label}</p>
          <Progress value={progressPercent} className="mt-3 sm:mt-4 h-2" />
        </div>

        {/* Step indicators */}
        <div className="mb-6 sm:mb-8 hidden justify-between sm:flex">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  s.id === step
                    ? 'bg-emerald-600 text-white'
                    : s.id < step
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <span className={`text-xs ${s.id === step ? 'font-semibold text-emerald-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="Edwin Musau" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County / Region</Label>
                    <Input id="county" value={form.county} onChange={(e) => updateForm({ county: e.target.value })} placeholder="Nairobi, Kenya" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">Farm Details</h2>
                  <div className="space-y-2">
                    <Label htmlFor="farm_size">Farm Size (Acres)</Label>
                    <Input id="farm_size" type="number" value={form.farm_size_acres} onChange={(e) => updateForm({ farm_size_acres: e.target.value })} placeholder="2.5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Crops You Grow</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {cropOptions.map((crop) => (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => updateForm({ crop_types: toggleArray(form.crop_types, crop) })}
                          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                            form.crop_types.includes(crop)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Do you have livestock?</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {livestockOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const has = item !== 'None';
                            updateForm({ has_livestock: has, livestock_details: has ? item : '' });
                          }}
                          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                            (item === 'None' && !form.has_livestock) || form.livestock_details === item
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">Your Farming Goals</h2>
                  <p className="text-sm text-gray-500">Select all that apply</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => updateForm({ goals: toggleArray(form.goals, goal) })}
                        className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                          form.goals.includes(goal)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-lg font-bold text-gray-900">AI Personalization</h2>
                  <p className="text-sm text-gray-500">
                    Help us tailor AI recommendations to your farm. Your data stays private and secure.
                  </p>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-emerald-800">Summary</h3>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-700">
                      <li>📍 {form.county || 'County not set'}</li>
                      <li>🌱 {form.crop_types.length || 0} crop types selected</li>
                      <li>🐄 {form.has_livestock ? form.livestock_details : 'No livestock'}</li>
                      <li>🎯 {form.goals.length || 0} goals selected</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 sm:p-4 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.consent_ai}
                      onChange={(e) => updateForm({ consent_ai: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">I consent to AI processing of my farm data</span>
                      <p className="text-xs text-gray-500 mt-1">
                        AgriPride AI will use your farm profile to provide personalized disease detection,
                        weather alerts, and recommendations. You can revoke consent anytime in settings.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between border-t border-gray-100 pt-5 sm:pt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveAndGo(step - 1)}
              disabled={step === 1 || saving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Badge variant="primary" className="text-xs">
              Step {step}/4
            </Badge>
            {step < 4 ? (
              <Button size="sm" onClick={() => saveAndGo(step + 1)} disabled={saving}>
                {saving ? 'Saving...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete} disabled={saving || !form.consent_ai}>
                {saving ? 'Saving...' : 'Complete Setup'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
