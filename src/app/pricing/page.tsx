'use client';

import { useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Check, X, ArrowRight, Loader2, Leaf, Sparkles, Building2, Globe, CreditCard, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
}

function PricingPageContent() {
  const { t, translations } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      tier: 'free',
      name: t('pricing.free'),
      price: 0,
      period: t('pricing.perMonth'),
      description: t('pricing.freePlan.description'),
      icon: Leaf,
      features: [
        translations.pricing.freePlan.features[0],
        translations.pricing.freePlan.features[1],
        translations.pricing.freePlan.features[2],
        translations.pricing.freePlan.features[3],
      ],
      notIncluded: [t('pricing.notIncluded.advancedAiDiagnosis'), t('pricing.notIncluded.farmAnalyticsDashboard'), t('pricing.notIncluded.loanRecommendations'), t('pricing.notIncluded.prioritySupport')],
    },
    {
      tier: 'premium',
      name: t('pricing.premium'),
      price: 299,
      period: t('pricing.perMonth'),
      description: t('pricing.premiumPlan.description'),
      icon: Sparkles,
      popular: true,
      features: [
        translations.pricing.premiumPlan.features[0],
        translations.pricing.premiumPlan.features[1],
        translations.pricing.premiumPlan.features[2],
        translations.pricing.premiumPlan.features[3],
        translations.pricing.premiumPlan.features[4],
      ],
      notIncluded: [t('pricing.notIncluded.multiFarmDashboard'), t('pricing.notIncluded.groupAnalytics')],
    },
    {
      tier: 'cooperative',
      name: t('pricing.cooperative'),
      price: 999,
      period: t('pricing.perMonth'),
      description: t('pricing.cooperativePlan.description'),
      icon: Building2,
      features: [
        translations.pricing.cooperativePlan.features[0],
        translations.pricing.cooperativePlan.features[1],
        translations.pricing.cooperativePlan.features[2],
        translations.pricing.cooperativePlan.features[3],
        translations.pricing.cooperativePlan.features[4],
        translations.pricing.cooperativePlan.features[5],
      ],
      notIncluded: [t('pricing.notIncluded.whiteLabelOptions'), t('pricing.notIncluded.apiAccess')],
    },
    {
      tier: 'enterprise',
      name: t('pricing.enterprise'),
      price: 4999,
      period: t('pricing.perMonth'),
      description: t('pricing.enterprisePlan.description'),
      icon: Globe,
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
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, userId: user?.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('errors.paymentFailed'));
        toast.success(data.data?.message || t('pricing.subscriptionActivated'));
        router.push('/auth');
        return;
      }
      const res = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user?.id, email: user?.email || 'farmer@agripride.ai', name: user?.name || 'Farmer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('errors.paymentFailed'));
      const authorization_url = data.data?.authorization_url || data.authorization_url;
      if (authorization_url) { window.location.assign(authorization_url); } else { throw new Error(t('errors.paymentFailed')); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.paymentFailed'));
    } finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20 sm:px-8 lg:px-10">
        {statusMessage && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium font-body ${
            statusMessage.variant === 'success' ? 'bg-[#f0f5f1] text-[#2d6a4f] border border-[#dce8de]' :
            statusMessage.variant === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            statusMessage.variant === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]'
          }`}>
            {statusMessage.message}
          </div>
        )}

        <RevealSection className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#c4704b]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">{t('pricing.title')}</span>
          </div>
          <h1 className="display-lg text-[var(--foreground)]">
            {t('pricing.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-[var(--muted-foreground)] font-body">
            {t('pricing.subtitle')}
          </p>
        </RevealSection>

        {/* Pricing comparison */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <RevealSection key={plan.tier} delay={i * 0.08}>
                <div className={`relative h-full flex flex-col rounded-lg border bg-[var(--card)] transition-all duration-300 ${plan.popular ? 'border-[#2d6a4f]/30 dark:border-[#5e9a6b]/30 shadow-lg' : 'border-[var(--border)] hover:shadow-md'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-6 z-10">
                      <Badge variant="primary" className="text-[10px] tracking-wide uppercase">{t('pricing.mostPopular')}</Badge>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className={`mb-4 inline-flex rounded-lg p-2 w-fit ${plan.popular ? 'bg-[#1a3a2a] dark:bg-[#5e9a6b]' : 'bg-[var(--muted)]'}`}>
                      <Icon className={`h-5 w-5 ${plan.popular ? 'text-white dark:text-[#1a1a1a]' : 'text-[var(--muted-foreground)]'}`} />
                    </div>
                    <h3 className="font-display text-xl text-[var(--foreground)]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] font-body">{plan.description}</p>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">
                        {plan.price === 0 ? t('pricing.free') : t('landing.currencyKes', { value: plan.price.toLocaleString() })}
                      </span>
                      {plan.price > 0 && <span className="text-sm text-[var(--muted-foreground)] font-body">{t('pricing.perMonth')}</span>}
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5 text-sm font-body">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d6a4f] dark:text-[#5e9a6b]" />
                          <span className="text-[var(--foreground)]">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5 text-sm font-body text-[var(--muted-foreground)]/60">
                          <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border)]">
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => plan.price === 0 ? router.push('/auth?tab=register') : handleSubscribe(plan.tier)}
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
                      {plan.price > 0 && (
                        <p className="mt-2 text-center text-xs text-[var(--muted-foreground)]/60 font-body">
                          {t('pricing.securePayment')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </RevealSection>
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2d6a4f]" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
