'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Leaf, CloudSun, Shield, BarChart3,
  Sprout, FileSearch, ScrollText, TreePine,
  Globe, CheckCircle, Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiDemo } from '@/components/shared/AiDemo';
import type { Testimonial } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function HomePage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((res) => { if (res.success) setTestimonials(res.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-earth-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div className="space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
                  <Leaf className="mr-1 h-3 w-3" />
                  AI-Powered Agriculture
                </Badge>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Empowering African Agriculture with{' '}
                <span className="text-emerald-400">Artificial Intelligence</span>
              </h1>
              <p className="max-w-xl text-lg text-emerald-100/80">
                AgriPride AI combines cutting-edge artificial intelligence with deep agricultural expertise to help farmers increase yields, detect diseases early, and make data-driven decisions for sustainable farming.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="xl" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-900" onClick={() => router.push('/auth?tab=register')}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="xl" variant="outline" className="border-emerald-500/30 text-white hover:bg-emerald-700/50" onClick={() => router.push('/governance')}>
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-emerald-200/70">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> No credit card</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> Free demo</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> AI-powered</div>
              </div>
            </motion.div>

            <motion.div className="hidden lg:block" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-300/20 blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {[
                    { icon: Sprout, label: 'Crop Health', value: 'AI-Powered', color: 'from-emerald-400 to-emerald-600' },
                    { icon: CloudSun, label: 'Weather Intel', value: 'Real-time', color: 'from-blue-400 to-cyan-500' },
                    { icon: Shield, label: 'AI Governance', value: 'Beta', color: 'from-purple-400 to-violet-500' },
                    { icon: BarChart3, label: 'Analytics', value: 'Live', color: 'from-amber-400 to-orange-500' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-xl bg-gradient-to-br ${item.color} p-4 text-white`}>
                      <item.icon className="mb-2 h-6 w-6 opacity-80" />
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-sm opacity-80">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Beta Program — Now Recruiting
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: 'Pilot', label: 'Phase Active', sub: 'Limited farmer onboarding' },
              { value: 'Growing', label: 'Community', sub: 'Data updates as adoption grows' },
              { value: 'Coming', label: 'Soon — AI Diagnostics', sub: 'Being validated with partners' },
              { value: 'Kenya', label: 'Launch Market', sub: 'Expanding region by region' },
            ].map((stat, i) => (
              <motion.div key={i} className="text-center" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="text-lg font-bold tracking-tight text-emerald-600">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-gray-700">{stat.label}</div>
                <div className="mt-0.5 text-xs text-gray-400">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need for Smart Farming
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Comprehensive AI-powered tools designed specifically for African agricultural contexts.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileSearch, title: 'Disease Diagnosis', description: 'AI-powered crop disease detection currently in beta validation. Upload images and get AI analysis, treatment plans, and prevention strategies.', color: 'text-red-500 bg-red-50' },
              { icon: CloudSun, title: 'Weather Intelligence', description: 'Real-time weather monitoring with 7-day forecasts, drought alerts, and rainfall predictions tailored to your farm location.', color: 'text-blue-500 bg-blue-50' },
              { icon: ScrollText, title: 'AI Crop Advisor', description: 'Personalized planting, fertilizer, and pest management recommendations based on your specific crops and growing conditions.', color: 'text-emerald-500 bg-emerald-50' },
              { icon: Shield, title: 'AI Governance Center', description: 'Transparent, accountable AI decisions with full traceability. Built on TRACK, OASIS, RANK, and TRAIL frameworks.', color: 'text-purple-500 bg-purple-50' },
              { icon: BarChart3, title: 'Analytics & Reports', description: 'Comprehensive analytics dashboards with yield trends, disease patterns, sustainability metrics, and exportable reports.', color: 'text-amber-500 bg-amber-50' },
              { icon: Globe, title: 'Market Intelligence', description: 'Real-time crop prices, demand trends, and regional market analysis to help you get the best value for your harvest.', color: 'text-cyan-500 bg-cyan-50' },
            ].map((feature, i) => (
              <motion.div key={i} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex rounded-lg p-3 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Governance */}
      <section className="bg-gradient-to-br from-emerald-50 to-earth-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div className="space-y-6" {...fadeUp}>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">AI Governance Framework</Badge>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Responsible AI for Agriculture
              </h2>
              <p className="text-lg text-gray-600">
                Our AI governance center implements multiple frameworks to ensure every AI decision is transparent, accountable, and trustworthy.
              </p>
              <div className="space-y-4">
                {[
                  { framework: 'TRACK', desc: 'Transparency, Responsibility, Accountability, Compliance, Knowledge' },
                  { framework: 'OASIS', desc: 'Ownership, Access, Security, Informed Consent, Stewardship' },
                  { framework: 'RANK', desc: 'Role Separation, Authority Boundaries, Need-to-Know, Shared Knowledge' },
                  { framework: 'TRAIL', desc: 'Traceability, Reliability, Auditability, Integrity, Limits' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{f.framework}</div>
                    <p className="text-sm text-gray-600">{f.desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => router.push('/governance')}>
                Explore Governance Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div className="relative" {...fadeUp} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-gray-900">AI Decision Log</div>
                    <div className="text-xs text-gray-500">All decisions are tracked and auditable</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { action: 'Disease Diagnosis', agent: 'Crop Disease Agent', confidence: '94%', time: '2 min ago' },
                    { action: 'Weather Advisory', agent: 'Weather Intelligence', confidence: '88%', time: '15 min ago' },
                    { action: 'Planting Recommendation', agent: 'Crop Advisor Agent', confidence: '92%', time: '1 hour ago' },
                  ].map((log, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className="text-xs text-gray-400">{log.time}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{log.agent}</span>
                        <span className="font-medium text-emerald-600">{log.confidence} confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">HORIZON Impact</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Driving Sustainable Development
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Aligned with UN Sustainable Development Goals to create lasting impact.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: Sprout, title: 'SDG 2: Zero Hunger', desc: 'Working toward increased crop yields through AI-driven recommendations and early disease detection in our beta program.', color: 'bg-amber-50 text-amber-600', sdg: 'SDG 2' },
              { icon: CloudSun, title: 'SDG 13: Climate Action', desc: 'Helping farmers adapt to climate change with weather intelligence and sustainable farming recommendations.', color: 'bg-green-50 text-green-600', sdg: 'SDG 13' },
              { icon: TreePine, title: 'SDG 15: Life on Land', desc: 'Promoting sustainable agriculture through precision farming recommendations during our pilot phase.', color: 'bg-emerald-50 text-emerald-600', sdg: 'SDG 15' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="h-full text-center">
                  <CardContent className="p-8">
                    <div className={`mx-auto mb-4 inline-flex rounded-xl p-4 ${item.color}`}>
                      <item.icon className="h-8 w-8" />
                    </div>
                    <Badge variant="primary" className="mb-3">{item.sdg}</Badge>
                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AiDemo />

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <Badge variant="primary" className="mb-4">Beta Testimonials</Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Hear From Our Early Adopters
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Real feedback from farmers testing AgriPride AI.
            </p>
            <Link href="/testimonials" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Share your experience &rarr;
            </Link>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div key={t.id || i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <Quote className="mb-3 h-8 w-8 text-emerald-300" />
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">&ldquo;{t.content}&rdquo;</p>
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500">{[t.location, t.farm_type].filter(Boolean).join(' · ') || 'Beta Participant'}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Transform Your Farming?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
              Be among the first to join our beta program. Help shape the future of AI-powered agriculture in Africa.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="xl" className="bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => router.push('/auth?tab=register')}>
                Join Beta Program
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="xl" variant="outline" className="border-emerald-400/30 text-white hover:bg-emerald-600/50" onClick={() => router.push('/governance')}>
                View Governance
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-emerald-400" />
                <span className="text-lg font-bold text-white">AgriPride AI</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">
                Empowering African agriculture with responsible artificial intelligence.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/governance" className="hover:text-emerald-400 transition-colors">AI Governance</Link></li>
                <li><Link href="/analytics" className="hover:text-emerald-400 transition-colors">Analytics</Link></li>
                <li><Link href="/market" className="hover:text-emerald-400 transition-colors">Market Intelligence</Link></li>
                <li><Link href="/horizon" className="hover:text-emerald-400 transition-colors">Impact Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Frameworks</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">TRACK Framework</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">OASIS Framework</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">RANK Framework</span></li>
                <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">TRAIL Framework</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Contact & Social</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:musauedwin2004@gmail.com" className="hover:text-emerald-400 transition-colors">musauedwin2004@gmail.com</a></li>
                <li>Nairobi, Kenya</li>
                <li><a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp</a></li>
                <li><a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">LinkedIn</a></li>
                <li><a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Facebook</a></li>
                <li><a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-gray-800 pt-8 text-center text-sm sm:flex-row sm:justify-between">
            <p>&copy; {new Date().getFullYear()} AgriPride AI. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
              <Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
