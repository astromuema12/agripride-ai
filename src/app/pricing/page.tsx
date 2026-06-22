'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Loader2, Leaf, Sparkles, Building2, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MpesaPayment } from '@/components/shared/mpesa-payment';
import { toast } from 'sonner';

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

const plans: Plan[] = [
  {
    tier: 'free',
    name: 'Free Farmer',
    price: 0,
    period: '/month',
    description: 'Get started with basic AI-powered farming tools.',
    icon: Leaf,
    color: 'from-emerald-400 to-emerald-600',
    features: [
      'Basic AI Chat (10 queries/day)',
      'Weather Alerts & Forecasts',
      'Market Price Updates',
      'Community Access',
      'Email Support',
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
    name: 'Premium Farmer',
    price: 299,
    period: '/month',
    description: 'Unlock the full power of AI for your farm.',
    icon: Sparkles,
    popular: true,
    color: 'from-emerald-500 to-emerald-700',
    features: [
      'Advanced AI Diagnosis (unlimited)',
      'Farm Analytics Dashboard',
      'Loan Recommendations',
      'Crop Advisor AI',
      'Data Export',
      'Priority Email & WhatsApp Support',
      'No Ads',
    ],
    notIncluded: [
      'Multi-farm Dashboard',
      'Group Analytics',
    ],
  },
  {
    tier: 'cooperative',
    name: 'Cooperative Plan',
    price: 999,
    period: '/month',
    description: 'Empower your cooperative with group intelligence.',
    icon: Building2,
    color: 'from-blue-500 to-blue-700',
    features: [
      'All Premium Features',
      'Multi-farm Dashboard',
      'Group Analytics & Reports',
      'Cooperative Management Tools',
      'Bulk Disease Diagnosis',
      'Dedicated Account Manager',
      'Custom Branding',
    ],
    notIncluded: [
      'White-label Options',
      'API Access',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    period: '/month',
    description: 'For NGOs, governments, and large-scale operations.',
    icon: Globe,
    color: 'from-purple-500 to-purple-700',
    features: [
      'All Cooperative Features',
      'NGO & Government Dashboards',
      'Large Scale Monitoring',
      'Custom Integrations',
      'API Access',
      'White-label Options',
      'Dedicated Support Team',
      'SLA Guarantee',
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ tier: string; name: string; price: number } | null>(null);
  const [showMpesa, setShowMpesa] = useState(false);

  const handleSubscribe = async (tier: string) => {
    setLoading(tier);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');

      if (data.requiresMpesa) {
        const plan = plans.find((p) => p.tier === tier);
        setSelectedPlan({ tier, name: plan?.name || '', price: plan?.price || 0 });
        setShowMpesa(true);
        toast.info('Enter your M-Pesa phone number to continue');
      } else {
        toast.success(data.message || 'Subscription activated!');
        router.push('/auth');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePaymentSuccess = (receipt: string) => {
    toast.success(`Payment successful! Receipt: ${receipt}`);
    setShowMpesa(false);
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12 text-center"
        >
          <Badge variant="primary" className="mb-3 sm:mb-4">Pricing</Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-balance">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-base sm:text-lg text-gray-500">
            Start free and upgrade as your farm grows. All plans include our core AI features.
            Pay securely with M-Pesa.
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
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full border-2 ${plan.popular ? 'border-emerald-500 shadow-xl' : 'border-gray-200 shadow-sm'} transition-all duration-200 hover:shadow-lg`}>
                  <CardHeader className={`rounded-t-lg bg-gradient-to-r ${plan.color} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-white/20 p-2">
                        <Icon className="h-6 w-6" />
                      </div>
                      {plan.price > 0 && (
                        <div className="rounded-full bg-white/20 p-1.5">
                          <Smartphone className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="mt-4 text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm text-white/80">{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                      </span>
                      {plan.price > 0 && <span className="text-sm text-white/70">{plan.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
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

                    <Button
                      className="mt-6 w-full"
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
                        'Get Started Free'
                      ) : (
                        <>
                          Subscribe via M-Pesa
                          <Smartphone className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {plan.price > 0 && (
                      <p className="mt-2 text-center text-xs text-gray-400">
                        Secure M-Pesa payment
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <MpesaPayment
          open={showMpesa}
          onOpenChange={setShowMpesa}
          amount={selectedPlan.price}
          planName={selectedPlan.name}
          tier={selectedPlan.tier}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
