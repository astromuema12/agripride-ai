'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, FileSpreadsheet, FileJson, Clock, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ReportType {
  id: string;
  title: string;
  description: string;
  format: 'PDF' | 'CSV' | 'Excel';
  icon: React.ComponentType<{ className?: string }>;
}

interface GeneratedReport {
  id: string;
  title: string;
  format: string;
  date: string;
  status: 'completed' | 'processing';
}

const recentReports: GeneratedReport[] = [];

const formatBadgeVariant: Record<string, 'primary' | 'secondary' | 'default'> = {
  PDF: 'primary',
  CSV: 'secondary',
  Excel: 'default',
};

export default function ReportsPage() {
  const { t } = useI18n();

  const reportTypes: ReportType[] = [
    {
      id: 'farm',
      title: t('reports.types.farm'),
      description: t('reports.farmReportDesc'),
      format: 'PDF' as const,
      icon: FileText,
    },
    {
      id: 'disease',
      title: t('reports.types.disease'),
      description: t('reports.diseaseReportDesc'),
      format: 'CSV' as const,
      icon: FileSpreadsheet,
    },
    {
      id: 'yield',
      title: t('reports.types.yield'),
      description: t('reports.yieldReportDesc'),
      format: 'Excel' as const,
      icon: FileJson,
    },
    {
      id: 'sustainability',
      title: t('reports.types.sustainability'),
      description: t('reports.sustainabilityReportDesc'),
      format: 'PDF' as const,
      icon: FileText,
    },
  ];

  function ReportCard({ report }: { report: ReportType }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const Icon = report.icon;

    function handleDownload() {
      toast.success(t('reports.downloadStarted', { title: report.title }));
    }

    return (
      <Card className="border-[#d1d5db] transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#e2f0ee] p-2.5 text-[#0f766e]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="mt-0.5 max-w-xs text-xs leading-relaxed">
                  {report.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant={formatBadgeVariant[report.format] ?? 'default'} className="shrink-0">
              {report.format === 'PDF' ? t('reports.pdf') : report.format === 'CSV' ? t('reports.csv') : t('reports.json')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{t('reports.startDate')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-40 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{t('reports.endDate')}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-40 text-xs"
              />
            </div>
            <Button size="sm" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              {t('common.download')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.pageTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('reports.pageSubtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('reports.scheduleReport')}
        </Button>
      </div>

      {/* Report Type Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-50 p-2.5 text-gray-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('reports.recentReports')}</CardTitle>
              <CardDescription>{t('reports.recentReportsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">{t('reports.noReports')}</p>
              <p className="text-xs text-gray-400">
                {t('reports.noReportsDesc')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                    <th className="pb-3 pr-4">{t('reports.tableReport')}</th>
                    <th className="pb-3 pr-4">{t('reports.tableFormat')}</th>
                    <th className="pb-3 pr-4">{t('common.date')}</th>
                    <th className="pb-3 pr-4">{t('common.status')}</th>
                    <th className="pb-3 text-right">{t('reports.tableAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{r.title}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={formatBadgeVariant[r.format] ?? 'default'}>
                          {r.format}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{r.date}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={r.status === 'completed' ? 'primary' : 'warning'}>
                          {r.status === 'completed' ? t('common.completed') : t('reports.statusProcessing')}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-[#0f766e]"
                          onClick={() => toast.success(t('reports.downloading', { title: r.title }))}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t('common.download')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
