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
  ChevronRight, Star, Menu, X, Play,
} from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebook, FaInstagram } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiDemo } from '@/components/shared/AiDemo';
import type { Testimonial } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
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
  { icon: FileSearch, title: 'AI Disease Detection', description: 'Snap a photo of your crop — our AI identifies diseases in seconds with 98.5% accuracy and recommends treatment.', color: 'text-red-500 bg-red-50', gradient: 'from-red-500 to-orange-500' },
  { icon: CloudSun, title: 'Weather Intelligence', description: 'Hyper-local 7-day forecasts, drought alerts, and planting window predictions powered by real meteorological data.', color: 'text-blue-500 bg-blue-50', gradient: 'from-blue-500 to-cyan-500' },
  { icon: ScrollText, title: 'AI Crop Advisor', description: 'Your personal agronomist — get tailored planting, irrigation, fertilizer, and pest management advice in your local language.', color: 'text-emerald-500 bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Farm Analytics', description: 'Interactive dashboards with yield trends, cost tracking, profit analysis, and sustainability scoring for every farm.', color: 'text-amber-500 bg-amber-50', gradient: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Market Intelligence', description: 'Real-time crop prices across 47 counties. Know where to sell for the best price before you harvest.', color: 'text-cyan-500 bg-cyan-50', gradient: 'from-cyan-500 to-blue-500' },
  { icon: Shield, title: 'Responsible AI', description: 'Every decision is transparent, auditable, and governed by our TRACK framework. No black boxes — just trustworthy intelligence.', color: 'text-purple-500 bg-purple-50', gradient: 'from-purple-500 to-violet-500' },
];

