'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { getDashboardStats, getFarms, getSustainabilityScores } from '@/lib/db';
import type { DashboardStats, Farm, SustainabilityScore } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users, Globe, TreePine, TrendingUp, Target, Leaf, Heart, Droplets, Sun,
  ArrowRight, CheckCircle, BarChart3,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function HorizonImpactPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [scores, setScores] = useState<SustainabilityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      try {
        const [s, { data: f }, sc] = await Promise.all([
          getDashboardStats(),
          getFarms(),
          getSustainabilityScores(),
        ]);
        setStats(s);
        setFarms(f);
        setScores(sc);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b.overall_score, 0) / scores.length)
    : 0;
  const avgSoil = scores.length
    ? Math.round(scores.reduce((a, b) => a + b.soil_health, 0) / scores.length)
    : 0;
  const avgWater = scores.length
    ? Math.round(scores.reduce((a, b) => a + b.water_usage, 0) / scores.length)
    : 0;
  const avgBio = scores.length
    ? Math.round(scores.reduce((a, b) => a + b.biodiversity, 0) / scores.length)
    : 0;
  const avgCarbon = scores.length
    ? Math.round(scores.reduce((a, b) => a + b.carbon_footprint, 0) / scores.length)
    : 0;

  const regions = [...new Set(farms.map((f) => f.location))];
  const projectedFarmers = stats ? Math.round(stats.total_users * (1 + stats.user_growth / 100)) : 0;
  const projectedFarms = stats ? Math.round(stats.total_farms * 1.18) : 0;
  const foodSecurityImpact = regions.length >= 6 ? 92 : 60 + regions.length * 5;
  const carbonReduction = avgCarbon >= 70 ? 45 : Math.round(avgCarbon * 0.6);
  const waterSavings = avgWater >= 70 ? 38 : Math.round(avgWater * 0.5);
  const biodiversityGain = avgBio >= 60 ? 28 : Math.round(avgBio * 0.4);

  const sdgGoals = [
    { number: 2, label: t('horizon.sdg.zeroHunger'), color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { number: 13, label: t('horizon.sdg.climateAction'), color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { number: 15, label: t('horizon.sdg.lifeOnLand'), color: 'bg-green-100 text-green-800 border-green-200' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
            <Leaf className="absolute inset-0 m-auto h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-emerald-700">{t('horizon.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-8" initial="initial" animate="animate" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('horizon.title')}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t('horizon.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sdgGoals.map((g) => (
            <Badge key={g.number} className={`flex items-center gap-1 border ${g.color}`}>
              <Target className="h-3 w-3" />
              SDG {g.number}: {g.label}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Top-Level KPI Cards */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="primary" className="flex items-center gap-0.5 text-xs">
                <TrendingUp className="h-3 w-3" />
                {stats?.user_growth ?? 0}%
              </Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{(stats?.total_users ?? 0).toLocaleString()}</div>
              <p className="text-sm text-gray-500">{t('horizon.kpi.totalFarmers')}</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowRight className="h-3 w-3" />
              {t('horizon.kpi.projected', { value: projectedFarmers.toLocaleString() })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <Globe className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('horizon.kpi.regions', { count: regions.length })}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{(stats?.total_farms ?? 0).toLocaleString()}</div>
              <p className="text-sm text-gray-500">{t('horizon.kpi.activeFarms')}</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowRight className="h-3 w-3" />
              {t('horizon.kpi.projected', { value: projectedFarms.toLocaleString() })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
                <TreePine className="h-5 w-5" />
              </div>
              <Badge variant="primary" className="text-xs">
                {avgScore}% {t('horizon.kpi.overall')}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">{scores.length.toLocaleString()}</div>
              <p className="text-sm text-gray-500">{t('horizon.kpi.sustainabilityRecords')}</p>
            </div>
            <Progress value={avgScore} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-earth-50 p-2.5 text-earth-600">
                <Leaf className="h-5 w-5" />
              </div>
              <Badge variant="warning" className="text-xs">
                {t('horizon.kpi.impactScore')}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((avgSoil + avgWater + avgBio + (100 - avgCarbon)) / 4)}%
              </div>
              <p className="text-sm text-gray-500">{t('horizon.kpi.environmentalHealth')}</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle className="h-3 w-3" />
              {t('horizon.kpi.co2ReductionProjected', { value: carbonReduction })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SDG Alignment Banner */}
      <motion.div variants={fadeUp}>
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-green-50 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <Target className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('horizon.sdgAlignment.title')}</p>
                <p className="text-xs text-gray-500">{t('horizon.sdgAlignment.description')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {sdgGoals.map((g) => (
                <Badge key={g.number} className={`flex items-center gap-1 border px-3 py-1 text-xs ${g.color}`}>
                  SDG {g.number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Section */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="farmers" className="w-full">
          <TabsList className="mb-6 w-full justify-start gap-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-1">
            <TabsTrigger value="farmers" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              {t('horizon.tabs.farmers')}
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Heart className="h-4 w-4" />
              {t('horizon.tabs.communities')}
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TreePine className="h-4 w-4" />
              {t('horizon.tabs.environment')}
            </TabsTrigger>
          </TabsList>

          {/* === FARMERS TAB === */}
          <TabsContent value="farmers" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.farmers.farmerAdoption')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.farmers.farmerAdoptionDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{(stats?.total_users ?? 0).toLocaleString()}</span>
                    <span className="text-sm text-gray-400">{t('horizon.farmers.current')}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('horizon.farmers.projectedNextQuarter')}</span>
                      <span className="font-semibold text-emerald-700">{projectedFarmers.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(100, stats ? (stats.total_users / projectedFarmers) * 100 : 0)} className="h-2" />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    {t('horizon.farmers.growthNarrative', { growth: stats?.user_growth ?? 0 })}
                  </p>
                  <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-emerald-600">
                    {t('horizon.farmers.viewInsights')} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.farmers.farmNetwork')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.farmers.farmNetworkDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{(stats?.total_farms ?? 0).toLocaleString()}</span>
                    <span className="text-sm text-gray-400">{t('horizon.farmers.farms')}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('horizon.farmers.projectedNextQuarter')}</span>
                      <span className="font-semibold text-emerald-700">{projectedFarms.toLocaleString()}</span>
                    </div>
                    <Progress value={stats ? (stats.total_farms / projectedFarms) * 100 : 0} className="h-2" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {regions.slice(0, 6).map((r) => (
                      <Badge key={r} variant="outline" className="text-xs text-gray-600">{r}</Badge>
                    ))}
                    {regions.length > 6 && (
                      <Badge variant="outline" className="text-xs text-gray-400">+{regions.length - 6}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-green-50 p-2 text-green-600">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.farmers.sustainabilityScore')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.farmers.sustainabilityScoreDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{avgScore}%</span>
                    <span className="text-sm text-gray-400">{t('horizon.farmers.overall')}</span>
                  </div>
                  <Progress value={avgScore} className="mt-3 h-2" />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: t('horizon.farmers.soilHealth'), value: avgSoil },
                      { label: t('horizon.farmers.waterUsage'), value: avgWater },
                      { label: t('horizon.farmers.biodiversity'), value: avgBio },
                      { label: t('horizon.farmers.carbonFootprint'), value: 100 - avgCarbon },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{m.label}</span>
                          <span className="font-medium text-gray-800">{m.value}%</span>
                        </div>
                        <Progress value={m.value} className="mt-1 h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Farmer Impact Description */}
            <Card className="border-emerald-100 bg-gradient-to-br from-blue-50 to-emerald-50 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    {t('horizon.farmers.summary')}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600"
                     dangerouslySetInnerHTML={{
                       __html: t('horizon.farmers.summaryNarrative', {
                         farmers: `<strong>${stats?.total_users ?? 0}</strong>`,
                         regions: `<strong>${regions.length}</strong>`,
                         growth: `<strong>${stats?.user_growth ?? 0}%</strong>`,
                         projectedFarmers: `<strong>${projectedFarmers.toLocaleString()}</strong>`,
                         projectedFarms: `<strong>${projectedFarms.toLocaleString()}</strong>`,
                       })
                     }}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">{avgScore}%</div>
                    <p className="text-xs text-gray-500">{t('horizon.farmers.avgSustainability')}</p>
                  </div>
                  <div className="h-10 w-px bg-emerald-200" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats?.user_growth ?? 0}%</div>
                    <p className="text-xs text-gray-500">{t('horizon.farmers.growthRate')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === COMMUNITIES TAB === */}
          <TabsContent value="communities" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.communities.regionalCoverage')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.communities.regionalCoverageDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{regions.length}</span>
                    <span className="text-sm text-gray-400">{t('horizon.communities.regions')}</span>
                  </div>
                  <Progress value={Math.min(100, (regions.length / 10) * 100)} className="mt-3 h-2" />
                  <p className="mt-2 text-xs text-gray-500">
                    {t('horizon.communities.targetCoverage', { percent: Math.round((regions.length / 10) * 100) })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {regions.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <Sun className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.communities.foodSecurity')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.communities.foodSecurityDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{foodSecurityImpact}%</span>
                    <span className="text-sm text-gray-400">{t('horizon.communities.securityIndex')}</span>
                  </div>
                  <Progress value={foodSecurityImpact} className="mt-3 h-2" />
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {t('horizon.communities.foodSecurityNarrative', { regions: regions.length })}
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">{t('horizon.communities.sdg2Label')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                      <Heart className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.communities.wellbeing')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.communities.wellbeingDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('horizon.communities.farmersSupported')}</span>
                        <span className="font-semibold text-gray-900">{(stats?.total_users ?? 0).toLocaleString()}</span>
                      </div>
                      <Progress value={100} className="mt-1 h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('horizon.communities.diseaseResolution')}</span>
                        <span className="font-semibold text-gray-900">
                          {stats ? Math.round(stats.disease_resolution_rate * 100) : 0}%
                        </span>
                      </div>
                      <Progress value={stats ? Math.round(stats.disease_resolution_rate * 100) : 0} className="mt-1 h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('horizon.communities.activeFarms')}</span>
                        <span className="font-semibold text-gray-900">{(stats?.total_farms ?? 0).toLocaleString()}</span>
                      </div>
                      <Progress value={100} className="mt-1 h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Community Impact Description */}
            <Card className="border-emerald-100 bg-gradient-to-br from-purple-50 to-amber-50 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    {t('horizon.communities.summary')}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600"
                     dangerouslySetInnerHTML={{
                       __html: t('horizon.communities.summaryNarrative', {
                         regions: `<strong>${regions.length}</strong>`,
                         index: `<strong>${foodSecurityImpact}</strong>`,
                         resolution: `<strong>${stats ? Math.round(stats.disease_resolution_rate * 100) : 0}</strong>`,
                       })
                     }}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Badge variant="primary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                    <Target className="h-3.5 w-3.5" />
                    SDG 2
                  </Badge>
                  <Badge variant="default" className="flex items-center gap-1 bg-earth-100 px-3 py-1.5 text-sm text-earth-800">
                    <Target className="h-3.5 w-3.5" />
                    SDG 15
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ENVIRONMENT TAB === */}
          <TabsContent value="environment" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.environment.carbonReduction')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.environment.carbonReductionDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-700">{carbonReduction}%</span>
                    <span className="text-sm text-gray-400">{t('horizon.environment.reduction')}</span>
                  </div>
                  <Progress value={carbonReduction} className="mt-3 h-2" />
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {t('horizon.environment.carbonNarrative')}
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">{t('horizon.environment.sdg13Label')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.environment.waterSavings')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.environment.waterSavingsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-700">{waterSavings}%</span>
                    <span className="text-sm text-gray-400">{t('horizon.environment.savings')}</span>
                  </div>
                  <Progress value={waterSavings} className="mt-3 h-2" />
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {t('horizon.environment.waterNarrative')}
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">{t('horizon.environment.avgWaterScore', { value: avgWater })}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-green-50 p-2 text-green-600">
                      <TreePine className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{t('horizon.environment.biodiversity')}</CardTitle>
                  </div>
                  <CardDescription>{t('horizon.environment.biodiversityDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700">{biodiversityGain}%</span>
                    <span className="text-sm text-gray-400">{t('horizon.environment.improvement')}</span>
                  </div>
                  <Progress value={biodiversityGain} className="mt-3 h-2" />
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {t('horizon.environment.biodiversityNarrative')}
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">{t('horizon.environment.sdg15Label')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environment Detailed Metrics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                    {t('horizon.environment.scoreBreakdown')}
                  </CardTitle>
                  <CardDescription>{t('horizon.environment.scoreBreakdownDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: t('horizon.farmers.soilHealth'), value: avgSoil, icon: Sun, color: 'text-amber-600 bg-amber-50' },
                    { label: t('horizon.environment.waterUsageEfficiency'), value: avgWater, icon: Droplets, color: 'text-blue-600 bg-blue-50' },
                    { label: t('horizon.farmers.biodiversity'), value: avgBio, icon: TreePine, color: 'text-green-600 bg-green-50' },
                    { label: t('horizon.environment.carbonFootprintInverse'), value: 100 - avgCarbon, icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className={`rounded-md p-1 ${item.color}`}>
                            <item.icon className="h-3.5 w-3.5" />
                          </span>
                          {item.label}
                        </span>
                        <span className="font-semibold text-gray-900">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="h-4 w-4 text-emerald-500" />
                    {t('horizon.environment.goals')}
                  </CardTitle>
                  <CardDescription>{t('horizon.environment.goalsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: t('horizon.environment.goalCarbonNeutral'), current: carbonReduction, target: 60, unit: '% reduction' },
                    { label: t('horizon.environment.goalWaterConservation'), current: waterSavings, target: 50, unit: '% savings' },
                    { label: t('horizon.environment.goalBiodiversity'), current: biodiversityGain, target: 40, unit: '% improvement' },
                    { label: t('horizon.environment.goalSustainableFarms'), current: avgScore, target: 85, unit: '% avg score' },
                  ].map((g) => (
                    <div key={g.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-700">{g.label}</span>
                        <span className="font-medium text-gray-900">{g.current}% / {g.target}%</span>
                      </div>
                      <Progress value={(g.current / g.target) * 100} className="h-2" />
                      <p className="mt-0.5 text-xs text-gray-400">
                        {g.current >= g.target ? t('horizon.environment.targetAchieved') : t('horizon.environment.percentOfTarget', { percent: Math.round((g.current / g.target) * 100) })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Environment Impact Description */}
            <Card className="border-emerald-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    {t('horizon.environment.summary')}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600"
                     dangerouslySetInnerHTML={{
                       __html: t('horizon.environment.summaryNarrative', {
                         carbon: `<strong>${carbonReduction}</strong>`,
                         water: `<strong>${waterSavings}</strong>`,
                         biodiversity: `<strong>${biodiversityGain}</strong>`,
                         regions: regions.length,
                         sdg13: `<strong>SDG 13 (${t('horizon.sdg.climateAction')})</strong>`,
                         sdg15: `<strong>SDG 15 (${t('horizon.sdg.lifeOnLand')})</strong>`,
                       })
                     }}
                  />
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-2xl font-bold text-emerald-700">
                    <Leaf className="h-6 w-6" />
                    {avgScore}%
                  </div>
                  <p className="text-xs text-gray-500">{t('horizon.environment.planetHealthScore')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div variants={fadeUp}>
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-800 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{t('horizon.cta.title')}</h2>
              <p className="mt-1 text-sm text-emerald-100">
                {t('horizon.cta.subtitle')}
              </p>
            </div>
            <Button variant="secondary" size="lg" className="shrink-0 gap-2 bg-white text-emerald-800 hover:bg-emerald-50">
              <BarChart3 className="h-4 w-4" />
              {t('horizon.cta.viewFullReport')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
