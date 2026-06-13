'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sprout, AlertTriangle, Shield, ArrowRight, Leaf, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type CropOption = { id: string; name: string; emoji: string };
type DiagnosisResult = {
  crop: string; disease: string; confidence: number; risk: string;
  treatment: string; prevention: string; explanation: string; emoji: string;
  symptoms_matched: string;
};

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export function AiDemo() {
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/ai/demo').then((r) => r.json()).then((res) => {
      if (res.success) setCrops(res.crops);
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
        body: JSON.stringify({ cropType: selectedCrop, symptoms }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Diagnosis failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Badge variant="primary" className="mb-4">
            <Scan className="mr-1 h-3 w-3" />
            Try It Now — No Login Required
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            AI Crop Disease Diagnosis
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500">
            Select your crop, describe the symptoms, and get an instant AI-powered diagnosis with treatment recommendations.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Input */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Describe the Problem</h3>
              {crops.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Select Crop</label>
                  <div className="flex flex-wrap gap-2">
                    {crops.map((crop) => (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => { setSelectedCrop(crop.id); setResult(null); setError(''); }}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedCrop === crop.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{crop.emoji}</span> {crop.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Describe Symptoms</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Yellow streaks on lower leaves, wilting in afternoon heat..."
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Diagnosing...</>
                ) : (
                  <><Scan className="mr-2 h-4 w-4" /> Diagnose Now</>
                )}
              </Button>
              <p className="mt-2 text-xs text-gray-400">
                This is a demonstration. Results are simulated. One request at a time.
              </p>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Diagnosis Result</h3>
              {diagnosing && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-emerald-500" />
                  <p className="text-sm text-gray-500">Analyzing symptoms...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              {!diagnosing && !error && !result && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Sprout className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">Select a crop and describe symptoms to get a diagnosis.</p>
                </div>
              )}
              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{result.emoji}</span>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{result.disease}</div>
                        <div className="text-xs text-gray-500 capitalize">{result.crop}</div>
                      </div>
                    </div>
                    <Badge className={riskColors[result.risk] || 'bg-gray-100 text-gray-600'}>
                      {result.risk.toUpperCase()} Risk
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {Math.round(result.confidence * 100)}% match
                    </span>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700">Symptoms Detected</p>
                    <p className="text-sm text-emerald-600">{result.symptoms_matched || result.explanation}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-700">
                      <AlertTriangle className="mr-1 inline h-3 w-3 text-orange-500" /> Recommended Treatment
                    </p>
                    <p className="text-sm text-gray-600">{result.treatment}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-700">
                      <Shield className="mr-1 inline h-3 w-3 text-blue-500" /> Prevention
                    </p>
                    <p className="text-sm text-gray-600">{result.prevention}</p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      This is a demo diagnosis. Results are simulated. Always consult a local agricultural extension officer before applying treatments.
                    </p>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => { setResult(null); setSymptoms(''); }}>
                    Try Another Diagnosis
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
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-400">
            Full AI disease detection with image upload available for registered users.{' '}
            <a href="/auth?tab=register" className="text-emerald-600 underline hover:text-emerald-700">Join the Beta</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