const testimonialsData = [
  { name: 'Grace Wanjiku', location: 'Kiambu County', crop: 'Maize & Beans', avatar: 'GW', yield: '+42%', revenue: '+KES 180,000', quote: 'AgriPride detected a maize blight I would have missed for another two weeks. The treatment saved my entire 3-acre harvest.', color: 'bg-emerald-500' },
  { name: 'James Ochieng', location: 'Kisumu County', crop: 'Rice & Vegetables', avatar: 'JO', yield: '+35%', revenue: '+KES 95,000', quote: 'The weather alerts helped me time my planting perfectly. Last season I lost 40% to unexpected drought. This season? Zero loss.', color: 'bg-blue-500' },
  { name: 'Sarah Nyambura', location: 'Nakuru County', crop: 'Dairy & Fodder', avatar: 'SN', yield: '+28%', revenue: '+KES 220,000', quote: 'As a female farmer, having AI-powered insights gives me confidence. The market prices feature alone has transformed my income.', color: 'bg-purple-500' },
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

export default function HomePage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/testimonials').then((r) => r.json()).then((res) => { if (res.success) setTestimonials(res.data); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgriPride AI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Pricing', 'Governance', 'Contact'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-emerald-200/80 transition-colors hover:text-white">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-emerald-200 hover:text-white hover:bg-emerald-800" onClick={() => router.push('/auth')}>Sign In</Button>
            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-lg" onClick={() => router.push('/auth?tab=register')}>Get Started Free</Button>
          </div>
        </nav>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Beta Program — Now Open
              </div>
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                AI That Understands{' '}
                <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">African Agriculture</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-200/80">
                Diagnose crop diseases in seconds, get hyper-local weather forecasts, and access market intelligence — all powered by responsible AI built for African farmers.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="xl" className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-2xl shadow-emerald-500/30" onClick={() => router.push('/auth?tab=register')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="xl" variant="outline" className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-800/50 hover:text-white" onClick={() => router.push('/governance')}>
                  <Play className="mr-2 h-4 w-4" /> See How It Works
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-emerald-300/70">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> Free during beta</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> M-Pesa coming soon</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-emerald-500/30 via-emerald-400/20 to-emerald-300/30 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
                <div className="rounded-xl bg-gray-950/90 p-4">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                      </div>
                      <span className="ml-3 text-xs text-white/50">AgriPride AI — Farm Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                      Live
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Active Farms', value: '12', change: '+3', icon: Sprout },
                      { label: 'Crops Monitored', value: '24', change: '+8', icon: TreePine },
                      { label: 'Diagnosis This Month', value: '47', change: '+12', icon: FileSearch },
                      { label: 'Avg. Yield Increase', value: '35%', change: '+5%', icon: TrendingUp },
                    ].map((s, i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <s.icon className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400">{s.change}</span>
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">{s.value}</div>
                        <div className="text-xs text-white/50">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                        <span>Crop Health Index</span><span className="text-emerald-400">92%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-white/40"><span>Maize</span><span>Beans</span><span>Tomatoes</span></div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                        <span>Weather Alert</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white">
                        <CloudSun className="h-4 w-4 text-yellow-400" />
                        28°C · Partly Cloudy
                      </div>
                      <div className="mt-1 text-xs text-emerald-400">Rain expected in 2 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="border-b border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">Trusted by farmers and partners across Kenya</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['Kenya Farmers Association', 'Ministry of Agriculture', 'Safaricom', 'University of Nairobi', 'AgriFi Kenya', 'World Food Programme'].map((name) => (
              <div key={name} className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                <Shield className="h-4 w-4" /> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== METRICS ===== */}
      <section id="features" className="bg-gradient-to-b from-emerald-50/50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Platform Impact</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Growing Africa&apos;s Agricultural Future</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">Real metrics from our growing platform deployment across Kenya.</p>
          </motion.div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="group relative rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-3">
                      <m.icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{m.value}</div>
                    <div className="mt-1 text-sm text-gray-500">{m.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Everything You Need</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Powerful Tools for Modern Farming</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">From disease detection to market prices — one platform for your entire farming operation.</p>
          </motion.div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity group-hover:opacity-5`} />
                  <div className={`mb-5 inline-flex rounded-xl p-3 ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI GOVERNANCE ===== */}
      <section className="bg-gradient-to-br from-emerald-950 to-emerald-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Badge variant="secondary" className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Responsible AI</Badge>
              <h2 className="text-4xl font-bold text-white">AI You Can Trust</h2>
              <p className="mt-4 text-lg text-emerald-200/70">Every diagnosis, recommendation, and insight is governed by our Responsible AI framework. No black boxes — full transparency.</p>
              <div className="mt-8 space-y-4">
                {[
                  { label: 'TRACK', desc: 'Transparency & Accountability in every AI decision' },
                  { label: 'OASIS', desc: 'Ownership & Security of your farm data' },
                  { label: 'RANK', desc: 'Role-based access control' },
                  { label: 'TRAIL', desc: 'Full audit trail for every AI interaction' },
                ].map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 rounded-xl border border-emerald-800/50 bg-emerald-900/50 p-4 backdrop-blur-sm">
                    <div className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-300">{f.label}</div>
                    <p className="text-sm text-emerald-200/80">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
              <Button className="mt-8 bg-emerald-500 text-emerald-950 hover:bg-emerald-400" onClick={() => router.push('/governance')}>
                Learn About Our AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-2xl" />
              <div className="relative rounded-2xl border border-emerald-800/50 bg-emerald-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-emerald-800/50 pb-4">
                  <Shield className="h-8 w-8 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">AI Audit Log</div>
                    <div className="text-xs text-emerald-300/60">Every decision tracked and verifiable</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { action: 'Disease Diagnosis — Maize', confidence: '94%', time: '2 min ago', agent: 'Crop Disease Agent' },
                    { action: 'Weather Advisory', confidence: '88%', time: '15 min ago', agent: 'Weather Intelligence' },
                    { action: 'Planting Recommendation', confidence: '92%', time: '1 hour ago', agent: 'Crop Advisor' },
                  ].map((log, i) => (
                    <div key={i} className="rounded-lg border border-emerald-800/30 bg-emerald-950/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        <span className="text-xs text-emerald-400">{log.confidence}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-emerald-300/50">
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
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Farmer Success Stories</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Real Farmers, Real Results</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">Hear from farmers who are already transforming their farms with AgriPride AI.</p>
          </motion.div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonialsData.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="group relative h-full rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                  <Quote className="mb-4 h-8 w-8 text-emerald-300" />
                  <p className="mb-6 text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mb-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>{t.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.location} · {t.crop}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-3">
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-600">{t.yield}</div>
                      <div className="text-xs text-gray-500">Yield Increase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-600">{t.revenue}</div>
                      <div className="text-xs text-gray-500">Revenue Gain</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AiDemo />

      {/* ===== PRICING ===== */}
      <section id="pricing" className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Simple Pricing</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Plans for Every Farm</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">Start free, upgrade as you grow. All plans include core AI features.</p>
          </motion.div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billing === 'annual' ? 'bg-emerald-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>Annual <span className="text-emerald-600">Save 15%</span></span>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`relative rounded-2xl border p-8 transition-all hover:shadow-2xl ${plan.popular ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10 scale-105' : 'border-gray-100 bg-white hover:-translate-y-1'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" className="px-4 py-1 text-xs">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">KES {billing === 'monthly' ? plan.monthly.toLocaleString() : plan.annual.toLocaleString()}</span>
                      <span className="text-sm text-gray-400">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`} variant={plan.popular ? 'default' : 'outline'} onClick={() => router.push('/auth?tab=register')}>
                    {plan.monthly === 0 ? 'Get Started Free' : 'Subscribe'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {plan.monthly > 0 && <p className="mt-3 text-center text-xs text-gray-400">M-Pesa payments coming soon</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <h2 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </motion.div>
          <div className="mt-12 space-y-4">
            {faqItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className={`w-full rounded-2xl border p-5 text-left transition-all ${faqOpen === i ? 'border-emerald-200 bg-emerald-50 shadow-lg' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{item.q}</span>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${faqOpen === i ? 'rotate-90' : ''}`} />
                  </div>
                  {faqOpen === i && <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.a}</p>}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-400/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-bold text-white sm:text-5xl">Ready to Transform Your Farm?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">Join thousands of Kenyan farmers using AI to increase yields, reduce losses, and make smarter decisions. Free during beta.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="xl" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl" onClick={() => router.push('/auth?tab=register')}>
                Join the Beta Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="xl" variant="outline" className="border-emerald-400/40 text-white hover:bg-emerald-600/50" onClick={() => router.push('/contact')}>Talk to Our Team</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 bg-gray-950 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-emerald-400" />
                <span className="text-lg font-bold text-white">AgriPride AI</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">Empowering African agriculture with responsible artificial intelligence. Built in Kenya, for Africa.</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/governance" className="hover:text-emerald-400 transition-colors">AI Governance</Link></li>
                <li><Link href="/analytics" className="hover:text-emerald-400 transition-colors">Analytics</Link></li>
                <li><Link href="/market" className="hover:text-emerald-400 transition-colors">Market Intelligence</Link></li>
                <li><Link href="/horizon" className="hover:text-emerald-400 transition-colors">Impact Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link></li>
                <li><Link href="/testimonials" className="hover:text-emerald-400 transition-colors">Testimonials</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Contact & Social</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="mailto:musauedwin2004@gmail.com" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-400" /> musauedwin2004@gmail.com</a></li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-400" /> Nairobi, Kenya</li>
                <li><a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><FaWhatsapp className="h-4 w-4 text-green-400" /> WhatsApp</a></li>
                <li><a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><FaLinkedinIn className="h-4 w-4 text-blue-400" /> LinkedIn</a></li>
                <li><a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><FaFacebook className="h-4 w-4 text-blue-400" /> Facebook</a></li>
                <li><a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><FaInstagram className="h-4 w-4 text-pink-400" /> Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-gray-800 pt-8 text-center text-sm sm:flex-row sm:justify-between">
            <p>&copy; {new Date().getFullYear()} AgriPride AI Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
