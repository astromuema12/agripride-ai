'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Wheat, CloudSun, Shield, BarChart3,
  Sprout, FileSearch, ScrollText, TreePine,
  Globe, CheckCircle, Quote,
  TrendingUp, Users, DollarSign, Activity,
  ChevronRight, Star, Sparkles, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiDemo } from '@/components/shared/AiDemo';
import { useI18n } from '@/lib/i18n';
import type { Testimonial } from '@/types';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/testimonials').then((r) => r.json()).then((res) => { if (res.success) setTestimonials(res.data); }).catch(() => {});
  }, []);

  const metrics = [
    { value: '15,000+', label: t('landing.hero.farmersCount', { count: '15,000' }), icon: Users },
    { value: '25,000+', label: t('landing.metrics.acres'), icon: Activity },
    { value: '98.5%', label: t('landing.stats.accuracy'), icon: Shield },
    { value: '30%', label: t('landing.metrics.yield'), icon: TrendingUp },
    { value: '47', label: t('landing.metrics.counties'), icon: Globe },
    { value: 'KES 50M+', label: t('landing.metrics.value'), icon: DollarSign },
  ];

  const features = [
    { icon: FileSearch, title: t('landing.features.diseaseDetection'), description: t('landing.features.diseaseDetectionDesc'), color: 'text-[#445c8c]', bg: 'bg-[#c4d4e4]' },
    { icon: CloudSun, title: t('landing.features.weatherMonitoring'), description: t('landing.features.weatherMonitoringDesc'), color: 'text-[#445c8c]', bg: 'bg-[#c4d4e4]' },
    { icon: ScrollText, title: t('landing.features.aiAssistant'), description: t('landing.features.aiAssistantDesc'), color: 'text-[#a4dca7]', bg: 'bg-[#eef8ef]' },
    { icon: BarChart3, title: t('dashboard.farmer.farmAnalytics'), description: t('landing.features.yieldPredictionDesc'), color: 'text-[#445c8c]', bg: 'bg-[#c4d4e4]' },
    { icon: Globe, title: t('landing.features.marketPrices'), description: t('landing.features.marketPricesDesc'), color: 'text-[#945c34]', bg: 'bg-[#f5ede6]' },
    { icon: Shield, title: t('landing.features.sustainability'), description: t('landing.features.sustainabilityDesc'), color: 'text-[#a4dca7]', bg: 'bg-[#eef8ef]' },
  ];

  const pricingPlans = [
    { name: t('pricing.free'), monthly: 0, annual: 0, desc: t('pricing.freePlan.description'), features: [t('landing.features.diseaseDetection'), t('landing.features.weatherMonitoring'), t('landing.features.marketPrices'), t('dashboard.farmer.myFarms'), t('common.community')], popular: false },
    { name: t('pricing.premium'), monthly: 299, annual: 2990, desc: t('pricing.premiumPlan.description'), features: [t('landing.features.diseaseDetection'), t('landing.features.aiAssistant'), t('landing.features.weatherMonitoring'), t('dashboard.farmer.farmAnalytics'), t('landing.features.marketPrices'), t('reports.export'), t('pricing.premium')], popular: true },
    { name: t('pricing.enterprise'), monthly: 4999, annual: 49990, desc: t('pricing.enterprisePlan.description'), features: [t('pricing.premium'), t('dashboard.farmer.myFarms'), t('dashboard.officer.analytics'), t('pricing.enterprisePlan.customIntegrations'), t('pricing.enterprisePlan.slaGuarantee'), t('pricing.enterprisePlan.onPremise'), t('pricing.enterprisePlan.whiteLabel'), t('pricing.enterprisePlan.support247')], popular: false },
  ];

  const faqItems = [
    { q: t('landing.faq.questions.q1'), a: t('landing.faq.questions.a1') },
    { q: t('landing.faq.questions.q2'), a: t('landing.faq.questions.a2') },
    { q: t('landing.faq.questions.q5'), a: t('landing.faq.questions.a5') },
    { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#c4d4e4]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c4d4e4]/40 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#a4dca7]/20 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#c4d4e4]/30 blur-3xl max-xs:h-80 max-xs:w-80" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#445c8c] to-[#445c8c] shadow-lg shadow-[#445c8c]/25">
              <Wheat className="h-5 w-5 text-white dark:text-white" />
            </div>
            <span className="text-lg font-bold text-[#1f2937] dark:text-white">AgriPride AI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {[t('landing.features.title'), t('nav.pricing'), t('nav.governance'), t('nav.contact')].map((l, i) => {
              const ids = ['features', 'pricing', 'governance', 'contact'];
              return (
                <a key={ids[i]} href={`#${ids[i]}`} className="text-sm font-medium text-[#5a6a7d] transition-all hover:text-[#445c8c] relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#a4dca7] after:transition-all hover:after:w-full">{l}</a>
              );
            })}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="text-[#5a6a7d] hover:text-[#445c8c] hover:bg-[#c4d4e4]/50 hidden xs:inline-flex" onClick={() => router.push('/auth')}>{t('nav.signIn')}</Button>
            <Button size="sm" className="bg-[#445c8c] text-white hover:bg-[#364a70] shadow-xl shadow-[#445c8c]/20 sm:hidden" onClick={() => router.push('/auth?tab=register')}>{t('common.getStarted')}</Button>
            <Button className="bg-[#445c8c] text-white hover:bg-[#364a70] shadow-xl shadow-[#445c8c]/20 hidden sm:inline-flex" onClick={() => router.push('/auth?tab=register')}>{t('landing.hero.cta')}</Button>
          </div>
        </nav>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:pb-28 sm:pt-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-[#a4dca7]/50 bg-[#a4dca7]/15 px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-medium text-[#408c45] backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a4dca7] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a4dca7]" />
                </span>
                {t('common.new')}
                <span className="text-[#72c477]/60 hidden xs:inline">&mdash;</span>
                <span className="hidden xs:inline">{t('landing.hero.farmersCountDesc')}</span>
              </motion.div>
              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-[#1f2937] xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-balance">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#5a6a7d]">
                {t('landing.hero.subtitle')}
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Button size="xl" className="bg-[#445c8c] text-white hover:bg-[#364a70] shadow-2xl shadow-[#445c8c]/30 hover:shadow-[#445c8c]/40 w-full xs:w-auto" onClick={() => router.push('/auth?tab=register')}>
                  {t('landing.hero.cta')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="xl" variant="outline" className="border-[#945c34] text-[#945c34] hover:bg-[#945c34] hover:text-white hover:border-[#945c34] backdrop-blur-sm w-full xs:w-auto" onClick={() => router.push('/governance')}>
                  <Sparkles className="mr-2 h-4 w-4" /> {t('landing.hero.learnMore')}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <div className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-gradient-to-r from-[#445c8c]/20 via-[#a4dca7]/10 to-[#c4d4e4]/20 blur-3xl animate-pulse-glow" />
              <div className="relative overflow-hidden rounded-2xl border border-[#ccccbe]/30 bg-white/80 p-1 backdrop-blur-xl">
                <div className="rounded-xl bg-white p-3 sm:p-5 shadow-sm">
                  <div className="mb-3 sm:mb-4 flex items-center justify-between border-b border-[#ccccbe]/40 pb-2 sm:pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-[#945c34]/80" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-[#ccccbe]/80" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-[#a4dca7]/80" />
                      </div>
                      <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-[#5a6a7d] dark:text-[#5a6a7d] font-mono">agripride-dashboard</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-[#a4dca7]/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-[#408c45]">
                      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a4dca7]" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a4dca7]" /></span>
                      <span className="hidden xs:inline">{t('landing.hero.allSystemsNormal')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 xs:grid-cols-4 xs:gap-3">
                    {[
                      { label: t('dashboard.farmer.totalFarms'), value: '12', change: '+3', icon: Sprout },
                      { label: t('dashboard.farmer.totalCrops'), value: '24', change: '+8', icon: TreePine },
                      { label: t('dashboard.farmer.diseaseDetection'), value: '47', change: '+12', icon: FileSearch },
                      { label: t('landing.metrics.yield'), value: '35%', change: '+5%', icon: TrendingUp },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl bg-[#f0f4f8] p-2 sm:p-3 border border-[#ccccbe]/30 hover:bg-[#c4d4e4]/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <s.icon className="h-3 w-3 sm:h-4 sm:w-4 text-[#445c8c]" />
                          <span className="text-[10px] sm:text-xs font-medium text-[#a4dca7]">{s.change}</span>
                        </div>
                      <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-[#1f2937] dark:text-[#1f2937]">{s.value}</div>
                      <div className="text-[10px] sm:text-xs text-[#5a6a7d] dark:text-[#5a6a7d]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 sm:mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    <div className="rounded-xl bg-[#f0f4f8] p-2 sm:p-3 border border-[#ccccbe]/30">
                      <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs text-[#5a6a7d] dark:text-[#5a6a7d]">
                        <span>{t('dashboard.farmHealthScore')}</span>
                        <span className="text-[#a4dca7] font-medium">92%</span>
                      </div>
                      <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-[#ccccbe]/30">
                        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#a4dca7] to-[#72c477] shadow-[0_0_8px_rgba(164,220,167,0.3)]" />
                      </div>
                      <div className="mt-1 sm:mt-2 flex justify-between text-[10px] sm:text-xs text-[#5a6a7d] dark:text-[#5a6a7d]"><span>Maize</span><span>Beans</span><span>Tomatoes</span></div>
                    </div>
                    <div className="rounded-xl bg-[#f0f4f8] p-2 sm:p-3 border border-[#ccccbe]/30">
                      <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs text-[#5a6a7d] dark:text-[#5a6a7d]">
                        <span>{t('weather.currentWeather')}</span>
                        <span className="text-[#445c8c]"><CloudSun className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1f2937] dark:text-[#1f2937]">
                        28°C · Partly Cloudy
                      </div>
                      <div className="mt-1 text-[10px] sm:text-xs text-[#a4dca7]">Rain expected in 2 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== METRICS ===== */}
      <section id="features" className="relative overflow-hidden bg-gradient-to-b from-[#f0f4f8] to-[var(--background)] py-16 sm:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-[#c4d4e4]/50 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">{t('landing.hero.platformImpact')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">{t('landing.hero.growingFuture')}</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">{t('landing.hero.realMetrics')}</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {metrics.map((m, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="group relative rounded-xl border border-[#ccccbe] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                  <div className="relative">
                    <div className="mb-3 inline-flex rounded-xl bg-[#c4d4e4] p-3 dark:bg-[#364a70]">
                      <m.icon className="h-6 w-6 text-[#445c8c] dark:text-[#a4dca7]" />
                    </div>
                    <div className="text-3xl font-bold text-[#445c8c] dark:text-[#a4dca7]">{m.value}</div>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">{m.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">{t('landing.hero.everythingYouNeed')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">{t('landing.hero.powerfulTools')}</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">{t('landing.hero.onePlatform')}</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="group relative h-full overflow-hidden rounded-xl border border-[#ccccbe] bg-white p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 hover:bg-[#f0f4f8]">
                  <div className={`mb-5 inline-flex rounded-xl p-3 ${f.bg} ring-1 ring-[#ccccbe]`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{f.description}</p>
                  <div className="mt-6 flex items-center gap-1 text-sm font-medium text-[#445c8c] dark:text-[#a4dca7] opacity-0 transition-all duration-150 group-hover:opacity-100">
                    {t('landing.hero.learnMore')} <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== AI GOVERNANCE ===== */}
      <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: 'linear-gradient(135deg, #445c8c, #a4dca7)' }}>
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-3 sm:mb-4 border-white/20 bg-white/10 text-white">{t('landing.hero.governance.responsibleAI')}</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">{t('landing.hero.governance.aiYouCanTrust')}</h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/70">{t('landing.hero.governance.governanceDesc')}</p>
              <div className="mt-8 space-y-4">
                {[
                  { label: 'TRACK', desc: t('landing.hero.governance.track') },
                  { label: 'OASIS', desc: t('landing.hero.governance.oasis') },
                  { label: 'RANK', desc: t('landing.hero.governance.rank') },
                  { label: 'TRAIL', desc: t('landing.hero.governance.trail') },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/30"
                  >
                    <div className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold tracking-wider text-white transition-colors group-hover:bg-white/30">{f.label}</div>
                    <p className="text-sm text-white/80">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
              <Button className="mt-6 sm:mt-8 bg-white text-[#445c8c] hover:bg-[#f0f4f8] shadow-xl shadow-black/10 w-full sm:w-auto" onClick={() => router.push('/governance')}>
                {t('landing.hero.governance.learnAboutAI')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-2xl bg-white/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-6 backdrop-blur-sm">
                <div className="mb-3 sm:mb-4 flex items-center gap-3 border-b border-white/20 pb-3 sm:pb-4">
                  <div className="rounded-lg bg-white/20 p-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{t('landing.hero.governance.auditTrail')}</div>
                    <div className="text-xs text-white/60">{t('landing.hero.governance.auditDesc')}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { action: 'Disease Diagnosis — Maize', confidence: '94%', time: '2 min ago', agent: 'Crop Disease Agent' },
                    { action: 'Weather Advisory', confidence: '88%', time: '15 min ago', agent: 'Weather Intelligence' },
                    { action: 'Planting Recommendation', confidence: '92%', time: '1 hour ago', agent: 'Crop Advisor' },
                  ].map((log, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        <span className="text-xs font-medium text-[#a4dca7]">{log.confidence}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                        <span>{log.agent}</span>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
      <section id="testimonials" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">{t('landing.hero.farmerSuccess')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">{t('landing.hero.realFarmers')}</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">{t('landing.hero.hearFromFarmers')}</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {testimonials.map((item, i) => (
              <motion.div key={item.id} variants={itemVariants}>
                <div className="group relative h-full rounded-xl border border-[#ccccbe] bg-white p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                  <Quote className="mb-4 h-8 w-8 text-[#c4d4e4] dark:text-[#364a70]" />
                  <p className="mb-6 text-sm leading-relaxed text-[var(--muted-foreground)]">&ldquo;{item.content}&rdquo;</p>
                  <div className="mb-4 flex items-center gap-4 border-t border-[#ccccbe] pt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#445c8c] to-[#445c8c] text-sm font-bold text-white shadow-lg shadow-[#445c8c]/20">{item.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{item.name}</div>
                      {item.location && <div className="text-xs text-[var(--muted-foreground)]">{item.location}{item.farm_type ? ` · ${item.farm_type}` : ''}</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      )}

      <AiDemo />

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-[var(--muted)] to-[var(--background)] py-16 sm:py-24">
        <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-[#c4d4e4]/50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">{t('landing.hero.simplePricing')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">{t('landing.hero.plansForEveryFarm')}</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">{t('landing.hero.pricingSubtitle')}</p>
          </motion.div>
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>{t('landing.hero.monthly')}</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${billing === 'annual' ? 'bg-[#445c8c]' : 'bg-[var(--border)]'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${billing === 'annual' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>{t('landing.hero.annual')} <span className="text-[#a4dca7] dark:text-[#a4dca7]">{t('landing.hero.saveAnnual', { percent: 15 })}</span></span>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 grid gap-8 lg:grid-cols-3"
          >
            {pricingPlans.map((plan, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className={`relative rounded-xl border p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] ${plan.popular ? 'border-[#a4dca7]/50 bg-[var(--card)] shadow-[var(--shadow-card)] ring-1 ring-[#a4dca7]/20' : 'border-[#ccccbe] bg-[var(--card)] hover:-translate-y-0.5'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" className="px-4 py-1 text-xs shadow-lg shadow-[#a4dca7]/20">{t('landing.hero.mostPopular')}</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[var(--foreground)]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[var(--foreground)]">KES {billing === 'monthly' ? plan.monthly.toLocaleString() : plan.annual.toLocaleString()}</span>
                      <span className="text-sm text-[var(--muted-foreground)]">{billing === 'monthly' ? t('landing.hero.perMo') : t('landing.hero.perYr')}</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#a4dca7]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-[#445c8c] text-white hover:bg-[#364a70] shadow-[var(--shadow-button)]' : 'border-[#ccccbe] text-[var(--foreground)] hover:bg-[var(--muted)]'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => router.push('/auth?tab=register')}
                  >
                    {plan.monthly === 0 ? t('landing.hero.getStartedFree') : t('landing.hero.subscribe')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {plan.monthly > 0 && <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">{t('landing.hero.poweredByPaystack')}</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">{t('landing.hero.faqTitle')}</h2>
          </motion.div>
          <div className="mt-8 sm:mt-12 space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className={`w-full rounded-xl border p-5 text-left transition-all duration-200 ${faqOpen === i ? 'border-[#a4dca7] bg-gradient-to-br from-[#eef8ef] to-white shadow-[var(--shadow-card-hover)] dark:border-[#a4dca7] dark:from-[#283854] dark:to-[var(--card)]' : 'border-[#ccccbe] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-[var(--border)]'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-[var(--foreground)]">{item.q}</span>
                    <ChevronRight className={`h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-all duration-200 ${faqOpen === i ? 'rotate-90 text-[#445c8c]' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-200 ${faqOpen === i ? 'mt-3 max-h-96' : 'max-h-0'}`}>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{item.a}</p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: 'linear-gradient(135deg, #445c8c, #a4dca7)' }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#a4dca7]/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#c4d4e4]/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance">{t('landing.hero.ctaTitle')}</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-white/80">{t('landing.hero.ctaSubtitle')}</p>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              <Button size="xl" className="bg-white text-[#445c8c] hover:bg-[#f0f4f8] shadow-2xl shadow-black/10 hover:shadow-[#a4dca7]/50 w-full xs:w-auto" onClick={() => router.push('/auth?tab=register')}>
                {t('landing.hero.getStartedFree')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="xl" variant="outline" className="border-white/40 text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-sm w-full xs:w-auto" onClick={() => router.push('/contact')}>
                {t('landing.hero.talkToTeam')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      
    </div>
  );
}
