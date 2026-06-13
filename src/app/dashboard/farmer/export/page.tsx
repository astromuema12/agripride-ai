'use client';

import { useState, useEffect } from 'react';
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
        data = farms.map((f) => ({ Name: f.name, Location: f.location, 'Size (acres)': f.size_acres, 'Soil Type': f.soil_type, Status: f.status, Created: formatDate(f.created_at) }));
        filename = 'farms-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'crops':
        data = crops.map((c) => ({ 'Crop Name': c.name, Variety: c.variety, 'Area (acres)': c.area_acres, Status: c.status, 'Expected Yield (kg)': c.expected_yield_kg, 'Actual Yield (kg)': c.actual_yield_kg ?? '-', Planted: formatDate(c.planting_date) }));
        filename = 'crops-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'disease':
        data = reports.map((r) => ({ 'Crop Type': r.crop_type, Disease: r.disease_prediction ?? '-', Confidence: r.confidence_score ? (r.confidence_score * 100).toFixed(1) + '%' : '-', 'Risk Level': r.risk_level ?? '-', Status: r.status, Created: formatDate(r.created_at) }));
        filename = 'disease-reports-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'yields':
        data = yields.map((y) => ({ 'Yield (kg)': y.yield_kg, 'Area (acres)': y.area_acres, 'Quality Rating': y.quality_rating ?? '-', Notes: y.notes ?? '-', 'Harvest Date': formatDate(y.harvest_date) }));
        filename = 'yield-records-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
      case 'prices':
        data = prices.map((p) => ({ Crop: p.crop, Region: p.region, 'Price/kg': 'KES ' + p.price_per_kg.toFixed(2), Trend: p.trend }));
        filename = 'market-prices-' + formatDate(new Date()).replace(/\s/g, '-') + '.' + format;
        break;
    }

    if (format === 'csv') exportToCSV(data, filename);
    else exportToJSON(data, filename);
    toast.success(filename + ' exported');
    setExporting(null);
  };

  const exportTypes = [
    { id: 'farms', label: 'Farms', icon: Table, desc: farms.length + ' farms' },
    { id: 'crops', label: 'Crop Records', icon: Table, desc: crops.length + ' crops' },
    { id: 'disease', label: 'Disease Reports', icon: Table, desc: reports.length + ' reports' },
    { id: 'yields', label: 'Yield Records', icon: Table, desc: yields.length + ' records' },
    { id: 'prices', label: 'Market Prices', icon: Table, desc: prices.length + ' prices' },
  ];

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Data Export</h1>
        <p className="text-xs sm:text-sm text-gray-500">Export your data to CSV or JSON</p>
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
                      {exporting === id + '-csv' ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <FileSpreadsheet className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />} CSV
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-7 sm:h-9" onClick={() => handleExport(id, 'json')} disabled={exporting === id + '-json'}>
                      {exporting === id + '-json' ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <FileJson className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />} JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Bulk Export</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Button size="sm" className="text-xs" onClick={() => {
                exportToJSON({ farms, crops, diseaseReports: reports, yieldRecords: yields, marketPrices: prices }, 'agripride-full-export-' + formatDate(new Date()).replace(/\s/g, '-') + '.json');
                toast.success('Full export downloaded');
              }}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export All as JSON
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
