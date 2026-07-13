'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Wheat, CloudSun, Shield, BarChart3,
  Sprout, FileSearch, ScrollText, TreePine,
  Globe, CheckCircle, Quote,
  TrendingUp, Users, DollarSign, Activity,
  ChevronRight, Star, ArrowUpRight, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiDemo } from '@/components/shared/AiDemo';
import { useI18n } from '@/lib/i18n';
import type { Testimonial } from '@/types';

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

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch('/api/testimonials').then((r) => r.json()).then((res) => { if (res.success) setTestimonials(res.data); }).catch(() => {});
  }, []);

  const problems = [
    { stat: '65%', label: 'of crop losses are preventable with early diagnosis' },
    { stat: '3x', label: 'higher yields with data-driven farming decisions' },
    { stat: '40%', label: 'of African farmers lack access to extension services' },
  ];

  const steps = [
    { num: '01', title: 'Connect your farm', desc: 'Register your crops, soil type, and location. Our system builds a profile of your unique growing conditions.' },
    { num: '02', title: 'Get intelligent guidance', desc: 'AI agents monitor your crops, analyze disease symptoms, and deliver weather-aware recommendations in real time.' },
    { num: '03', title: 'Grow with confidence', desc: 'Make informed decisions backed by data. Track your progress, optimize inputs, and increase your harvest season over season.' },
  ];

  const features = [
    { icon: FileSearch, title: 'Disease Diagnosis', desc: 'Photograph a sick plant and get a diagnosis in seconds. Our AI identifies diseases with 98.5% accuracy across 50+ crop types.', accent: true },
    { icon: CloudSun, title: 'Weather Intelligence', desc: 'Hyper-local forecasts combined with crop-specific alerts. Know exactly when to plant, irrigate, and harvest.', accent: false },
    { icon: ScrollText, title: 'AI Farm Assistant', desc: 'Ask questions in plain language. Get advice on planting schedules, pest control, and soil management tailored to your region.', accent: false },
    { icon: BarChart3, title: 'Yield Analytics', desc: 'Track farm performance over seasons. Identify patterns, predict yields, and optimize your resource allocation.', accent: true },
    { icon: Globe, title: 'Market Intelligence', desc: 'Real-time commodity prices from markets across Kenya. Know when to sell and where to get the best margins.', accent: false },
    { icon: Shield, title: 'Sustainability Scoring', desc: 'Measure your environmental impact. Get actionable steps to improve soil health and reduce chemical inputs.', accent: false },
  ];

  const pricingPlans = [
    { name: t('pricing.free'), monthly: 0, annual: 0, desc: t('pricing.freePlan.description'), features: [t('landing.features.diseaseDetection'), t('landing.features.weatherMonitoring'), t('landing.features.marketPrices'), t('dashboard.farmer.myFarms'), t('common.community')], cta: t('landing.hero.cta') },
    { name: t('pricing.premium'), monthly: 299, annual: 2990, desc: t('pricing.premiumPlan.description'), features: [t('landing.features.diseaseDetection'), t('landing.features.aiAssistant'), t('landing.features.weatherMonitoring'), t('dashboard.farmer.farmAnalytics'), t('landing.features.marketPrices'), t('reports.export')], cta: t('landing.hero.subscribe'), popular: true },
    { name: t('pricing.enterprise'), monthly: 4999, annual: 49990, desc: t('pricing.enterprisePlan.description'), features: [t('pricing.premium'), t('dashboard.farmer.myFarms'), t('dashboard.officer.analytics'), t('pricing.enterprisePlan.customIntegrations'), t('pricing.enterprisePlan.slaGuarantee'), t('pricing.enterprisePlan.onPremise')], cta: t('landing.hero.subscribe') },
  ];

  const faqItems = [
    { q: t('landing.faq.questions.q1'), a: t('landing.faq.questions.a1') },
    { q: t('landing.faq.questions.q2'), a: t('landing.faq.questions.a2') },
    { q: t('landing.faq.questions.q5'), a: t('landing.faq.questions.a5') },
    { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== HERO — Editorial Statement ===== */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center bg-[var(--background)]">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 texture-grain pointer-events-none" />
        <div className="absolute inset-0 texture-dots opacity-30 pointer-events-none" />

        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2d6a4f]/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-20 sm:py-28 lg:py-32 w-full">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Text — 7 columns */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-[#c4704b]" />
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">Intelligence for African Agriculture</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="display-xl text-[var(--foreground)]"
              >
                Your crops deserve{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">smarter</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#c4704b]/15 -rotate-1" />
                </span>{' '}
                care.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-6 sm:mt-8 max-w-lg text-base sm:text-lg leading-relaxed text-[var(--muted-foreground)] font-body"
              >
                {t('landing.hero.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4"
              >
                <Button size="lg" className="group" onClick={() => router.push('/auth?tab=register')}>
                  Start growing smarter
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="ghost" className="text-[var(--muted-foreground)]" onClick={() => router.push('/governance')}>
                  See how it works
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 sm:mt-16 flex items-center gap-6 text-xs text-[var(--muted-foreground)] font-body"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['#2d6a4f', '#c4704b', '#756a5c'].map((c, i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-[var(--background)]" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span>15,000+ farmers</span>
                </div>
                <div className="h-4 w-px bg-[var(--border)]" />
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-[#c4704b] text-[#c4704b]" />)}
                  </div>
                  <span>4.9/5 rating</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual — 5 columns */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="lg:col-span-5 relative"
            >
              {/* Abstract shape — not a dashboard mockup */}
              <div className="relative aspect-square max-w-md mx-auto lg:mx-0">
                {/* Background circle */}
                <div className="absolute inset-8 rounded-full bg-[#f0f5f1] dark:bg-[#1a2e20]" />
                {/* Accent ring */}
                <div className="absolute inset-4 rounded-full border border-[#2d6a4f]/10" />
                {/* Inner content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Wheat className="h-24 w-24 sm:h-32 sm:w-32 text-[#2d6a4f]/30 dark:text-[#5e9a6b]/30" strokeWidth={1} />
                    {/* Floating stat badges */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-2 -right-8 sm:-right-12 bg-[var(--card)] rounded-lg px-3 py-2 shadow-lg border border-[var(--border)]"
                    >
                      <div className="text-xs font-semibold text-[#2d6a4f] font-body">98.5%</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] font-body">Accuracy</div>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                      className="absolute -bottom-4 -left-6 sm:-left-10 bg-[var(--card)] rounded-lg px-3 py-2 shadow-lg border border-[var(--border)]"
                    >
                      <div className="text-xs font-semibold text-[#c4704b] font-body">47</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] font-body">Counties</div>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute top-1/2 -right-12 sm:-right-16 bg-[var(--card)] rounded-lg px-3 py-2 shadow-lg border border-[var(--border)]"
                    >
                      <div className="text-xs font-semibold text-[var(--foreground)] font-body">KES 50M+</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] font-body">Value tracked</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM STATEMENT — Editorial ===== */}
      <section className="py-16 sm:py-24 bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-start">
            <RevealSection>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#c4704b]" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">The challenge</span>
              </div>
              <h2 className="display-lg text-[var(--foreground)]">
                African agriculture loses billions every year.
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-[var(--muted-foreground)] font-body max-w-lg">
                Smallholder farmers feed the continent, yet they operate without the tools that large-scale operations take for granted. Late diagnosis, unpredictable weather, and volatile markets compound into preventable losses.
              </p>
            </RevealSection>

            <RevealSection delay={0.15}>
              <div className="space-y-8">
                {problems.map((p, i) => (
                  <div key={i} className="group flex items-start gap-6">
                    <div className="shrink-0 font-display text-4xl sm:text-5xl text-[#2d6a4f] dark:text-[#5e9a6b] leading-none">{p.stat}</div>
                    <div className="pt-2">
                      <p className="text-sm sm:text-base text-[var(--muted-foreground)] font-body leading-relaxed">{p.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — Numbered Steps ===== */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <RevealSection className="max-w-2xl mb-12 sm:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#c4704b]" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">How it works</span>
            </div>
            <h2 className="display-lg text-[var(--foreground)]">
              Three steps to smarter farming.
            </h2>
          </RevealSection>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => (
              <RevealSection key={i} delay={i * 0.12}>
                <div className="relative">
                  <div className="font-display text-6xl sm:text-7xl text-[var(--border)] leading-none mb-6 select-none">{step.num}</div>
                  <h3 className="font-display text-xl sm:text-2xl text-[var(--foreground)] mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--muted-foreground)] font-body max-w-sm">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-4 w-8 h-px bg-[var(--border)]" />
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES — Spotlight Layout ===== */}
      <section className="py-16 sm:py-24 lg:py-32 bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <RevealSection className="max-w-2xl mb-12 sm:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#c4704b]" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">Features</span>
            </div>
            <h2 className="display-lg text-[var(--foreground)]">
              Everything your farm needs, nothing it doesn&apos;t.
            </h2>
          </RevealSection>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <RevealSection key={i} delay={i * 0.08}>
                <div className={`group relative h-full p-6 sm:p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${f.accent ? 'ring-1 ring-[#2d6a4f]/10 dark:ring-[#5e9a6b]/10' : ''}`}>
                  <div className={`mb-5 inline-flex rounded-lg p-2.5 ${f.accent ? 'bg-[#1a3a2a] dark:bg-[#5e9a6b]' : 'bg-[var(--muted)]'}`}>
                    <f.icon className={`h-5 w-5 ${f.accent ? 'text-white dark:text-[#1a1a1a]' : 'text-[var(--muted-foreground)]'}`} />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl text-[var(--foreground)] mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-foreground)] font-body">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS — Horizontal scroll ===== */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <RevealSection className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 sm:mb-16">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#c4704b]" />
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">From the field</span>
                </div>
                <h2 className="display-lg text-[var(--foreground)]">
                  Real farmers, real results.
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] font-body">
                <span>{testimonials.length}+ reviews</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-[#c4704b] text-[#c4704b]" />)}
                </div>
              </div>
            </RevealSection>

            {/* Horizontal scroll */}
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
              {testimonials.map((item, i) => (
                <RevealSection key={item.id} delay={i * 0.1} className="shrink-0 w-[320px] sm:w-[380px] snap-start">
                  <div className="h-full p-6 sm:p-8 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                    <Quote className="mb-4 h-6 w-6 text-[#c4704b]/40" />
                    <p className="text-sm sm:text-base leading-relaxed text-[var(--foreground)] font-body mb-6">
                      &ldquo;{item.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a2a] dark:bg-[#5e9a6b] text-xs font-bold text-white font-body">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--foreground)] font-body">{item.name}</div>
                        {item.location && <div className="text-xs text-[var(--muted-foreground)] font-body">{item.location}{item.farm_type ? ` · ${item.farm_type}` : ''}</div>}
                      </div>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== AI DEMO ===== */}
      <div className="bg-[var(--muted)]">
        <AiDemo />
      </div>

      {/* ===== PRICING — Table-style ===== */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <RevealSection className="max-w-2xl mb-12 sm:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#c4704b]" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">Pricing</span>
            </div>
            <h2 className="display-lg text-[var(--foreground)]">
              Simple plans for every scale.
            </h2>
            <p className="mt-4 text-base text-[var(--muted-foreground)] font-body">
              {t('landing.hero.pricingSubtitle')}
            </p>
          </RevealSection>

          {/* Billing toggle */}
          <div className="flex items-center gap-3 mb-10">
            <span className={`text-sm font-body font-medium transition-colors ${billing === 'monthly' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>{t('landing.hero.monthly')}</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-[var(--border)] data-[checked]:bg-[#2d6a4f]"
              data-checked={billing === 'annual'}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-body font-medium transition-colors ${billing === 'annual' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
              {t('landing.hero.annual')} <span className="text-[#c4704b]">{t('landing.hero.saveAnnual', { percent: 15 })}</span>
            </span>
          </div>

          {/* Pricing grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <RevealSection key={i} delay={i * 0.1}>
                <div className={`relative h-full flex flex-col p-6 sm:p-8 rounded-lg border bg-[var(--card)] transition-all duration-300 ${plan.popular ? 'border-[#2d6a4f]/30 dark:border-[#5e9a6b]/30 shadow-lg' : 'border-[var(--border)] hover:shadow-md'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-6">
                      <Badge variant="primary" className="text-[10px] tracking-wide uppercase">{t('landing.hero.mostPopular')}</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-display text-xl text-[var(--foreground)]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] font-body">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">
                        {plan.monthly === 0 ? t('pricing.free') : `KES ${billing === 'monthly' ? plan.monthly.toLocaleString() : plan.annual.toLocaleString()}`}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)] font-body">{billing === 'monthly' ? t('landing.hero.perMo') : t('landing.hero.perYr')}</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)] font-body">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2d6a4f] dark:text-[#5e9a6b]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => router.push('/auth?tab=register')}
                  >
                    {plan.cta}
                  </Button>
                  {plan.monthly > 0 && <p className="mt-3 text-center text-xs text-[var(--muted-foreground)] font-body">{t('landing.hero.poweredByPaystack')}</p>}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 sm:py-24 lg:py-32 bg-[var(--muted)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <RevealSection className="mb-12 sm:mb-16">
            <h2 className="display-lg text-[var(--foreground)]">
              Common questions.
            </h2>
          </RevealSection>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <RevealSection key={i} delay={i * 0.06}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className={`w-full rounded-lg border p-5 sm:p-6 text-left transition-all duration-200 font-body ${faqOpen === i ? 'border-[#2d6a4f]/20 dark:border-[#5e9a6b]/20 bg-[var(--card)] shadow-sm' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm sm:text-base font-semibold text-[var(--foreground)]">{item.q}</span>
                    <Minus className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${faqOpen === i ? 'rotate-45' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${faqOpen === i ? 'mt-4 max-h-96' : 'max-h-0'}`}>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{item.a}</p>
                  </div>
                </button>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA — Minimal, Confident ===== */}
      <section className="py-20 sm:py-28 lg:py-36 bg-[#0f2219] dark:bg-[#0a0f0c] relative overflow-hidden">
        <div className="absolute inset-0 texture-grain pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5e9a6b]/20 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <RevealSection>
            <h2 className="display-lg text-white">
              Ready to grow differently?
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/50 font-body max-w-xl mx-auto">
              Join 15,000+ farmers across 47 counties who are already using AgriPride to make smarter decisions, every season.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-[#1a3a2a] hover:bg-white/90" onClick={() => router.push('/auth?tab=register')}>
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5" onClick={() => router.push('/contact')}>
                Talk to our team
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
