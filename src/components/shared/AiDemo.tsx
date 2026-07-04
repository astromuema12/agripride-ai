'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sprout, AlertTriangle, Shield, ArrowRight, Leaf, Loader2, Scan, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import type { GrowthStage, PossibleCause } from '@/types';

type CropOption = { id: string; name: string; emoji?: string };
type GrowthStageOption = { value: GrowthStage; label: string };

type DemoResult = {
  crop: string;
  primaryDiagnosis?: PossibleCause;
  possibleCauses: PossibleCause[];
  confidenceRange: { min: number; max: number };
  reasoning: {
    summary: string;
    symptomInfluences: string[];
    uncertainties: string[];
    growthStageNote?: string;
  };
  symptomCategories: Record<string, string[]>;
  growthStage: GrowthStage;
  uncertaintyLevel: 'low' | 'moderate' | 'high';
  requestMoreInfo: boolean;
  missingInfo?: string[];
};

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const likelihoodColors: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};

const uncertaintyColors: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

export function AiDemo() {
  const { t } = useI18n();
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [growthStages, setGrowthStages] = useState<GrowthStageOption[]>([
    { value: 'unknown', label: t('landing.aiDemo.growthStageNotSure') },
    { value: 'seedling', label: t('landing.aiDemo.growthStageSeedling') },
    { value: 'vegetative', label: t('landing.aiDemo.growthStageVegetative') },
    { value: 'flowering', label: t('landing.aiDemo.growthStageFlowering') },
    { value: 'fruiting', label: t('landing.aiDemo.growthStageFruiting') },
  ]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStage, setSelectedStage] = useState<GrowthStage>('unknown');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/ai/demo').then((r) => r.json()).then((res) => {
      if (res.success) {
        setCrops(res.crops);
        if (res.growthStages) setGrowthStages(res.growthStages);
      }
    }).catch(() => {});
  }, []);

  const handleDiagnose = async () => {
    if (!selectedCrop || symptoms.length < 5) return;
    setDiagnosing(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropType: selectedCrop, symptoms, growthStage: selectedStage }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || t('landing.aiDemo.diagnosisFailed'));
      }
    } catch {
      setError(t('landing.aiDemo.networkError'));
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Badge variant="primary" className="mb-3 sm:mb-4">
            <Scan className="mr-1 h-3 w-3" />
            {t('landing.aiDemo.badge')}
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-balance">
            {t('landing.aiDemo.heading')}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-gray-500">
            {t('landing.aiDemo.description')}
          </p>
        </motion.div>

        <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Input */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-gray-900">{t('landing.aiDemo.describeProblem')}</h3>
              {crops.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('landing.aiDemo.selectCrop')}</label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {crops.map((crop) => (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => { setSelectedCrop(crop.id); setResult(null); setError(''); }}
                        className={`flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors touch-manipulation ${
                          selectedCrop === crop.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {crop.emoji && <span>{crop.emoji}</span>} {crop.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('landing.aiDemo.growthStage')}</label>
                <select
                  value={selectedStage}
                  onChange={(e) => { setSelectedStage(e.target.value as GrowthStage); setResult(null); setError(''); }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {growthStages.map((gs) => (
                    <option key={gs.value} value={gs.value}>{gs.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">{t('landing.aiDemo.growthStageHint')}</p>
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('landing.aiDemo.describeSymptoms')}</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={t('landing.aiDemo.symptomsPlaceholder')}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDiagnose}
                disabled={diagnosing || !selectedCrop || symptoms.length < 5}
              >
                {diagnosing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('landing.aiDemo.diagnosing')}</>
                ) : (
                  <><Scan className="mr-2 h-4 w-4" /> {t('landing.aiDemo.diagnoseNow')}</>
                )}
              </Button>
              <p className="mt-2 text-xs text-gray-400">
                {t('landing.aiDemo.demoNotice')}
              </p>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-gray-900">{t('landing.aiDemo.diagnosisResult')}</h3>
              {diagnosing && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <Loader2 className="mb-3 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-emerald-500" />
                  <p className="text-sm text-gray-500">{t('landing.aiDemo.analyzingSymptoms')}</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <AlertTriangle className="mb-3 h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              {!diagnosing && !error && !result && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <Sprout className="mb-3 h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">{t('landing.aiDemo.emptyState')}</p>
                </div>
              )}
              {result && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        {result.primaryDiagnosis?.name ?? t('landing.aiDemo.uncertain')}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{result.crop} — {t('landing.aiDemo.stageLabel', { stage: result.growthStage })}</div>
                    </div>
                    <Badge className={`${uncertaintyColors[result.uncertaintyLevel] || 'bg-gray-100 text-gray-600'} w-fit`}>
                      {t('landing.aiDemo.uncertaintyLabel', { level: result.uncertaintyLevel.toUpperCase() })}
                    </Badge>
                  </div>

                  {result.requestMoreInfo && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">{t('landing.aiDemo.moreInfoTitle')}</p>
                        <p className="text-xs text-amber-700 mt-1">
                          {result.missingInfo?.join(', ') || t('landing.aiDemo.moreInfoDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.possibleCauses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">{t('landing.aiDemo.possibleCauses')}</p>
                      <div className="space-y-2">
                        {result.possibleCauses.slice(0, 4).map((cause, idx) => (
                          <div key={idx} className={`rounded-lg border p-2.5 ${
                            idx === 0 && cause.likelihood === 'high' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-medium text-gray-900">{idx + 1}. {cause.name}</span>
                                <Badge className={`${likelihoodColors[cause.likelihood] || 'bg-gray-100'} text-[10px]`}>
                                  {cause.likelihood}
                                </Badge>
                              </div>
                              <span className="text-[10px] font-semibold text-gray-500 shrink-0">
                                {Math.round(cause.confidence * 100)}%
                              </span>
                            </div>
                            <Progress value={Math.round(cause.confidence * 100)} className="h-1 mt-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">{t('landing.aiDemo.aiReasoning')}</p>
                    <p className="text-xs text-gray-600">{result.reasoning.summary}</p>
                    {result.reasoning.uncertainties.length > 0 && (
                      <div className="mt-1.5">
                        {result.reasoning.uncertainties.slice(0, 2).map((u, i) => (
                          <p key={i} className="text-[10px] text-amber-700 mt-0.5">⚠ {u}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {result.primaryDiagnosis?.treatment && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-700">
                        <AlertTriangle className="mr-1 inline h-3 w-3 text-orange-500" /> {t('landing.aiDemo.recommendedTreatment')}
                      </p>
                      <p className="text-sm text-gray-600">{result.primaryDiagnosis.treatment}</p>
                    </div>
                  )}

                  {result.primaryDiagnosis?.prevention && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-700">
                        <Shield className="mr-1 inline h-3 w-3 text-blue-500" /> {t('landing.aiDemo.prevention')}
                      </p>
                      <p className="text-sm text-gray-600">{result.primaryDiagnosis.prevention}</p>
                    </div>
                  )}

                  {!result.primaryDiagnosis && result.possibleCauses[0]?.treatment && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-700">
                        <AlertTriangle className="mr-1 inline h-3 w-3 text-orange-500" /> {t('landing.aiDemo.suggestedTreatment')}
                      </p>
                      <p className="text-sm text-gray-600">{result.possibleCauses[0].treatment}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      {t('landing.aiDemo.disclaimer')}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => { setResult(null); setSymptoms(''); }}>
                    {t('landing.aiDemo.tryAnother')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 text-center"
        >
          <p className="text-xs sm:text-sm text-gray-400">
            {t('landing.aiDemo.fullVersion')}{' '}
            <a href="/auth?tab=register" className="text-emerald-600 underline hover:text-emerald-700">{t('landing.aiDemo.getStarted')}</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
