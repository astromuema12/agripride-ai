'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { diagnoseDisease } from '@/lib/ai-agents';
import { getDiseaseReports, createDiseaseReport, getFarms } from '@/lib/db';
import type { DiseaseReport, Farm } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileSearch, AlertTriangle, Shield, Clock, BrainCircuit, Upload, Save, History,
} from 'lucide-react';

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Beans', 'Coffee', 'Tea', 'Cotton', 'Sorghum', 'Millet', 'Groundnuts', 'Sunflower', 'Sugarcane', 'Sweet Potato'];

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

  const [cropType, setCropType] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<{
    data: DiagnosisResult;
    confidence_score?: number;
    responsible_agent?: string;
    frameworks_used?: string[];
    timestamp?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [userFarms, allReports] = await Promise.all([
        getFarms(user.id),
        getDiseaseReports(),
      ]);
      setFarms(userFarms);
      setReports(allReports.filter((r) => r.user_id === user.id));
    };
    load();
  }, [user]);

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
      const response = diagnoseDisease(cropType, symptoms);
      if (response.success && response.data) {
        setResult({
          data: response.data as DiagnosisResult,
          confidence_score: response.confidence_score,
          responsible_agent: response.responsible_agent,
          frameworks_used: response.frameworks_used,
          timestamp: response.timestamp,
        });
        toast.success('Diagnosis complete');
      } else {
        toast.error(response.error || 'Diagnosis failed');
      }
    } catch {
      toast.error('An error occurred during diagnosis');
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
        image_url: imageFile ? URL.createObjectURL(imageFile) : undefined,
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

  const confidencePct = result
    ? Math.round((result.confidence_score ?? result.data.confidence) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Disease Diagnosis</h1>
        <p className="text-sm text-gray-500">
          Use AI-powered diagnosis to identify crop diseases from symptoms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Diagnosis Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSearch className="h-5 w-5 text-emerald-600" />
                Describe the Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Crop Type */}
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

              {/* Farm (optional context) */}
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

              {/* Symptoms */}
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms Description</Label>
                <textarea
                  id="symptoms"
                  rows={5}
                  placeholder="Describe the symptoms you observe on the crop (e.g., leaf spots, wilting, discoloration, stunted growth...)"
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Image (optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                  {imageFile && (
                    <span className="text-xs text-emerald-600 whitespace-nowrap">
                      {imageFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Supported: JPG, PNG, WEBP (max 10MB)</p>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleDiagnose}
                disabled={diagnosing}
              >
                {diagnosing ? (
                  <>Diagnosing...</>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    Diagnose
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {result ? (
            <>
              {/* Diagnosis Result */}
              <Card className="border-emerald-200">
                <CardHeader className="bg-emerald-50 border-b border-emerald-100 rounded-t-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Diagnosis Result</p>
                      <h2 className="text-2xl font-bold text-gray-900 mt-1">{result.data.disease}</h2>
                    </div>
                    <RiskBadge risk={result.data.risk} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  {/* Confidence */}
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

                  {/* Risk Level */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-500">Risk Level:</span>
                    <RiskBadge risk={result.data.risk} />
                  </div>

                  {/* Treatment */}
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-1">Treatment</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">{result.data.treatment}</p>
                  </div>

                  {/* Prevention */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Prevention</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">{result.data.prevention}</p>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">AI Explanation</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{result.data.explanation}</p>
                  </div>

                  {/* AI Governance */}
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

                  {/* Save Report */}
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
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <BrainCircuit className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to Diagnose</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Fill in the crop type and symptoms on the left, then click Diagnose to get an AI-powered analysis.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-emerald-600" />
                Recent Diagnoses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileSearch className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No diagnoses yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your saved reports will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{report.crop_type}</span>
                          {report.risk_level && <RiskBadge risk={report.risk_level} />}
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {report.disease_prediction || <span className="italic text-gray-400">Pending analysis</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        {report.confidence_score !== undefined && (
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Progress value={Math.round(report.confidence_score * 100)} className="w-16 h-1.5" />
                            <span className="text-xs font-medium text-gray-500">{Math.round(report.confidence_score * 100)}%</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(report.created_at)}</p>
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
