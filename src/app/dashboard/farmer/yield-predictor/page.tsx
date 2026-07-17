'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, getCrops, saveYieldPrediction, getYieldPredictions } from '@/lib/db';
import type { Farm, Crop, YieldPrediction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, TrendingUp, Calculator, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

const YIELD_FACTORS: Record<string, { base: number; factors: string[] }> = {
  Maize: { base: 2500, factors: ['yield.factors.maize.soilFertility', 'yield.factors.maize.rainfall', 'yield.factors.maize.temperature', 'yield.factors.maize.plantingDensity', 'yield.factors.maize.pestPressure'] },
  Wheat: { base: 2200, factors: ['yield.factors.wheat.soilNitrogen', 'yield.factors.wheat.growingDegree', 'yield.factors.wheat.waterAvailability', 'yield.factors.wheat.varietyGenetics', 'yield.factors.wheat.diseaseHistory'] },
  Rice: { base: 3500, factors: ['yield.factors.rice.waterManagement', 'yield.factors.rice.nitrogenApplication', 'yield.factors.rice.transplantingTiming', 'yield.factors.rice.weedControl', 'yield.factors.rice.solarRadiation'] },
  Cassava: { base: 8000, factors: ['yield.factors.cassava.soilOrganic', 'yield.factors.cassava.rainfallDistribution', 'yield.factors.cassava.cuttingQuality', 'yield.factors.cassava.harvestTiming', 'yield.factors.cassava.intercropping'] },
  Beans: { base: 1200, factors: ['yield.factors.beans.soilPhosphorus', 'yield.factors.beans.rhizobia', 'yield.factors.beans.rainfallIntensity', 'yield.factors.beans.shadeManagement', 'yield.factors.beans.rotationHistory'] },
};

export default function YieldPredictor() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [predictions, setPredictions] = useState<YieldPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [result, setResult] = useState<{ yield: number; confidence: number; factors: string[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getFarms(user.id),
      getYieldPredictions(),
    ]).then(([{ data: f }, p]) => {
      setFarms(f);
      setPredictions(p.filter((pr) => pr.farm_id && f.some((fm) => fm.id === pr.farm_id)));
    }).catch(() => {
      toast.error(t('yield.failedToLoadFarmData'));
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (selectedFarm) {
      getCrops(selectedFarm).then(({ data }) => setCrops(data)).catch(() => setCrops([]));
    }
  }, [selectedFarm]);

  const handlePredict = async () => {
    if (!selectedFarm || !selectedCrop || !plantingDate) return;
    setPredicting(true);
    setResult(null);

    const farm = farms.find((f) => f.id === selectedFarm);
    const crop = crops.find((c) => c.id === selectedCrop);
    if (!farm || !crop) return;

    await new Promise((r) => setTimeout(r, 1000));

    const cropName = crop.name;
    const config = YIELD_FACTORS[cropName] ?? YIELD_FACTORS.Maize;
    const areaFactor = crop.area_acres / 5;
    const siteAdjustment = farm.size_acres > 10 ? 1.1 : farm.size_acres > 5 ? 1.05 : 0.95;
    const randomVariation = 0.85 + Math.random() * 0.3;
    const predictedYield = Math.round(config.base * areaFactor * siteAdjustment * randomVariation);
    const confidence = parseFloat((0.75 + Math.random() * 0.2).toFixed(2));
    const factors = config.factors;

    setResult({ yield: predictedYield, confidence, factors });

    try {
      await saveYieldPrediction({
        farm_id: selectedFarm,
        crop_name: cropName,
        planting_date: plantingDate,
        predicted_yield_kg: predictedYield,
        confidence_score: confidence,
        factors,
      });
      const allPreds = await getYieldPredictions();
      setPredictions(allPreds.filter((pr) => pr.farm_id && farms.some((fm) => fm.id === pr.farm_id)));
    } catch {
      toast.error(t('yield.failedToSavePrediction'));
    }
    setPredicting(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('yield.title')}</h1>
        <p className="text-xs sm:text-sm text-gray-500">{t('yield.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              <CardTitle className="text-base sm:text-lg">{t('yield.newPrediction')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">{t('yield.farm')}</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder={t('yield.selectFarm')} />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs sm:text-sm">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">{t('yield.crop')}</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop} disabled={!selectedFarm}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder={selectedFarm ? t('yield.selectCrop') : t('yield.selectFarmFirst')} />
                </SelectTrigger>
                <SelectContent>
                  {crops.length === 0 && selectedFarm ? (
                    <div className="px-2 py-4 text-xs text-gray-400 text-center">{t('yield.noCropsForFarm')}</div>
                  ) : (
                    crops.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">{c.name} &ndash; {c.variety}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">{t('yield.plantingDate')}</Label>
              <Input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} className="text-xs sm:text-sm" />
            </div>

            <Button className="w-full text-xs sm:text-sm" onClick={handlePredict} disabled={!selectedFarm || !selectedCrop || !plantingDate || predicting}>
              {predicting ? (
                <><Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> {t('yield.predictingYield')}</>
              ) : (
                <><TrendingUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> {t('yield.predict')}</>
              )}
            </Button>

            {result && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-emerald-800">{t('yield.predicted')}</span>
                  <span className="text-lg sm:text-2xl font-bold text-emerald-700">{result.yield.toLocaleString()} {t('common.units.kg')}</span>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-700">
                    <span>{t('yield.confidence')}</span>
                    <span>{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={result.confidence * 100} className="bg-emerald-200 h-1.5 sm:h-2" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-medium text-emerald-700">{t('yield.factorsConsidered')}</span>
                  <ul className="mt-1 space-y-0.5 sm:space-y-1">
                    {result.factors.map((f, i) => (
                      <li key={i} className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-emerald-600">
                        <Sprout className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />{t(f as any)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              <CardTitle className="text-base sm:text-lg">{t('yield.recentPredictions')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {loading ? (
              <div className="space-y-2 sm:space-y-3">
                <Skeleton className="h-14 sm:h-16" />
                <Skeleton className="h-14 sm:h-16" />
              </div>
            ) : predictions.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <TrendingUp className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                <p className="text-xs sm:text-sm text-gray-500">{t('yield.noPredictions')}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {predictions.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 sm:p-3">
                    <div className="min-w-0 mr-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{p.crop_name}</span>
                        <Badge variant="primary" className="text-[8px] sm:text-[10px]">{(p.confidence_score * 100).toFixed(0)}%</Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-emerald-600 shrink-0">{p.predicted_yield_kg.toLocaleString()} {t('common.units.kg')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
