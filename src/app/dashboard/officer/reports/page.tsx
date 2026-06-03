'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText, Download, FileSpreadsheet, FileJson, Clock, Plus,
  Users, AlertTriangle, Map, Leaf,
} from 'lucide-react';

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

const reportTypes: ReportType[] = [
  {
    id: 'farmer-activity',
    title: 'Farmer Activity Report',
    description: 'Comprehensive overview of farmer registrations, farm counts, crop distribution, and engagement metrics across all regions.',
    format: 'PDF',
    icon: Users,
  },
  {
    id: 'disease-outbreak',
    title: 'Disease Outbreak Report',
    description: 'Detailed analysis of active disease outbreaks, affected regions, crops at risk, resolution progress, and containment effectiveness.',
    format: 'CSV',
    icon: AlertTriangle,
  },
  {
    id: 'regional-summary',
    title: 'Regional Summary',
    description: 'Regional breakdown of agricultural activity, yield performance, disease prevalence, and sustainability scores by area.',
    format: 'Excel',
    icon: Map,
  },
  {
    id: 'sustainability',
    title: 'Sustainability Report',
    description: 'Environmental impact metrics across all farms including soil health trends, water usage efficiency, biodiversity indexes, and carbon footprint analysis.',
    format: 'PDF',
    icon: Leaf,
  },
];

const recentReports: GeneratedReport[] = [
  { id: 'OFR-001', title: 'Farmer Activity - June 2026', format: 'PDF', date: '2026-06-03', status: 'completed' },
  { id: 'OFR-002', title: 'Disease Outbreak Analysis - Week 22', format: 'CSV', date: '2026-06-02', status: 'completed' },
  { id: 'OFR-003', title: 'Regional Summary - Rift Valley', format: 'Excel', date: '2026-05-30', status: 'completed' },
  { id: 'OFR-004', title: 'Sustainability Scorecard Q2', format: 'PDF', date: '2026-05-28', status: 'completed' },
  { id: 'OFR-005', title: 'Monthly Disease Summary - May', format: 'CSV', date: '2026-05-25', status: 'completed' },
  { id: 'OFR-006', title: 'Farmer Activity - May 2026', format: 'PDF', date: '2026-05-20', status: 'completed' },
];

const formatBadgeVariant: Record<string, 'primary' | 'secondary' | 'default'> = {
  PDF: 'primary',
  CSV: 'secondary',
  Excel: 'default',
};

function ReportCard({ report }: { report: ReportType }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const Icon = report.icon;

  function handleDownload() {
    toast.success(`Report generation started: ${report.title}`);
  }

  return (
    <Card className="border-emerald-100 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
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
            {report.format}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OfficerReportsPage() {
  const [reports] = useState<GeneratedReport[]>(recentReports);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Officer Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and manage reports for farmer monitoring, disease tracking, and regional analysis
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-50 p-2.5 text-gray-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <CardDescription>Previously generated reports available for download</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No reports generated yet</p>
              <p className="text-xs text-gray-400">
                Generate your first report using the cards above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                    <th className="pb-3 pr-4">Report</th>
                    <th className="pb-3 pr-4">Format</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
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
                          {r.status === 'completed' ? 'Completed' : 'Processing'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-emerald-600"
                          onClick={() => toast.success(`Downloading ${r.title}`)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
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
