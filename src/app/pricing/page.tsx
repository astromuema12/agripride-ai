'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Loader2, Leaf, Sparkles, Building2, Globe, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface Plan {
  tier: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  notIncluded: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  color: string;
}



function PricingPageContent() {
  const { t, translations } = useI18n();

  const plans: Plan[] = [
    {
      tier: 'free',
      name: t('pricing.free'),
      price: 0,
      period: t('pricing.perMonth'),
      description: t('pricing.freePlan.description'),
      icon: Leaf,
      color: 'from-[#445c8c] to-[#364a70]',
      features: [
        translations.pricing.freePlan.features[0],
        translations.pricing.freePlan.features[1],
        translations.pricing.freePlan.features[2],
        translations.pricing.freePlan.features[3],
      ],
      notIncluded: [
        'Advanced AI Diagnosis',
        'Farm Analytics Dashboard',
        'Loan Recommendations',
        'Priority Support',
      ],
    },
    {
      tier: 'premium',
      name: t('pricing.premium'),
      price: 299,
      period: t('pricing.perMonth'),
      description: t('pricing.premiumPlan.description'),
      icon: Sparkles,
      popular: true,
      color: 'from-[#445c8c] to-[#364a70]',
      features: [
        translations.pricing.premiumPlan.features[0],
        translations.pricing.premiumPlan.features[1],
        translations.pricing.premiumPlan.features[2],
        translations.pricing.premiumPlan.features[3],
        translations.pricing.premiumPlan.features[4],
      ],
      notIncluded: [
        'Multi-farm Dashboard',
        'Group Analytics',
      ],
    },
    {
      tier: 'cooperative',
      name: t('pricing.cooperative'),
      price: 999,
      period: t('pricing.perMonth'),
      description: t('pricing.cooperativePlan.description'),
      icon: Building2,
      color: 'from-blue-500 to-blue-700',
      features: [
        translations.pricing.cooperativePlan.features[0],
        translations.pricing.cooperativePlan.features[1],
        translations.pricing.cooperativePlan.features[2],
        translations.pricing.cooperativePlan.features[3],
        translations.pricing.cooperativePlan.features[4],
        translations.pricing.cooperativePlan.features[5],
      ],
      notIncluded: [
        'White-label Options',
        'API Access',
      ],
    },
    {
      tier: 'enterprise',
      name: t('pricing.enterprise'),
      price: 4999,
      period: t('pricing.perMonth'),
      description: t('pricing.enterprisePlan.description'),
      icon: Globe,
      color: 'from-purple-500 to-purple-700',
      features: [
        translations.pricing.enterprisePlan.features[0],
        translations.pricing.enterprisePlan.features[1],
        translations.pricing.enterprisePlan.features[2],
        translations.pricing.enterprisePlan.features[3],
        translations.pricing.enterprisePlan.features[4],
        translations.pricing.enterprisePlan.features[5],
        translations.pricing.enterprisePlan.features[6],
      ],
      notIncluded: [],
    },
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const payment = searchParams.get('payment');
  const statusMap: Record<string, { variant: 'success' | 'error' | 'warning' | 'default'; message: string }> = {
    success: { variant: 'success', message: t('pricing.paymentSuccess') },
    failed: { variant: 'error', message: t('pricing.paymentFailed') },
    cancelled: { variant: 'warning', message: t('pricing.paymentCancelled') },
    pending: { variant: 'warning', message: t('pricing.paymentPending') },
    already_active: { variant: 'success', message: t('pricing.alreadyActive') },
  };

  const statusMessage = payment ? statusMap[payment] : null;

  const handleSubscribe = async (tier: string) => {
    setLoading(tier);
    try {
      const plan = plans.find((p) => p.tier === tier);
      const storedUser = localStorage.getItem('agripride_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (plan?.price === 0) {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, userId: user?.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('pricing.subscriptionActivated'));
        toast.success(data.data?.message || t('pricing.subscriptionActivated'));
        router.push('/auth');
        return;
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user?.id,
          email: user?.email || 'farmer@agripride.ai',
          name: user?.name || 'Farmer',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('errors.paymentFailed'));

      const authorization_url = data.data?.authorization_url || data.authorization_url;
      if (authorization_url) {
        window.location.assign(authorization_url);
      } else {
        throw new Error(t('errors.paymentFailed'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.paymentFailed'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        {statusMessage && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
            statusMessage.variant === 'success' ? 'bg-[#eef8ef] text-[#445c8c] border border-[#ccccbe]' :
            statusMessage.variant === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            statusMessage.variant === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-gray-50 text-gray-700 border border-[#ccccbe]'
          }`}>
            {statusMessage.message}
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12 text-center"
        >
          <Badge variant="primary" className="mb-3 sm:mb-4">{t('nav.pricing')}</Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-balance">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-base sm:text-lg text-gray-500">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge variant="primary" className="px-4 py-1 text-xs font-semibold shadow-lg">
                      {t('pricing.mostPopular')}
                    </Badge>
                  </div>
                )}
                <Card className={`h-full border-2 ${plan.popular ? 'border-[#a4dca7] shadow-xl' : 'border-[#ccccbe] shadow-sm'} transition-all duration-200 hover:shadow-lg`}>
                  <CardHeader className={`rounded-t-lg bg-gradient-to-r ${plan.color} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-white/20 p-2">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm text-white/80">{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? t('pricing.free') : `KES ${plan.price.toLocaleString()}`}
                      </span>
                      {plan.price > 0 && <span className="text-sm text-white/70">{t('pricing.perMonth')}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a4dca7]" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
                          <X className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => {
                          if (plan.price === 0) {
                            router.push('/auth?tab=register');
                          } else {
                            handleSubscribe(plan.tier);
                          }
                        }}
                        disabled={loading === plan.tier}
                      >
                        {loading === plan.tier ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : plan.price === 0 ? (
                          t('landing.hero.cta')
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('pricing.payWithPaystack')}
                          </>
                        )}
                      </Button>
                    </div>

                    {plan.price > 0 && (
                      <p className="mt-2 text-center text-xs text-gray-400">
                        {t('pricing.securePayment')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>


    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#445c8c]" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
