'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, getCrops, getDiseaseReports, getYieldRecords, getMarketPrices } from '@/lib/db';
import { exportToCSV, exportToJSON } from '@/lib/export';
import type { Farm, Crop, DiseaseReport, YieldRecord, MarketPrice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileSpreadsheet, FileJson, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function ExportPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [yields, setYields] = useState<YieldRecord[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getFarms(user.id), getCrops(), getDiseaseReports(), getYieldRecords(), getMarketPrices()])
      .then(([{ data: f }, { data: c }, { data: d }, { data: y }, p]) => {
        setFarms(f); setCrops(c); setReports(d); setYields(y); setPrices(p);
        setLoading(false);
      });
  }, [user]);

  const handleExport = async (type: string, format: 'csv' | 'json') => {
    setExporting(type + '-' + format);
    await new Promise((r) => setTimeout(r, 500));

    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (type) {
      case 'farms':
        data = farms.map((f) => ({ [t('export.colName')]: f.name, [t('export.colLocation')]: f.location, [t('export.colSizeAcres')]: f.size_acres, [t('export.colSoilType')]: f.soil_type, [t('export.colStatus')]: f.status, [t('export.colCreated')]: formatDate(f.created_at) }));
        filename = 'farms-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'crops':
        data = crops.map((c) => ({ [t('export.colCropName')]: c.name, [t('export.colVariety')]: c.variety, [t('export.colAreaAcres')]: c.area_acres, [t('export.colStatus')]: c.status, [t('export.colExpectedYield')]: c.expected_yield_kg, [t('export.colActualYield')]: c.actual_yield_kg ?? '-', [t('export.colPlanted')]: formatDate(c.planting_date) }));
        filename = 'crops-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'disease':
        data = reports.map((r) => ({ [t('export.colCropType')]: r.crop_type, [t('export.colDisease')]: r.disease_prediction ?? '-', [t('export.colConfidence')]: r.confidence_score ? (r.confidence_score * 100).toFixed(1) + '%' : '-', [t('export.colRiskLevel')]: r.risk_level ?? '-', [t('export.colStatus')]: r.status, [t('export.colCreated')]: formatDate(r.created_at) }));
        filename = 'disease-reports-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'yields':
        data = yields.map((y) => ({ [t('export.colYieldKg')]: y.yield_kg, [t('export.colAreaAcres')]: y.area_acres, [t('export.colQualityRating')]: y.quality_rating ?? '-', [t('export.colNotes')]: y.notes ?? '-', [t('export.colHarvestDate')]: formatDate(y.harvest_date) }));
        filename = 'yield-records-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'prices':
        data = prices.map((p) => ({ [t('export.colCrop')]: p.crop, [t('export.colRegion')]: p.region, [t('export.colPricePerKg')]: t('common.currency') + ' ' + p.price_per_kg.toFixed(2), [t('export.colTrend')]: p.trend }));
        filename = 'market-prices-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
    }

    if (format === 'csv') exportToCSV(data, filename);
    else exportToJSON(data, filename);
    toast.success(t('export.exported').replace('{filename}', filename));
    setExporting(null);
  };

  const exportTypes = [
    { id: 'farms', label: t('export.farms'), icon: Table, desc: t('export.countFarms').replace('{count}', farms.length.toString()) },
    { id: 'crops', label: t('export.cropRecords'), icon: Table, desc: t('export.countCrops').replace('{count}', crops.length.toString()) },
    { id: 'disease', label: t('export.diseaseReports'), icon: Table, desc: t('export.countReports').replace('{count}', reports.length.toString()) },
    { id: 'yields', label: t('export.yieldRecords'), icon: Table, desc: t('export.yieldRecordsDesc', { count: yields.length }) },
    { id: 'prices', label: t('export.prices'), icon: Table, desc: t('export.countPrices').replace('{count}', prices.length.toString()) },
  ];

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('export.title')}</h1>
        <p className="text-xs sm:text-sm text-gray-500">{t('export.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 sm:h-40" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {exportTypes.map(({ id, label, icon: Icon, desc }) => (
              <Card key={id}>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                    <CardTitle className="text-xs sm:text-base">{label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                  <p className="text-[10px] sm:text-sm text-gray-500">{desc}</p>
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-7 sm:h-9" onClick={() => handleExport(id, 'csv')} disabled={exporting === id + '-csv'}>
                      {exporting === id + '-csv' ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <FileSpreadsheet className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />} {t('export.csv')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-7 sm:h-9" onClick={() => handleExport(id, 'json')} disabled={exporting === id + '-json'}>
                      {exporting === id + '-json' ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <FileJson className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />} {t('export.json')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base">{t('export.bulkExportTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Button size="sm" className="text-xs" onClick={() => {
                exportToJSON({ farms, crops, diseaseReports: reports, yieldRecords: yields, marketPrices: prices }, 'agripride-full-export-' + formatDate(new Date()).replace(/\s/g, '-') + '.json');
                toast.success(t('export.fullExportDownloaded'));
              }}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {t('export.exportAllJson')}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
