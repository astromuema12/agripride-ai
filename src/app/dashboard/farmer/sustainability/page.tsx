'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, getSustainabilityScores } from '@/lib/db';
import type { SustainabilityScore } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Leaf, Droplets, Bug, Wind, Lightbulb,
  ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface SubScore {
  key: keyof Omit<SustainabilityScore, 'id' | 'farm_id' | 'overall_score' | 'recorded_at'>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tip: string;
}

function CircularScore({ score, size = 160 }: { score: number; size?: number }) {
  const { t } = useI18n();
  const pct = Math.round(score * 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? '#059669' : pct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900">{pct}%</span>
        <span className="text-xs font-medium text-gray-500">{t('sustainability.overallScore')}</span>
      </div>
    </div>
  );
}

function TrendBadge({ score }: { score: number }) {
  const { t } = useI18n();
  if (score >= 0.7) return <Badge variant="primary" className="gap-1"><ArrowUp className="h-3 w-3" />{t('sustainability.badges.good')}</Badge>;
  if (score >= 0.4) return <Badge variant="warning" className="gap-1"><Minus className="h-3 w-3" />{t('sustainability.badges.fair')}</Badge>;
  return <Badge variant="destructive" className="gap-1"><ArrowDown className="h-3 w-3" />{t('sustainability.badges.needsWork')}</Badge>;
}

export default function SustainabilityPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [scores, setScores] = useState<SustainabilityScore[]>([]);
  const [loading, setLoading] = useState(true);

  const SUB_SCORES: SubScore[] = [
    {
      key: 'soil_health',
      label: t('sustainability.subScores.soilHealth.label'),
      icon: Leaf,
      color: 'text-emerald-600',
      tip: t('sustainability.subScores.soilHealth.tip'),
    },
    {
      key: 'water_usage',
      label: t('sustainability.subScores.waterUsage.label'),
      icon: Droplets,
      color: 'text-blue-600',
      tip: t('sustainability.subScores.waterUsage.tip'),
    },
    {
      key: 'biodiversity',
      label: t('sustainability.subScores.biodiversity.label'),
      icon: Bug,
      color: 'text-amber-600',
      tip: t('sustainability.subScores.biodiversity.tip'),
    },
    {
      key: 'carbon_footprint',
      label: t('sustainability.subScores.carbonFootprint.label'),
      icon: Wind,
      color: 'text-purple-600',
      tip: t('sustainability.subScores.carbonFootprint.tip'),
    },
  ];

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const { data: farms } = await getFarms(user.id);
        const farmIds = farms.map((f) => f.id);
        const allScores = await getSustainabilityScores();
        setScores(allScores.filter((s) => farmIds.includes(s.farm_id)));
      } catch (err) {
        toast.error(t('errors.general'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const latestScore = useMemo(() => {
    if (scores.length === 0) return null;
    return scores.reduce((latest, s) =>
      new Date(s.recorded_at) > new Date(latest.recorded_at) ? s : latest
    );
  }, [scores]);

  const chartData = useMemo(() => {
    return [...scores]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((s) => ({
        date: new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(s.overall_score * 100),
        soil: Math.round(s.soil_health * 100),
        water: Math.round(s.water_usage * 100),
        biodiversity: Math.round(s.biodiversity * 100),
        carbon: Math.round(s.carbon_footprint * 100),
      }));
  }, [scores]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center justify-center py-12">
          <div className="h-40 w-40 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sustainability.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('sustainability.subtitle')}
          </p>
        </div>
        {latestScore && <TrendBadge score={latestScore.overall_score} />}
      </div>

      {!latestScore ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="rounded-full bg-emerald-50 p-4 mb-4">
              <Leaf className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('sustainability.noDataTitle')}</h3>
            <p className="text-sm text-gray-500">
              {t('sustainability.noDataDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col items-center py-4">
            <CircularScore score={latestScore.overall_score} size={160} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SUB_SCORES.map(({ key, label, icon: Icon, color, tip }) => {
              const value = latestScore[key] ?? 0;
              const pct = Math.round(value * 100);
              return (
                <Card key={key}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <span className="font-medium text-gray-900">{label}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50 p-2.5">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <p className="text-xs text-emerald-800 leading-relaxed">{tip}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('sustainability.historicalScores')}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {t('sustainability.overallScore')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      {t('sustainability.subScores.soilHealth.label')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      {t('sustainability.subScores.waterUsage.label')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {t('sustainability.subScores.biodiversity.label')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      {t('sustainability.subScores.carbonFootprint.label')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 4 }} name={t('sustainability.overallScore')} />
                    <Line type="monotone" dataKey="soil" stroke="#6ee7b7" strokeWidth={1.5} dot={false} name={t('sustainability.subScores.soilHealth.label')} />
                    <Line type="monotone" dataKey="water" stroke="#60a5fa" strokeWidth={1.5} dot={false} name={t('sustainability.subScores.waterUsage.label')} />
                    <Line type="monotone" dataKey="biodiversity" stroke="#fbbf24" strokeWidth={1.5} dot={false} name={t('sustainability.subScores.biodiversity.label')} />
                    <Line type="monotone" dataKey="carbon" stroke="#a78bfa" strokeWidth={1.5} dot={false} name={t('sustainability.subScores.carbonFootprint.label')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
