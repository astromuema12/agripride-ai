'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, getCrops, getDiseaseReports, getYieldRecords, getMarketPrices, getUsers, getAuditLogs } from '@/lib/db';
import { exportToCSV, exportToJSON } from '@/lib/export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function AdminExportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown[]>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getFarms(), getCrops(), getDiseaseReports(), getYieldRecords(), getMarketPrices(), getUsers(), getAuditLogs(),
    ]).then(([{ data: farms }, { data: crops }, { data: reports }, { data: yields }, prices, { data: users }, { data: logs }]) => {
      setData({ farms, crops, diseaseReports: reports, yieldRecords: yields, marketPrices: prices, users, auditLogs: logs });
      setLoading(false);
    });
  }, [user]);

  const handleExport = async (type: string, format: 'csv' | 'json') => {
    setExporting(`${type}-${format}`);
    await new Promise((r) => setTimeout(r, 500));
    const items = data[type] ?? [];
    const filename = `${type}-${formatDate(new Date()).replace(/\s/g, '-')}.${format}`;
    if (format === 'csv') {
      exportToCSV(items as Record<string, unknown>[], filename);
    } else {
      exportToJSON(items, filename);
    }
    toast.success(t('export.exported', { filename }));
    setExporting(null);
  };

  if (!user) return null;

  const typeLabels: Record<string, string> = {
    farms: t('export.farms'),
    crops: t('export.cropRecords'),
    diseaseReports: t('export.diseaseReports'),
    yieldRecords: t('export.yieldRecords'),
    marketPrices: t('export.prices'),
    users: t('export.users'),
    auditLogs: t('export.auditLogs'),
  };
  const types = Object.entries(data).map(([id, items]) => ({ id, label: typeLabels[id] || id, count: items.length }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">{t('export.title')}</h1><p className="text-gray-500">{t('adminExport.description')}</p></div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map(({ id, label, count }) => (
              <Card key={id}>
                <CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500">{t('export.records', { count })}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport(id, 'csv')} disabled={exporting === `${id}-csv`}>
                      {exporting === `${id}-csv` ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileSpreadsheet className="mr-2 h-3 w-3" />} CSV
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport(id, 'json')} disabled={exporting === `${id}-json`}>
                      {exporting === `${id}-json` ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileJson className="mr-2 h-3 w-3" />} JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">{t('export.bulkExport')}</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={() => { exportToJSON(data, `full-export-${formatDate(new Date()).replace(/\s/g, '-')}.json`); toast.success(t('export.fullExportDownloaded')); }}>
                <Download className="mr-2 h-4 w-4" /> {t('export.exportAllJson')}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
