'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Leaf, CloudSun, Shield, BarChart3,
  Sprout, FileSearch, ScrollText, TreePine,
  Globe, CheckCircle, Quote, Mail, MapPin,
  TrendingUp, Users, DollarSign, Activity,
  ChevronRight, Star, Sparkles, Zap,
} from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebook, FaInstagram } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiDemo } from '@/components/shared/AiDemo';
import type { Testimonial } from '@/types';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const metrics = [
  { value: '15,000+', label: 'Farmers Reached', icon: Users },
  { value: '25,000+', label: 'Acres Monitored', icon: Activity },
  { value: '98.5%', label: 'Diagnosis Accuracy', icon: Shield },
  { value: '30%', label: 'Avg. Yield Increase', icon: TrendingUp },
  { value: '47', label: 'Counties in Kenya', icon: Globe },
  { value: 'KES 50M+', label: 'Farmer Value Created', icon: DollarSign },
];

const features = [
  { icon: FileSearch, title: 'AI Disease Detection', description: 'Snap a photo of your crop — our AI identifies diseases in seconds with 98.5% accuracy and recommends treatment.', color: 'text-red-500', bg: 'bg-red-50', gradient: 'from-red-500 to-orange-500' },
  { icon: CloudSun, title: 'Weather Intelligence', description: 'Hyper-local 7-day forecasts, drought alerts, and planting window predictions powered by real meteorological data.', color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-500 to-cyan-500' },
  { icon: ScrollText, title: 'AI Crop Advisor', description: 'Your personal agronomist — get tailored planting, irrigation, fertilizer, and pest management advice in your local language.', color: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Farm Analytics', description: 'Interactive dashboards with yield trends, cost tracking, profit analysis, and sustainability scoring for every farm.', color: 'text-amber-500', bg: 'bg-amber-50', gradient: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Market Intelligence', description: 'Real-time crop prices across 47 counties. Know where to sell for the best price before you harvest.', color: 'text-cyan-500', bg: 'bg-cyan-50', gradient: 'from-cyan-500 to-blue-500' },
  { icon: Shield, title: 'Responsible AI', description: 'Every decision is transparent, auditable, and governed by our TRACK framework. No black boxes — just trustworthy intelligence.', color: 'text-purple-500', bg: 'bg-purple-50', gradient: 'from-purple-500 to-violet-500' },
];

const testimonialsData = [
  { name: 'Grace Wanjiku', location: 'Kiambu County', crop: 'Maize & Beans', avatar: 'GW', yield: '+42%', revenue: '+KES 180,000', quote: 'AgriPride detected a maize blight I would have missed for another two weeks. The treatment saved my entire 3-acre harvest.' },
  { name: 'James Ochieng', location: 'Kisumu County', crop: 'Rice & Vegetables', avatar: 'JO', yield: '+35%', revenue: '+KES 95,000', quote: 'The weather alerts helped me time my planting perfectly. Last season I lost 40% to unexpected drought. This season? Zero loss.' },
  { name: 'Sarah Nyambura', location: 'Nakuru County', crop: 'Dairy & Fodder', avatar: 'SN', yield: '+28%', revenue: '+KES 220,000', quote: 'As a female farmer, having AI-powered insights gives me confidence. The market prices feature alone has transformed my income.' },
];

const pricingPlans = [
  { name: 'Starter', monthly: 0, annual: 0, desc: 'For individual farmers getting started', features: ['AI Disease Diagnosis (10/mo)', 'Weather Forecasts', 'Market Price Access', 'Basic Farm Records', 'Community Access'], popular: false },
  { name: 'Professional', monthly: 299, annual: 2990, desc: 'For serious farmers maximizing yields', features: ['Unlimited AI Diagnosis', 'AI Crop Advisor', 'Weather Intelligence Pro', 'Farm Analytics Dashboard', 'Market Intelligence', 'Data Export', 'Priority Support'], popular: true },
  { name: 'Enterprise', monthly: 4999, annual: 49990, desc: 'For cooperatives, NGOs & agribusinesses', features: ['Everything in Professional', 'Multi-farm Dashboard', 'Group Analytics', 'Custom Integrations', 'API Access', 'Dedicated Account Manager', 'White-label Options', 'SLA Guarantee'], popular: false },
];

const faqItems = [
  { q: 'How does the AI disease detection work?', a: 'Upload a photo of your crop. Our AI analyzes visual symptoms against a database of 200+ crop diseases, returns a diagnosis with confidence score, treatment plan, and prevention tips.' },
  { q: 'Is my farm data secure?', a: 'Yes. All data is encrypted at rest and in transit. We use Supabase with Row-Level Security — you control who sees your data. We never sell farmer data.' },
  { q: 'Do I need internet access?', a: 'The platform works best online, but key features like diagnosis history and farm records are cached for offline access in low-connectivity areas.' },
  { q: 'How do I pay?', a: 'M-Pesa integration is coming soon. For now, all plans are free during our beta program. We will announce payment launch with advance notice.' },
];

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
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/testimonials').then((r) => r.json()).then((res) => { if (res.success) setTestimonials(res.data); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-900">
        <Particles />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400/15 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-3xl max-xs:h-80 max-xs:w-80" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
              <Leaf className="h-5 w-5 text-white dark:text-white" />
            </div>
            <span className="text-lg font-bold text-white dark:text-white">AgriPride AI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Pricing', 'Governance', 'Contact'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-emerald-200/70 transition-all hover:text-white relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-emerald-400 after:transition-all hover:after:w-full">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="text-emerald-200 hover:text-white hover:bg-emerald-800/50 hidden xs:inline-flex" onClick={() => router.push('/auth')}>Sign In</Button>
            <Button size="sm" className="bg-white text-emerald-900 hover:bg-emerald-50 dark:bg-white dark:text-emerald-900 dark:hover:bg-emerald-50 shadow-xl shadow-emerald-500/10 sm:hidden" onClick={() => router.push('/auth?tab=register')}>Start</Button>
            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 dark:bg-white dark:text-emerald-900 dark:hover:bg-emerald-50 shadow-xl shadow-emerald-500/10 hidden sm:inline-flex" onClick={() => router.push('/auth?tab=register')}>Get Started Free</Button>
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
                className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-medium text-emerald-300 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Beta Program
                <span className="text-emerald-400/60 hidden xs:inline">&mdash;</span>
                <span className="hidden xs:inline">Now Open</span>
              </motion.div>
              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-balance">
                AI That Understands{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">African Agriculture</span>
              </h1>
              <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-emerald-200/70">
                Diagnose crop diseases in seconds, get hyper-local weather forecasts, and access market intelligence — all powered by responsible AI built for African farmers.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Button size="xl" className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 hover:from-emerald-300 hover:to-emerald-400 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 w-full xs:w-auto" onClick={() => router.push('/auth?tab=register')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="xl" variant="outline" className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-800/40 hover:text-white hover:border-emerald-400/50 backdrop-blur-sm w-full xs:w-auto" onClick={() => router.push('/governance')}>
                  <Sparkles className="mr-2 h-4 w-4" /> See How It Works
                </Button>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-emerald-300/60">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> Free during beta</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> M-Pesa coming soon</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <div className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-300/20 blur-3xl animate-pulse-glow" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
                <div className="rounded-xl bg-gray-950/80 dark:bg-gray-950/80 p-3 sm:p-5">
                  <div className="mb-3 sm:mb-4 flex items-center justify-between border-b border-white/[0.06] pb-2 sm:pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500/80" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-500/80" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500/80" />
                      </div>
                      <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-white/40 dark:text-white/40 font-mono">agripride-dashboard</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                      <span className="hidden xs:inline">All Systems Normal</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 xs:grid-cols-4 xs:gap-3">
                    {[
                      { label: 'Active Farms', value: '12', change: '+3', icon: Sprout },
                      { label: 'Crops Monitored', value: '24', change: '+8', icon: TreePine },
                      { label: 'Diagnosis This Month', value: '47', change: '+12', icon: FileSearch },
                      { label: 'Avg. Yield Increase', value: '35%', change: '+5%', icon: TrendingUp },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.05] p-2 sm:p-3 border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                        <div className="flex items-center justify-between">
                          <s.icon className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                          <span className="text-[10px] sm:text-xs font-medium text-emerald-400">{s.change}</span>
                        </div>
                      <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-white dark:text-white">{s.value}</div>
                      <div className="text-[10px] sm:text-xs text-gray-300 dark:text-gray-300">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 sm:mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    <div className="rounded-xl bg-white/[0.05] p-2 sm:p-3 border border-white/[0.06]">
                      <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs text-gray-200 dark:text-gray-200">
                        <span>Crop Health Index</span>
                        <span className="text-emerald-400 font-medium">92%</span>
                      </div>
                      <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      </div>
                      <div className="mt-1 sm:mt-2 flex justify-between text-[10px] sm:text-xs text-gray-400 dark:text-gray-400"><span>Maize</span><span>Beans</span><span>Tomatoes</span></div>
                    </div>
                    <div className="rounded-xl bg-white/[0.05] p-2 sm:p-3 border border-white/[0.06]">
                      <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs text-gray-200 dark:text-gray-200">
                        <span>Current Weather</span>
                        <span className="text-yellow-400"><CloudSun className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white dark:text-white">
                        28°C · Partly Cloudy
                      </div>
                      <div className="mt-1 text-[10px] sm:text-xs text-emerald-400">Rain expected in 2 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="relative border-b border-[var(--border)] bg-[var(--background)] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 sm:mb-8 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Trusted by farmers and partners across Kenya</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-14 gap-y-4 sm:gap-y-6">
            {['Kenya Farmers Association', 'Ministry of Agriculture', 'Safaricom', 'University of Nairobi', 'AgriFi Kenya', 'World Food Programme'].map((name) => (
              <div key={name} className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:scale-110" /> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== METRICS ===== */}
      <section id="features" className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 to-[var(--background)] py-16 sm:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">Platform Impact</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">Growing Africa&apos;s Agricultural Future</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">Real metrics from our growing platform deployment across Kenya.</p>
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
                <div className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                  <div className="relative">
                    <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
                      <m.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-[var(--foreground)]">{m.value}</div>
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
            <Badge variant="primary" className="mb-3 sm:mb-4">Everything You Need</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">Powerful Tools for Modern Farming</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">From disease detection to market prices — one platform for your entire farming operation.</p>
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
                <div className="group relative h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-150 group-hover:opacity-[0.04]`} />
                  <div className={`mb-5 inline-flex rounded-xl p-3 ${f.bg} ring-1 ring-[var(--border)]`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{f.description}</p>
                  <div className="mt-6 flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 opacity-0 transition-all duration-150 group-hover:opacity-100">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== AI GOVERNANCE ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-900 py-16 sm:py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-3 sm:mb-4 border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Responsible AI</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">AI You Can Trust</h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-emerald-200/60">Every diagnosis, recommendation, and insight is governed by our Responsible AI framework. No black boxes — full transparency.</p>
              <div className="mt-8 space-y-4">
                {[
                  { label: 'TRACK', desc: 'Transparency & Accountability in every AI decision' },
                  { label: 'OASIS', desc: 'Ownership & Security of your farm data' },
                  { label: 'RANK', desc: 'Role-based access control' },
                  { label: 'TRAIL', desc: 'Full audit trail for every AI interaction' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group flex items-center gap-4 rounded-xl border border-emerald-800/40 bg-emerald-900/30 p-4 backdrop-blur-sm transition-all hover:bg-emerald-900/50 hover:border-emerald-700/50"
                  >
                    <div className="rounded-lg bg-emerald-800/60 px-3 py-1.5 text-xs font-bold tracking-wider text-emerald-300 transition-colors group-hover:bg-emerald-700/60">{f.label}</div>
                    <p className="text-sm text-emerald-200/70">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
              <Button className="mt-6 sm:mt-8 bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-950 hover:from-emerald-400 hover:to-emerald-300 shadow-xl shadow-emerald-500/20 w-full sm:w-auto" onClick={() => router.push('/governance')}>
                Learn About Our AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-emerald-800/40 bg-emerald-900/30 p-4 sm:p-6 backdrop-blur-sm">
                <div className="mb-3 sm:mb-4 flex items-center gap-3 border-b border-emerald-800/30 pb-3 sm:pb-4">
                  <div className="rounded-lg bg-emerald-800/50 p-2">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">AI Audit Trail</div>
                    <div className="text-xs text-emerald-300/50">Every decision tracked and verifiable</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { action: 'Disease Diagnosis — Maize', confidence: '94%', time: '2 min ago', agent: 'Crop Disease Agent' },
                    { action: 'Weather Advisory', confidence: '88%', time: '15 min ago', agent: 'Weather Intelligence' },
                    { action: 'Planting Recommendation', confidence: '92%', time: '1 hour ago', agent: 'Crop Advisor' },
                  ].map((log, i) => (
                    <div key={i} className="rounded-lg border border-emerald-800/20 bg-emerald-950/40 p-3 transition-colors hover:bg-emerald-950/60">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        <span className="text-xs font-medium text-emerald-400">{log.confidence}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-emerald-300/40">
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
      <section id="testimonials" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">Farmer Success Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">Real Farmers, Real Results</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">Hear from farmers who are already transforming their farms with AgriPride AI.</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {testimonialsData.map((t, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="group relative h-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                  <Quote className="mb-4 h-8 w-8 text-emerald-200 dark:text-emerald-800" />
                  <p className="mb-6 text-sm leading-relaxed text-[var(--muted-foreground)]">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mb-4 flex items-center gap-4 border-t border-[var(--border)] pt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">{t.avatar}</div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{t.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t.location} · {t.crop}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 dark:from-emerald-900/30 dark:to-emerald-800/20">
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t.yield}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Yield Increase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t.revenue}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Revenue Gain</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <AiDemo />

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-[var(--muted)] to-[var(--background)] py-16 sm:py-24">
        <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center"
          >
            <Badge variant="primary" className="mb-3 sm:mb-4">Simple Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">Plans for Every Farm</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-[var(--muted-foreground)]">Start free, upgrade as you grow. All plans include core AI features.</p>
          </motion.div>
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${billing === 'annual' ? 'bg-emerald-600' : 'bg-[var(--border)]'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${billing === 'annual' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>Annual <span className="text-emerald-600 dark:text-emerald-400">Save 15%</span></span>
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
                <div className={`relative rounded-xl border p-8 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-card-hover)] ${plan.popular ? 'border-emerald-500/50 bg-[var(--card)] shadow-[var(--shadow-card)] ring-1 ring-emerald-500/20' : 'border-[var(--border)] bg-[var(--card)] hover:-translate-y-0.5'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" className="px-4 py-1 text-xs shadow-lg shadow-emerald-500/20">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[var(--foreground)]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[var(--foreground)]">KES {billing === 'monthly' ? plan.monthly.toLocaleString() : plan.annual.toLocaleString()}</span>
                      <span className="text-sm text-[var(--muted-foreground)]">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[var(--shadow-button)]' : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => router.push('/auth?tab=register')}
                  >
                    {plan.monthly === 0 ? 'Get Started Free' : 'Subscribe'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {plan.monthly > 0 && <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">M-Pesa payments coming soon</p>}
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
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] text-balance">Frequently Asked Questions</h2>
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
                  className={`w-full rounded-xl border p-5 text-left transition-all duration-200 ${faqOpen === i ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-[var(--shadow-card-hover)] dark:border-emerald-800 dark:from-emerald-900/30 dark:to-[var(--card)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-[var(--border)]'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-[var(--foreground)]">{item.q}</span>
                    <ChevronRight className={`h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-all duration-200 ${faqOpen === i ? 'rotate-90 text-emerald-500' : ''}`} />
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
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 animate-gradient" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-400/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-300/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-balance">Ready to Transform Your Farm?</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-emerald-100/80">Join thousands of Kenyan farmers using AI to increase yields, reduce losses, and make smarter decisions. Free during beta.</p>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              <Button size="xl" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-2xl shadow-black/10 hover:shadow-emerald-200/50 w-full xs:w-auto" onClick={() => router.push('/auth?tab=register')}>
                Join the Beta Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="xl" variant="outline" className="border-emerald-300/40 text-white hover:bg-emerald-500/20 hover:border-emerald-200/60 backdrop-blur-sm w-full xs:w-auto" onClick={() => router.push('/contact')}>
                Talk to Our Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-800 dark:border-gray-800 bg-gray-950 dark:bg-gray-950 text-gray-300 dark:text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                  <Leaf className="h-5 w-5 text-white dark:text-white" />
                </div>
                <span className="text-lg font-bold text-white dark:text-white">AgriPride AI</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-400 dark:text-gray-400">Empowering African agriculture with responsible artificial intelligence. Built in Kenya, for Africa.</p>
            </div>
            <div>
              <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/governance" className="transition-colors hover:text-emerald-400">AI Governance</Link></li>
                <li><Link href="/analytics" className="transition-colors hover:text-emerald-400">Analytics</Link></li>
                <li><Link href="/market" className="transition-colors hover:text-emerald-400">Market Intelligence</Link></li>
                <li><Link href="/horizon" className="transition-colors hover:text-emerald-400">Impact Dashboard</Link></li>
                <li><Link href="/pricing" className="transition-colors hover:text-emerald-400">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="transition-colors hover:text-emerald-400">Contact</Link></li>
                <li><Link href="/support" className="transition-colors hover:text-emerald-400">Support</Link></li>
                <li><Link href="/testimonials" className="transition-colors hover:text-emerald-400">Testimonials</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-emerald-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-emerald-400">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Contact & Social</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:musauedwin2004@gmail.com" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><Mail className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" /> <span className="break-all">musauedwin2004@gmail.com</span></a></li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-400 shrink-0" /> Nairobi, Kenya</li>
                <li><a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaWhatsapp className="h-4 w-4 text-green-400 transition-transform group-hover:scale-110 shrink-0" /> WhatsApp</a></li>
                <li><a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaLinkedinIn className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110 shrink-0" /> LinkedIn</a></li>
                <li><a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaFacebook className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110 shrink-0" /> Facebook</a></li>
                <li><a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaInstagram className="h-4 w-4 text-pink-400 transition-transform group-hover:scale-110 shrink-0" /> Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 sm:mt-12 flex flex-col items-center gap-4 border-t border-gray-800 dark:border-gray-800 pt-8 text-center text-sm sm:flex-row sm:justify-between">
            <p className="text-gray-300 dark:text-gray-300">&copy; {new Date().getFullYear()} AgriPride AI Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
