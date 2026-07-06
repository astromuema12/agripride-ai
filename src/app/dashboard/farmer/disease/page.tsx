'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDiseaseReports, createDiseaseReport, getFarms } from '@/lib/db';
import type { DiseaseReport, Farm, GrowthStage, PossibleCause } from '@/types';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import {
  FileSearch, Shield, Clock, BrainCircuit, Save, History,
  ImagePlus, X, Volume2, VolumeX, Loader2, HelpCircle, ChevronDown, ChevronUp,
  Camera, Upload, Sparkles, Scan,
} from 'lucide-react';
import { speakText, stopSpeaking } from '@/lib/tts';

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Beans', 'Sorghum', 'Millet', 'Sweet Potato', 'Potato', 'Banana', 'Coffee', 'Tea', 'Sugarcane', 'Cotton', 'Tomato', 'Onion', 'Kale', 'Mango', 'Avocado', 'Groundnut', 'Sunflower', 'Cowpea', 'Pineapple', 'Passion Fruit', 'Orange', 'Coconut', 'Cashew', 'Macadamia', 'Sesame', 'Green Grams', 'Pigeon Peas', 'Cabbage', 'Spinach', 'Carrot', 'Watermelon', 'Pawpaw', 'Barley', 'French Beans', 'Capsicum', 'Arrow Roots', 'Yam', 'Pyrethrum', 'Sisal'];



interface APIResponseData {
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
}

function RiskBadge({ risk }: { risk?: string }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'destructive' | 'warning' | 'primary' | 'default'; label: string }> = {
    critical: { variant: 'destructive', label: t('riskWidget.critical') },
    high: { variant: 'destructive', label: t('riskWidget.high') },
    medium: { variant: 'warning', label: t('riskWidget.medium') },
    low: { variant: 'primary', label: t('riskWidget.low') },
  };
  const { variant, label } = map[risk?.toLowerCase() ?? ''] ?? map.low;
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: DiseaseReport['status'] }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'warning' | 'secondary' | 'primary' | 'default'; label: string }> = {
    submitted: { variant: 'warning', label: t('visualDiagnosis.statusSubmitted') },
    reviewed: { variant: 'secondary', label: t('visualDiagnosis.statusReviewed') },
    resolved: { variant: 'primary', label: t('disease.resolved') },
  };
  const { variant, label } = map[status] ?? { variant: 'default' as const, label: status || t('common.unknown') };
  return <Badge variant={variant}>{label}</Badge>;
}

function UncertaintyBadge({ level }: { level?: string }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'warning' | 'secondary' | 'destructive'; label: string }> = {
    low: { variant: 'secondary', label: t('visualDiagnosis.uncertaintyLow') },
    moderate: { variant: 'warning', label: t('visualDiagnosis.uncertaintyModerate') },
    high: { variant: 'destructive', label: t('visualDiagnosis.uncertaintyHigh') },
  };
  const { variant, label } = map[level?.toLowerCase() ?? ''] ?? { variant: 'warning' as const, label: t('visualDiagnosis.uncertaintyModerate') };
  return <Badge variant={variant}>{label}</Badge>;
}

