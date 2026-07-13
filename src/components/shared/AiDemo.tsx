'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sprout, AlertTriangle, Shield, Loader2, Scan, HelpCircle, ImagePlus, X, RefreshCw, Camera, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import type { GrowthStage, PossibleCause, Severity } from '@/types';

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
  imageAnalyzed?: boolean;
};

type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const COMPRESSION_MAX_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.82;

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

const severityColors: Record<string, string> = {
  mild: 'bg-[#f0f5f1] text-[#2d6a4f] border-[#dce8de] dark:bg-[#1a2e20] dark:text-[#5e9a6b]',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  severe: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > COMPRESSION_MAX_WIDTH) {
        height = Math.round((height * COMPRESSION_MAX_WIDTH) / width);
        width = COMPRESSION_MAX_WIDTH;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        COMPRESSION_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);

  useEffect(() => {
    fetch('/api/ai/demo').then((r) => r.json()).then((res) => {
      if (res.success) {
        setCrops(res.crops);
        if (res.growthStages) setGrowthStages(res.growthStages);
        if (res.usage) setUsage(res.usage);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCapturedFrame(null);
  }, [cameraStream]);

  const handleFile = useCallback(async (file: File) => {
    setImageError('');
    setCameraError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(t('landing.aiDemo.imageTypeError'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setImageError(t('landing.aiDemo.imageSizeError'));
      return;
    }
    const compressed = await compressImage(file);
    setImageFile(compressed);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(compressed);
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
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError('');
    setImageError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('landing.aiDemo.cameraUnavailable'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraActive(true);
      setCapturedFrame(null);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraError(t('landing.aiDemo.cameraDenied'));
    }
  }, [t]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
    setCapturedFrame(dataUrl);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  }, [cameraStream]);

  const confirmCapture = useCallback(async () => {
    if (!capturedFrame) return;
    const res = await fetch(capturedFrame);
    const blob = await res.blob();
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    setImageFile(file);
    setImagePreview(capturedFrame);
    setCapturedFrame(null);
  }, [capturedFrame]);

  const retakePhoto = useCallback(() => {
    setCapturedFrame(null);
    openCamera();
  }, [openCamera]);

  const cancelCamera = useCallback(() => {
    stopCamera();
    setCapturedFrame(null);
  }, [stopCamera]);

  const canDiagnose = selectedCrop && symptoms.length >= 5 && !diagnosing;

  const handleDiagnose = async () => {
    if (!selectedCrop || symptoms.length < 5 || diagnosing) return;
    setDiagnosing(true);
    setError('');
    setResult(null);
    setAnalyzingProgress(0);

    const progressInterval = setInterval(() => {
      setAnalyzingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(imageFile);
        });
      }

      setAnalyzingProgress(30);

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

      setAnalyzingProgress(85);
      const data = await res.json();

      setAnalyzingProgress(100);

      if (data.success) {
        setResult(data.data);
        if (data.usage) setUsage(data.usage);
      } else {
        setError(data.error || t('landing.aiDemo.diagnosisFailed'));
      }
    } catch {
      setError(t('landing.aiDemo.networkError'));
    } finally {
      clearInterval(progressInterval);
      setDiagnosing(false);
      setAnalyzingProgress(0);
    }
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
            {/* Image Capture Section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)] font-body">
                {t('landing.aiDemo.uploadImage')} <span className="text-[var(--muted-foreground)]/60 text-xs font-normal">({t('landing.aiDemo.optional')})</span>
              </label>

              {/* Camera Active State */}
              {cameraActive && !capturedFrame && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <div className="relative aspect-[4/3] bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 border-2 border-white/40 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={cancelCamera}
                      className="rounded-full bg-[var(--muted)] p-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-full bg-white p-1 shadow-lg ring-2 ring-white/80 hover:ring-[#c4704b] transition-all"
                    >
                      <Circle className="h-10 w-10 text-[#c4704b] fill-[#c4704b]/20" />
                    </button>
                    <div className="w-9" />
                  </div>
                </div>
              )}

              {/* Captured Frame Preview */}
              {capturedFrame && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <div className="aspect-[4/3]">
                    <img src={capturedFrame} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="flex items-center gap-1.5 rounded-md bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors font-body"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t('landing.aiDemo.retakePhoto')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmCapture}
                      className="flex items-center gap-1.5 rounded-md bg-[#1a3a2a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a3a2a]/90 transition-colors font-body dark:bg-[#5e9a6b] dark:text-[#1a1a1a]"
                    >
                      <Scan className="h-3 w-3" />
                      {t('landing.aiDemo.continueDiagnosis')}
                    </button>
                  </div>
                </div>
              )}

              {/* Image Preview (uploaded or confirmed capture) */}
              {!cameraActive && !capturedFrame && imagePreview && (
                <div className="relative rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <img src={imagePreview} alt="Plant preview" className="w-full h-48 object-cover" />
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate font-body">{imageFile?.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] font-body">{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors dark:bg-red-950 dark:hover:bg-red-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileInput} className="sr-only" />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="sr-only" />
                </div>
              )}

              {/* Upload / Take Photo Buttons */}
              {!cameraActive && !capturedFrame && !imagePreview && (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 ${
                      isDragging
                        ? 'border-[#2d6a4f] bg-[#f0f5f1] dark:border-[#5e9a6b] dark:bg-[#1a2e20]'
                        : 'border-[var(--border)] bg-[var(--muted)]/50 hover:border-[#2d6a4f]/40 hover:bg-[#f0f5f1]/50 dark:hover:border-[#5e9a6b]/40'
                    } p-6 text-center`}
                  >
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileInput} className="sr-only" />
                    <ImagePlus className={`mx-auto mb-2 h-7 w-7 ${isDragging ? 'text-[#2d6a4f] dark:text-[#5e9a6b]' : 'text-[var(--muted-foreground)]/40'}`} />
                    <p className="text-sm font-medium text-[var(--foreground)] font-body">
                      {t('landing.aiDemo.dropHint')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]/60 font-body">
                      {t('landing.aiDemo.supportedFormats')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]/60 font-body">{t('landing.aiDemo.or')}</span>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={openCamera}
                    >
                      <Camera className="mr-1.5 h-4 w-4" />
                      {t('landing.aiDemo.takePhoto')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="mr-1.5 h-4 w-4" />
                      {t('landing.aiDemo.quickCapture')}
                    </Button>
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="sr-only" />
                  </div>
                </>
              )}

              {(imageError || cameraError) && (
                <div className="mt-2">
                  {imageError && <p className="text-xs text-red-500 font-body">{imageError}</p>}
                  {cameraError && (
                    <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 dark:bg-amber-950 dark:border-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-700 font-body dark:text-amber-300">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="mt-1 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 font-body dark:text-amber-200"
                        >
                          {t('landing.aiDemo.useFileUpload')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
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
              ) : imageFile ? (
                <><Scan className="mr-2 h-4 w-4" /> {t('landing.aiDemo.diagnoseWithImage')}</>
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
                <div className="mt-4 w-full max-w-xs">
                  <Progress value={analyzingProgress} className="h-1.5" />
                  <p className="mt-1.5 text-[10px] text-center text-[var(--muted-foreground)]/60 font-body">
                    {analyzingProgress < 30
                      ? imageFile
                        ? t('landing.aiDemo.uploadingImage')
                        : t('landing.aiDemo.analyzingSymptoms')
                      : analyzingProgress < 80
                        ? imageFile
                          ? t('landing.aiDemo.analyzingImage')
                          : t('landing.aiDemo.analyzingSymptoms')
                        : t('landing.aiDemo.finalizing')}
                  </p>
                </div>
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
                  <div className="flex items-center gap-2 shrink-0">
                    {result.primaryDiagnosis?.severity && (
                      <Badge className={`${severityColors[result.primaryDiagnosis.severity] || 'bg-[var(--muted)]'} w-fit`}>
                        {t(`landing.aiDemo.severity.${result.primaryDiagnosis.severity}`)}
                      </Badge>
                    )}
                    <Badge className={`${uncertaintyColors[result.uncertaintyLevel] || 'bg-[var(--muted)] text-[var(--muted-foreground)]'} w-fit`}>
                      {t('landing.aiDemo.uncertaintyLabel', { level: result.uncertaintyLevel.toUpperCase() })}
                    </Badge>
                  </div>
                </div>

                {result.primaryDiagnosis?.description && (
                  <div className="rounded-md bg-[var(--muted)] p-3">
                    <p className="text-xs font-semibold text-[var(--foreground)] mb-1 font-body">{t('landing.aiDemo.observation')}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-body">{result.primaryDiagnosis.description}</p>
                  </div>
                )}

                {result.imageAnalyzed && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#2d6a4f] dark:text-[#5e9a6b] font-body">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2d6a4f] dark:bg-[#5e9a6b]" />
                    {t('landing.aiDemo.imageAnalyzed')}
                  </div>
                )}

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
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className="text-xs font-medium text-[var(--foreground)] font-body">{idx + 1}. {cause.name}</span>
                              <Badge className={`${likelihoodColors[cause.likelihood] || 'bg-[var(--muted)]'} text-[10px]`}>{cause.likelihood}</Badge>
                              {cause.severity && (
                                <Badge className={`${severityColors[cause.severity] || 'bg-[var(--muted)]'} text-[10px]`}>
                                  {t(`landing.aiDemo.severity.${cause.severity}`)}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0 font-body">{Math.round(cause.confidence * 100)}%</span>
                          </div>
                          {cause.description && (
                            <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)] font-body leading-relaxed">{cause.description}</p>
                          )}
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
