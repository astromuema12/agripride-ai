'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDiseaseReports, createDiseaseReport, getFarms } from '@/lib/db';
import type { DiseaseReport, Farm } from '@/types';
import { formatDate } from '@/lib/utils';
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
  FileSearch, AlertTriangle, Shield, Clock, BrainCircuit, Save, History,
  ImagePlus, X, Volume2, VolumeX, Loader2,
} from 'lucide-react';
import { speakText, stopSpeaking } from '@/lib/tts';

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Beans', 'Sorghum', 'Millet', 'Sweet Potato', 'Potato', 'Banana', 'Coffee', 'Tea', 'Sugarcane', 'Cotton', 'Tomato', 'Onion', 'Kale', 'Mango', 'Avocado', 'Groundnut', 'Sunflower', 'Cowpea'];

interface DiagnosisResult {
  disease: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  treatment: string;
  prevention: string;
  explanation: string;
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { variant: 'destructive' | 'warning' | 'primary' | 'default'; label: string }> = {
    critical: { variant: 'destructive', label: 'Critical' },
    high: { variant: 'destructive', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low: { variant: 'primary', label: 'Low' },
  };
  const { variant, label } = map[risk.toLowerCase()] ?? map.low;
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: DiseaseReport['status'] }) {
  const map: Record<string, { variant: 'warning' | 'secondary' | 'primary'; label: string }> = {
    submitted: { variant: 'warning', label: 'Submitted' },
    reviewed: { variant: 'secondary', label: 'Reviewed' },
    resolved: { variant: 'primary', label: 'Resolved' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function DiseaseDiagnosisPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropType, setCropType] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<{
    data: DiagnosisResult;
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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: userFarms }, { data: allReports }] = await Promise.all([
        getFarms(user.id),
        getDiseaseReports(),
      ]);
      setFarms(userFarms);
      setReports(allReports.filter((r) => r.user_id === user.id));
    };
    load();
  }, [user]);

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
      toast.error('Please select a crop type');
      return;
    }
    if (!symptoms.trim()) {
      toast.error('Please describe the symptoms');
      return;
    }

    setDiagnosing(true);
    setResult(null);

    try {
      const body: Record<string, string> = { cropType, symptoms };

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
        toast.success('Diagnosis complete');
      } else {
        toast.error(resultData.error || 'Diagnosis failed');
      }
    } catch {
      const { diagnoseDisease } = await import('@/lib/ai-agents');
      const fallback = diagnoseDisease(cropType);
      if (fallback.success && fallback.data) {
        setResult({
          data: fallback.data as DiagnosisResult,
          confidence_score: fallback.confidence_score,
          responsible_agent: fallback.responsible_agent,
          frameworks_used: fallback.frameworks_used,
          timestamp: fallback.timestamp,
        });
        toast.success('Offline diagnosis complete');
      } else {
        toast.error('An error occurred during diagnosis');
      }
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const report = await createDiseaseReport({
        farm_id: selectedFarmId || 'unknown',
        crop_id: 'unknown',
        user_id: user.id,
        crop_type: cropType,
        symptoms: symptoms,
        image_url: imagePreview ?? undefined,
        disease_prediction: result.data.disease,
        confidence_score: result.confidence_score ?? result.data.confidence,
        risk_level: result.data.risk,
        treatment: result.data.treatment,
        prevention: result.data.prevention,
        explanation: result.data.explanation,
        status: 'submitted',
      });
      setReports((prev) => [report, ...prev]);
      toast.success('Report saved successfully');
    } catch {
      toast.error('Failed to save report');
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

  const confidencePct = result
    ? Math.round((result.confidence_score ?? result.data.confidence) * 100)
    : 0;

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Disease Diagnosis</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          AI-powered diagnosis from symptoms and photos
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <span>Describe the Problem</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="crop-type">Crop Type</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="crop-type">
                    <SelectValue placeholder="Select a crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {farms.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="farm-select">Farm (optional)</Label>
                  <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                    <SelectTrigger id="farm-select">
                      <SelectValue placeholder="Select a farm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No farm selected</SelectItem>
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms Description</Label>
                <textarea
                  id="symptoms"
                  rows={4}
                  placeholder="Describe the symptoms you observe (e.g., leaf spots, wilting, discoloration, stunted growth...)"
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Photo</Label>
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <Image src={imagePreview ?? ''} alt="Crop preview" width={400} height={200} className="w-full h-48 object-cover" />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <ImagePlus className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload a photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (max 10MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleDiagnose}
                disabled={diagnosing}
              >
                {diagnosing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Diagnosing...</>
                ) : (
                  <><BrainCircuit className="mr-2 h-5 w-5" /> Diagnose</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {diagnosing && !result && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16">
                <Loader2 className="mb-3 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-emerald-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Analyzing{imagePreview ? ' photo and ' : ' '}symptoms...</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">AI is diagnosing the crop condition</p>
              </CardContent>
            </Card>
          )}

          {result ? (
            <>
              <Card className="border-emerald-200">
                <CardHeader className="bg-emerald-50 border-b border-emerald-100 rounded-t-xl px-3 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wide">Diagnosis Result</p>
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 break-words">{result.data.disease}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const text = result.data.disease + '. ' + result.data.treatment + '. ' + result.data.prevention;
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
                      <RiskBadge risk={result.data.risk} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 px-3 sm:px-6">
                  {imagePreview && (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <Image src={imagePreview} alt="Diagnosed crop" width={600} height={300} className="w-full max-h-64 object-contain bg-gray-50" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                      <span className={`text-sm font-bold ${
                        confidencePct >= 80 ? 'text-emerald-600' : confidencePct >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {confidencePct}%
                      </span>
                    </div>
                    <Progress value={confidencePct} className="h-2.5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-500">Risk Level:</span>
                    <RiskBadge risk={result.data.risk} />
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-4">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-1">Treatment</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">{result.data.treatment}</p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Prevention</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">{result.data.prevention}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">AI Explanation</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{result.data.explanation}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Responsible Agent: <strong className="text-gray-700">{result.responsible_agent}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      <span>Frameworks: {result.frameworks_used?.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Diagnosed: {result.timestamp ? formatDate(result.timestamp) : 'Just now'}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="secondary"
                    size="lg"
                    onClick={handleSaveReport}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Report'}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : !diagnosing ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <BrainCircuit className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to Diagnose</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Select crop type, describe symptoms, and optionally upload a photo. Click Diagnose for AI-powered analysis.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <span>Recent Diagnoses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center py-6 sm:py-8 text-center">
                  <FileSearch className="mb-2 h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                  <p className="text-xs sm:text-sm text-gray-500">No diagnoses yet</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Your saved reports will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {reports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 sm:p-3 transition-colors hover:bg-gray-100"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{report.crop_type}</span>
                          {report.risk_level && <RiskBadge risk={report.risk_level} />}
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-[10px] sm:text-sm text-gray-600 truncate">
                          {report.disease_prediction || <span className="italic text-gray-400">Pending analysis</span>}
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
