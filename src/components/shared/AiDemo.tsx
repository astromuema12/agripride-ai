'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sprout, AlertTriangle, Shield, Loader2, Scan, HelpCircle, ImagePlus, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const likelihoodColors: Record<string, string> = {
  high: 'bg-[#f0f5f1] text-[#2d6a4f] border-[#dce8de] dark:bg-[#1a2e20] dark:text-[#5e9a6b] dark:border-[#2a3a2a]',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200',
};

const uncertaintyColors: Record<string, string> = {
  low: 'bg-[#f0f5f1] text-[#2d6a4f] dark:bg-[#1a2e20] dark:text-[#5e9a6b]',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    fetch('/api/ai/demo').then((r) => r.json()).then((res) => {
      if (res.success) {
        setCrops(res.crops);
        if (res.growthStages) setGrowthStages(res.growthStages);
        if (res.usage) setUsage(res.usage);
      }
    }).catch(() => {});
  }, []);

  const handleFile = useCallback((file: File) => {
    setImageError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(t('landing.aiDemo.imageTypeError'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setImageError(t('landing.aiDemo.imageSizeError'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const canDiagnose = selectedCrop && symptoms.length >= 5 && imageFile && !diagnosing;

  const handleDiagnose = async () => {
    if (!selectedCrop || symptoms.length < 5 || !imageFile) return;
    setDiagnosing(true);
    setError('');
    setResult(null);
    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(imageFile);
        });
      }

      const res = await fetch('/api/ai/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropType: selectedCrop,
          symptoms,
          growthStage: selectedStage,
          image: imageBase64,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        if (data.usage) setUsage(data.usage);
      } else {
        setError(data.error || t('landing.aiDemo.diagnosisFailed'));
      }
    } catch { setError(t('landing.aiDemo.networkError')); } finally { setDiagnosing(false); }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms('');
    removeImage();
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#c4704b]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c4704b] font-body">
              <Scan className="inline h-3 w-3 mr-1" />
              {t('landing.aiDemo.badge')}
            </span>
          </div>
          <h2 className="display-lg text-[var(--foreground)]">
            {t('landing.aiDemo.heading')}
          </h2>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-[var(--muted-foreground)] font-body">
            {t('landing.aiDemo.description')}
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Input — 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Image Upload Zone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)] font-body">
                {t('landing.aiDemo.uploadImage')} <span className="text-[#c4704b]">*</span>
              </label>
              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 ${
                    isDragging
                      ? 'border-[#2d6a4f] bg-[#f0f5f1] dark:border-[#5e9a6b] dark:bg-[#1a2e20]'
                      : 'border-[var(--border)] bg-[var(--muted)]/50 hover:border-[#2d6a4f]/40 hover:bg-[#f0f5f1]/50 dark:hover:border-[#5e9a6b]/40'
                  } p-8 text-center`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                  <ImagePlus className={`mx-auto mb-3 h-8 w-8 ${isDragging ? 'text-[#2d6a4f] dark:text-[#5e9a6b]' : 'text-[var(--muted-foreground)]/40'}`} />
                  <p className="text-sm font-medium text-[var(--foreground)] font-body">
                    {t('landing.aiDemo.dropHint')}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]/60 font-body">
                    {t('landing.aiDemo.supportedFormats')}
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Plant preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate font-body">{imageFile?.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] font-body">{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="rounded-md bg-[var(--muted)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors dark:bg-red-950 dark:hover:bg-red-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                </div>
              )}
              {imageError && (
                <p className="mt-1.5 text-xs text-red-500 font-body">{imageError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)] font-body">{t('landing.aiDemo.selectCrop')}</label>
              {crops.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {crops.map((crop) => (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => { setSelectedCrop(crop.id); setResult(null); setError(''); }}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium font-body transition-all touch-manipulation ${
                        selectedCrop === crop.id
                          ? 'bg-[#1a3a2a] text-white dark:bg-[#5e9a6b] dark:text-[#1a1a1a]'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {crop.emoji && <span>{crop.emoji}</span>} {crop.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)] font-body">{t('landing.aiDemo.growthStage')}</label>
              <select
                value={selectedStage}
                onChange={(e) => { setSelectedStage(e.target.value as GrowthStage); setResult(null); setError(''); }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm font-body text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              >
                {growthStages.map((gs) => (
                  <option key={gs.value} value={gs.value}>{gs.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] font-body">{t('landing.aiDemo.growthStageHint')}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)] font-body">{t('landing.aiDemo.describeSymptoms')}</label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm font-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                placeholder={t('landing.aiDemo.symptomsPlaceholder')}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            {/* Usage Counter */}
            {usage && (
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2.5">
                <span className="text-xs text-[var(--muted-foreground)] font-body">
                  {t('landing.aiDemo.analysesRemaining', { remaining: usage.remaining, limit: usage.limit })}
                </span>
                {usage.remaining <= 1 && (
                  <span className="text-[10px] text-[#c4704b] font-medium font-body">
                    {t('landing.aiDemo.limitAlmostReached')}
                  </span>
                )}
              </div>
            )}

            <Button className="w-full" onClick={handleDiagnose} disabled={!canDiagnose || !!error}>
              {diagnosing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('landing.aiDemo.diagnosing')}</>
              ) : (
                <><Scan className="mr-2 h-4 w-4" /> {t('landing.aiDemo.diagnoseNow')}</>
              )}
            </Button>
            <p className="text-xs text-[var(--muted-foreground)]/60 font-body">{t('landing.aiDemo.demoNotice')}</p>
          </motion.div>

          {/* Result — 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
          >
            <h3 className="mb-4 font-display text-lg text-[var(--foreground)]">{t('landing.aiDemo.diagnosisResult')}</h3>

            {diagnosing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#2d6a4f] dark:text-[#5e9a6b]" />
                <p className="text-sm text-[var(--muted-foreground)] font-body">{t('landing.aiDemo.analyzingSymptoms')}</p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" />
                <p className="text-sm text-red-500 font-body">{error}</p>
                {error.includes(t('landing.aiDemo.limitReached')) && (
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/pricing'}>
                    {t('landing.aiDemo.viewPlans')}
                  </Button>
                )}
              </div>
            )}
            {!diagnosing && !error && !result && (
              <div className="flex flex-col items-center justify-center py-12">
                <Sprout className="mb-3 h-8 w-8 text-[var(--border)]" />
                <p className="text-sm text-[var(--muted-foreground)] font-body">{t('landing.aiDemo.emptyState')}</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-lg text-[var(--foreground)]">{result.primaryDiagnosis?.name ?? t('landing.aiDemo.uncertain')}</div>
                    <div className="text-xs text-[var(--muted-foreground)] capitalize font-body">{result.crop} — {t('landing.aiDemo.stageLabel', { stage: result.growthStage })}</div>
                  </div>
                  <Badge className={`${uncertaintyColors[result.uncertaintyLevel] || 'bg-[var(--muted)] text-[var(--muted-foreground)]'} w-fit`}>
                    {t('landing.aiDemo.uncertaintyLabel', { level: result.uncertaintyLevel.toUpperCase() })}
                  </Badge>
                </div>

                {result.requestMoreInfo && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 font-body">{t('landing.aiDemo.moreInfoTitle')}</p>
                      <p className="text-xs text-amber-700 mt-1 font-body">{result.missingInfo?.join(', ') || t('landing.aiDemo.moreInfoDesc')}</p>
                    </div>
                  </div>
                )}

                {result.possibleCauses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)] mb-2 font-body">{t('landing.aiDemo.possibleCauses')}</p>
                    <div className="space-y-2">
                      {result.possibleCauses.slice(0, 4).map((cause, idx) => (
                        <div key={idx} className={`rounded-md border p-3 ${idx === 0 && cause.likelihood === 'high' ? likelihoodColors.high : 'border-[var(--border)]'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-medium text-[var(--foreground)] font-body">{idx + 1}. {cause.name}</span>
                              <Badge className={`${likelihoodColors[cause.likelihood] || 'bg-[var(--muted)]'} text-[10px]`}>{cause.likelihood}</Badge>
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0 font-body">{Math.round(cause.confidence * 100)}%</span>
                          </div>
                          <Progress value={Math.round(cause.confidence * 100)} className="h-1 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-md bg-[var(--muted)] p-3">
                  <p className="text-xs font-semibold text-[var(--foreground)] mb-1 font-body">{t('landing.aiDemo.aiReasoning')}</p>
                  <p className="text-xs text-[var(--muted-foreground)] font-body">{result.reasoning.summary}</p>
                </div>

                {result.primaryDiagnosis?.treatment && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--foreground)] font-body">
                      <AlertTriangle className="mr-1 inline h-3 w-3 text-[#c4704b]" /> {t('landing.aiDemo.recommendedTreatment')}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] font-body">{result.primaryDiagnosis.treatment}</p>
                  </div>
                )}

                {result.primaryDiagnosis?.prevention && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--foreground)] font-body">
                      <Shield className="mr-1 inline h-3 w-3 text-[#2d6a4f] dark:text-[#5e9a6b]" /> {t('landing.aiDemo.prevention')}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] font-body">{result.primaryDiagnosis.prevention}</p>
                  </div>
                )}

                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700 font-body">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    {t('landing.aiDemo.disclaimer')}
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={handleReset}>
                  {t('landing.aiDemo.tryAnother')}
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 sm:mt-10 text-center">
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-body">
            {t('landing.aiDemo.fullVersion')}{' '}
            <a href="/auth?tab=register" className="text-[#2d6a4f] dark:text-[#5e9a6b] underline underline-offset-2 hover:text-[#1a3a2a] dark:hover:text-[#8ab592]">{t('landing.aiDemo.getStarted')}</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