function LikelihoodBadge({ likelihood }: { likelihood?: string }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'primary' | 'warning' | 'destructive'; label: string }> = {
    high: { variant: 'primary', label: t('visualDiagnosis.likelihoodHigh') },
    medium: { variant: 'warning', label: t('visualDiagnosis.likelihoodMedium') },
    low: { variant: 'destructive', label: t('visualDiagnosis.likelihoodLow') },
  };
  const { variant, label } = map[likelihood?.toLowerCase() ?? ''] ?? { variant: 'warning' as const, label: likelihood || t('common.unknown') };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function DiseaseDiagnosisPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const cropLabels: Record<string, string> = {
    'Maize': t('crops.types.maize'),
    'Wheat': t('crops.types.wheat'),
    'Rice': t('crops.types.rice'),
    'Cassava': t('crops.types.cassava'),
    'Beans': t('crops.types.beans'),
    'Sorghum': t('crops.types.sorghum'),
    'Millet': t('crops.types.millet'),
    'Sweet Potato': t('crops.types.sweetPotato'),
    'Potato': t('crops.types.potato'),
    'Banana': t('crops.types.banana'),
    'Coffee': t('crops.types.coffee'),
    'Tea': t('crops.types.tea'),
    'Sugarcane': t('crops.types.sugarcane'),
    'Cotton': t('crops.types.cotton'),
    'Tomato': t('crops.types.tomato'),
    'Onion': t('crops.types.onion'),
    'Kale': t('crops.types.kale'),
    'Mango': t('crops.types.mango'),
    'Avocado': t('crops.types.avocado'),
    'Groundnut': t('crops.types.groundnut'),
    'Sunflower': t('crops.types.sunflower'),
    'Cowpea': t('crops.types.cowpea'),
    'Pineapple': t('crops.types.pineapple'),
    'Passion Fruit': t('crops.types.passionFruit'),
    'Orange': t('crops.types.orange'),
    'Coconut': t('crops.types.coconut'),
    'Cashew': t('crops.types.cashew'),
    'Macadamia': t('crops.types.macadamia'),
    'Sesame': t('crops.types.sesame'),
    'Green Grams': t('crops.types.greenGrams'),
    'Pigeon Peas': t('crops.types.pigeonPeas'),
    'Cabbage': t('crops.types.cabbage'),
    'Spinach': t('crops.types.spinach'),
    'Carrot': t('crops.types.carrot'),
    'Watermelon': t('crops.types.watermelon'),
    'Pawpaw': t('crops.types.pawpaw'),
    'Barley': t('crops.types.barley'),
    'French Beans': t('crops.types.frenchBeans'),
    'Capsicum': t('crops.types.capsicum'),
    'Arrow Roots': t('crops.types.arrowRoots'),
    'Yam': t('crops.types.yam'),
    'Pyrethrum': t('crops.types.pyrethrum'),
    'Sisal': t('crops.types.sisal'),
  };

  const [cropType, setCropType] = useState('');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('unknown');
  const [symptoms, setSymptoms] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<{
    data: APIResponseData;
    confidence_score?: number;
    responsible_agent?: string;
    frameworks_used?: string[];
    timestamp?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const growthStageOptions = useMemo(() => [
    { value: 'seedling' as GrowthStage, label: t('visualDiagnosis.growthStageSeedling') },
    { value: 'vegetative' as GrowthStage, label: t('visualDiagnosis.growthStageVegetative') },
    { value: 'flowering' as GrowthStage, label: t('visualDiagnosis.growthStageFlowering') },
    { value: 'fruiting' as GrowthStage, label: t('visualDiagnosis.growthStageFruiting') },
    { value: 'unknown' as GrowthStage, label: t('visualDiagnosis.growthStageUnknown') },
  ], [t]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [{ data: userFarms }, { data: allReports }] = await Promise.all([
          getFarms(user.id),
          getDiseaseReports(),
        ]);
        setFarms(userFarms);
        setReports(allReports.filter((r) => r.user_id === user.id));
      } catch {
        toast.error(t('common.somethingWentWrong'));
      }
    };
    load();
  }, [user, t]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error(t('visualDiagnosis.supportedFormats'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDiagnose = async () => {
    if (!cropType) {
      toast.error(t('visualDiagnosis.selectCrop'));
      return;
    }
    if (!symptoms.trim()) {
      toast.error(t('visualDiagnosis.describeSymptoms'));
      return;
    }

    setDiagnosing(true);
    setResult(null);

    try {
      const body: Record<string, string> = { cropType, symptoms, growthStage };

      if (imageFile) {
        body.imageBase64 = await fileToBase64(imageFile);
      }

      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('API error');

      const resultData = await response.json();

      if (resultData.success && resultData.data) {
        setResult({
          data: resultData.data,
          confidence_score: resultData.confidence_score,
          responsible_agent: resultData.responsible_agent,
          frameworks_used: resultData.frameworks_used,
          timestamp: resultData.timestamp,
        });
        toast.success(t('visualDiagnosis.diagnosisComplete'));
      } else {
        toast.error(resultData.error || t('common.somethingWentWrong'));
      }
    } catch {
      try {
        const { diagnoseDisease } = await import('@/lib/ai-agents');
        const fallback = diagnoseDisease(cropType, symptoms, growthStage);
        if (fallback.success && fallback.data) {
          setResult({
            data: fallback.data as APIResponseData,
            confidence_score: fallback.confidence_score,
            responsible_agent: fallback.responsible_agent,
            frameworks_used: fallback.frameworks_used,
            timestamp: fallback.timestamp,
          });
          toast.success(t('visualDiagnosis.offlineComplete'));
          return;
        }
      } catch {
      }
      toast.error(t('visualDiagnosis.diagnosisFailed'));
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const d = result.data;
      const primary = d.primaryDiagnosis;
      const report = await createDiseaseReport({
        farm_id: selectedFarmId || 'unknown',
        crop_id: 'unknown',
        user_id: user.id,
        crop_type: cropType,
        symptoms: symptoms,
        growth_stage: growthStage,
        image_url: imagePreview ?? undefined,
        disease_prediction: primary?.name ?? t('visualDiagnosis.uncertain'),
        possible_causes: d.possibleCauses,
        confidence_score: primary?.confidence ?? d.confidenceRange.max,
        risk_level: primary?.likelihood === 'high' ? 'high' : primary?.likelihood === 'medium' ? 'medium' : 'low',
        treatment: primary?.treatment,
        prevention: primary?.prevention,
        explanation: d.reasoning.summary,
        reasoning: JSON.stringify(d.reasoning),
        uncertainty_level: d.uncertaintyLevel,
        status: 'submitted',
      });
      setReports((prev) => [report, ...prev]);
      toast.success(t('visualDiagnosis.saved'));
    } catch {
      toast.error(t('visualDiagnosis.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking();
      setSpeakingId(id);
      speakText(text, () => setSpeakingId(null));
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-950 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium backdrop-blur-sm border border-white/10">
              <Scan className="w-3 h-3" />
              {t('visualDiagnosis.title')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('visualDiagnosis.title')}</h1>
          <p className="mt-2 text-emerald-100/80 max-w-xl">{t('visualDiagnosis.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="premium-card">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <span>{t('visualDiagnosis.describeProblem')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="crop-type">{t('visualDiagnosis.cropType')}</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="crop-type">
                    <SelectValue placeholder={t('visualDiagnosis.selectCrop')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>{cropLabels[crop]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="growth-stage">{t('visualDiagnosis.growthStage')}</Label>
                <Select value={growthStage} onValueChange={(v) => setGrowthStage(v as GrowthStage)}>
                  <SelectTrigger id="growth-stage">
                    <SelectValue placeholder={t('visualDiagnosis.growthStagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {growthStageOptions.map((gs) => (
                      <SelectItem key={gs.value} value={gs.value}>{gs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  {t('visualDiagnosis.growthStageHint')}
                </p>
              </div>

              {farms.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="farm-select">{t('visualDiagnosis.farmOptional')}</Label>
                  <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                    <SelectTrigger id="farm-select">
                      <SelectValue placeholder={t('visualDiagnosis.selectFarm')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('visualDiagnosis.noFarm')}</SelectItem>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="symptoms">{t('visualDiagnosis.symptoms')}</Label>
                <textarea
                  id="symptoms"
                  rows={4}
                  placeholder={t('visualDiagnosis.symptomsPlaceholder')}
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--card)] dark:border-[var(--border)] dark:placeholder:text-[var(--muted-foreground)]"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('visualDiagnosis.uploadPhoto')}</Label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 group dark:border-[var(--border)]">
                    <Image src={imagePreview ?? ''} alt={t('visualDiagnosis.cropPreview')} width={400} height={200} className="w-full h-52 object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
                      dragOver
                        ? 'border-emerald-400 bg-emerald-50 scale-[1.02] dark:border-emerald-600 dark:bg-emerald-950'
                        : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50 dark:border-[var(--border)] dark:bg-[var(--muted)] dark:hover:border-emerald-600 dark:hover:bg-emerald-950'
                    }`}
                  >
                    {dragOver ? (
                      <>
                        <Upload className="mb-3 h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('visualDiagnosis.dropHere')}</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('visualDiagnosis.uploadClick')}</p>
                        <p className="text-xs text-gray-400 mt-1 dark:text-gray-400">{t('visualDiagnosis.supportedFormats')}</p>
                        <div className="flex gap-2 mt-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:bg-[var(--card)] dark:border-[var(--border)]">
                            <Upload className="w-3.5 h-3.5" />
                            {t('visualDiagnosis.uploadPhoto')}
                          </span>
                          <span
                            onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:bg-[var(--card)] dark:border-[var(--border)]"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {t('visualDiagnosis.capturePhoto')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <Button
                className="w-full relative overflow-hidden group"
                size="lg"
                onClick={handleDiagnose}
                disabled={diagnosing}
              >
                {diagnosing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('visualDiagnosis.analyzing')}</>
                ) : (
                  <><BrainCircuit className="mr-2 h-5 w-5" /> {t('visualDiagnosis.diagnose')}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {diagnosing && !result && (
            <Card className="premium-card">
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16">
                <div className="relative">
                  <Loader2 className="mb-3 h-10 w-10 sm:h-12 sm:w-12 animate-spin text-emerald-500 dark:text-emerald-400" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('visualDiagnosis.analyzing')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 dark:text-gray-400">{t('visualDiagnosis.analyzingDesc')}</p>
              </CardContent>
            </Card>
          )}

          {result ? (
            <>
              <Card className="border-emerald-200 overflow-hidden premium-card dark:border-emerald-800">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 rounded-t-xl px-3 sm:px-6 dark:from-emerald-950 dark:to-green-950 dark:border-emerald-900">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wide">{t('visualDiagnosis.diagnosisResult')}</p>
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 break-words dark:text-white">
                        {result.data.primaryDiagnosis?.name ?? t('visualDiagnosis.uncertain')}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <UncertaintyBadge level={result.data.uncertaintyLevel} />
                        {result.data.primaryDiagnosis && (
                          <Badge variant="outline" className="text-xs">
                            {result.data.primaryDiagnosis.type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const text = result.data.possibleCauses.map(c => c.name).join(', ') + '. ' +
                            result.data.reasoning.summary;
                          handleSpeak(text, 'diagnosis');
                        }}
                        className="rounded-full p-1.5 sm:p-2 hover:bg-emerald-100 transition-colors"
                      >
                        {speakingId === 'diagnosis' ? (
                          <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 px-3 sm:px-6">
                  {imagePreview && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm dark:border-[var(--border)]">
                      <Image src={imagePreview} alt={t('visualDiagnosis.cropPreview')} width={600} height={300} className="w-full max-h-64 object-contain bg-gray-50 dark:bg-[var(--muted)]" unoptimized />
                    </div>
                  )}

                  {result.data.requestMoreInfo && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 dark:bg-amber-950 dark:border-amber-800">
                      <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 dark:text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('visualDiagnosis.moreInfo')}</p>
                        <p className="text-xs text-amber-700 mt-1 dark:text-amber-400">
                          {result.data.missingInfo?.join(', ') || t('visualDiagnosis.moreInfoDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.data.possibleCauses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        {t('visualDiagnosis.possibleCauses')}
                      </h3>
                      <div className="space-y-2">
                        {result.data.possibleCauses.slice(0, 5).map((cause, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl border p-3 transition-all ${
                              idx === 0 && cause.likelihood === 'high'
                                ? 'border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950'
                                : 'border-gray-200 bg-white hover:shadow-sm dark:border-[var(--border)] dark:bg-[var(--card)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {idx + 1}. {cause.name}
                                  </span>
                                  <LikelihoodBadge likelihood={cause.likelihood} />
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 capitalize dark:text-gray-400">{cause.type.replace('_', ' ')}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  {Math.round(cause.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                value={Math.round(cause.confidence * 100)}
                                className={`h-1.5 ${
                                  cause.likelihood === 'high' ? 'bg-emerald-100' :
                                  cause.likelihood === 'medium' ? 'bg-amber-100' :
                                  'bg-red-100'
                                }`}
                              />
                            </div>
                            {cause.treatment && idx < 2 && (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{t('visualDiagnosis.treatment')}: </span>
                                {cause.treatment.slice(0, 100)}{cause.treatment.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.data.primaryDiagnosis?.treatment && (
                    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 p-4 border border-emerald-100 dark:from-emerald-950 dark:to-green-950 dark:border-emerald-900">
                      <h3 className="text-sm font-semibold text-emerald-800 mb-1 dark:text-emerald-300">{t('visualDiagnosis.treatment')}</h3>
                      <p className="text-sm text-emerald-700 leading-relaxed dark:text-emerald-200">
                        {result.data.primaryDiagnosis.treatment}
                      </p>
                    </div>
                  )}

                  {result.data.primaryDiagnosis?.prevention && (
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-900">
                      <h3 className="text-sm font-semibold text-blue-800 mb-1 dark:text-blue-300">{t('visualDiagnosis.prevention')}</h3>
                      <p className="text-sm text-blue-700 leading-relaxed dark:text-blue-200">
                        {result.data.primaryDiagnosis.prevention}
                      </p>
                    </div>
                  )}

                  {!result.data.primaryDiagnosis && result.data.possibleCauses[0]?.treatment && (
                    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 p-4 border border-emerald-100 dark:from-emerald-950 dark:to-green-950 dark:border-emerald-900">
                      <h3 className="text-sm font-semibold text-emerald-800 mb-1 dark:text-emerald-300">{t('visualDiagnosis.treatment')}</h3>
                      <p className="text-sm text-emerald-700 leading-relaxed dark:text-emerald-200">
                        {result.data.possibleCauses[0].treatment}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 dark:bg-[var(--muted)] dark:border-[var(--border)]">
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('visualDiagnosis.aiReasoning')}</h3>
                      {showReasoning ? <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                    </button>
                    {showReasoning && (
                      <div className="mt-2 space-y-2 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
                        <p>{result.data.reasoning.summary}</p>
                        {result.data.reasoning.symptomInfluences.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 text-xs mt-2 dark:text-gray-300">{t('visualDiagnosis.symptomsDetected')}</p>
                            <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                              {result.data.reasoning.symptomInfluences.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.data.reasoning.uncertainties.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 text-xs mt-2 dark:text-gray-300">{t('visualDiagnosis.uncertainties')}</p>
                            <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1 text-amber-700 dark:text-amber-400">
                              {result.data.reasoning.uncertainties.map((u, i) => (
                                <li key={i}>{u}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.data.reasoning.growthStageNote && (
                          <p className="text-xs text-gray-500 mt-1 italic dark:text-gray-400">{result.data.reasoning.growthStageNote}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2 dark:border-[var(--border)]">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Shield className="h-3.5 w-3.5" />
                      <span>{t('visualDiagnosis.responsibleAgent')}: <strong className="text-gray-700 dark:text-gray-300">{result.responsible_agent}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      <span>{t('visualDiagnosis.frameworks')}: {result.frameworks_used?.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{t('visualDiagnosis.diagnosedAt')}: {result.timestamp ? formatDate(result.timestamp) : t('common.justNow')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      size="lg"
                      onClick={clearImage}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {t('visualDiagnosis.tryAgain')}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="secondary"
                      size="lg"
                      onClick={handleSaveReport}
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? t('common.saving') : t('visualDiagnosis.saveReport')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : !diagnosing ? (
            <Card className="h-full premium-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-gradient-to-br from-emerald-50 to-green-50 p-5 mb-4 shadow-sm dark:from-emerald-900 dark:to-green-900">
                  <Scan className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">{t('visualDiagnosis.readyToDiagnose')}</h3>
                <p className="text-sm text-gray-500 max-w-sm dark:text-gray-400">
                  {t('visualDiagnosis.readyDesc')}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="premium-card">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <span>{t('visualDiagnosis.recentDiagnoses')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center py-6 sm:py-8 text-center">
                  <FileSearch className="mb-2 h-6 w-6 sm:h-8 sm:w-8 text-gray-300 dark:text-gray-500" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('visualDiagnosis.noDiagnoses')}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 dark:text-gray-500">{t('visualDiagnosis.noDiagnosesDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {reports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-2.5 sm:p-3 transition-all hover:bg-gray-100 hover:shadow-sm dark:border-[var(--border)] dark:bg-[var(--muted)] dark:hover:bg-[var(--border)]"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{report.crop_type}</span>
                          {report.risk_level && <RiskBadge risk={report.risk_level} />}
                          {report.uncertainty_level && <UncertaintyBadge level={report.uncertainty_level} />}
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-[10px] sm:text-sm text-gray-600 truncate dark:text-gray-400">
                          {report.disease_prediction || <span className="italic text-gray-400 dark:text-gray-500">{t('visualDiagnosis.pending')}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {report.confidence_score !== undefined && (
                          <div className="hidden sm:flex items-center gap-2 justify-end mb-1">
                            <Progress value={Math.round(report.confidence_score * 100)} className="w-14 sm:w-16 h-1.5" />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500">{Math.round(report.confidence_score * 100)}%</span>
                          </div>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-400">{formatDate(report.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
