'use client';

import { useState, useEffect } from 'react';
import { getDiseaseReports, getUsers } from '@/lib/db';
import { useI18n } from '@/lib/i18n';
import type { DiseaseReport, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle, Search, MapPin, Clock, Calendar, CheckCircle,
  FileSearch, Activity, Shield, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { writeAuditLog } from '@/lib/server-auth';
import { useAuth } from '@/contexts/AuthContext';

type StatusTab = 'all' | 'submitted' | 'reviewed' | 'resolved';

const riskBadgeClass = (level?: string) => {
  switch (level) {
    case 'low': return 'border-transparent bg-emerald-100 text-emerald-800';
    case 'medium': return 'border-transparent bg-amber-100 text-amber-800';
    case 'high': return 'border-transparent bg-red-100 text-red-800';
    case 'critical': return 'border-transparent bg-purple-100 text-purple-800';
    default: return 'border-transparent bg-gray-100 text-gray-800';
  }
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'resolved': return 'border-transparent bg-emerald-100 text-emerald-800';
    case 'reviewed': return 'border-transparent bg-blue-100 text-blue-800';
    case 'submitted': return 'border-transparent bg-amber-100 text-amber-800';
    default: return '';
  }
};

export default function DiseasePage() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<StatusTab>('all');
  const [selectedReport, setSelectedReport] = useState<DiseaseReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: r }, { data: u }] = await Promise.all([getDiseaseReports(), getUsers()]);
        setReports(r);
        setUsers(u);
      } catch {
        toast.error('Failed to load disease reports');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getFarmerName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || 'Unknown Farmer';

  const getFarmLocation = (farmId: string) => {
    try {
      const store = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('agripride_demo_data') || '{}') : {};
      const farm = store.farms?.find((f: { id: string; location: string }) => f.id === farmId);
      return farm?.location || 'Unknown Region';
    } catch {
      return 'Unknown Region';
    }
  };

  const filtered = reports.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const farmerName = getFarmerName(r.user_id).toLowerCase();
      return farmerName.includes(q) || r.crop_type.toLowerCase().includes(q) || (r.disease_prediction?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const statusCounts = {
    total: reports.length,
    submitted: reports.filter((r) => r.status === 'submitted').length,
    reviewed: reports.filter((r) => r.status === 'reviewed').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  const handleMarkReviewed = async () => {
    if (!selectedReport) return;
    try {
      const store = JSON.parse(localStorage.getItem('agripride_demo_data') || '{}');
      const idx = store.diseaseReports.findIndex((r: DiseaseReport) => r.id === selectedReport.id);
      if (idx !== -1) {
        store.diseaseReports[idx] = {
          ...store.diseaseReports[idx],
          status: 'reviewed',
          reviewed_at: new Date().toISOString(),
        };
        localStorage.setItem('agripride_demo_data', JSON.stringify(store));
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id
              ? { ...r, status: 'reviewed' as const, reviewed_at: new Date().toISOString() }
              : r
          )
        );
        setSelectedReport((prev) =>
          prev ? { ...prev, status: 'reviewed', reviewed_at: new Date().toISOString() } : null
        );
        toast.success('Report marked as reviewed');
        writeAuditLog({
          user_id: currentUser?.id || 'unknown',
          action: 'review_disease_report',
          resource: 'disease_reports',
          resource_id: selectedReport.id,
        }).catch(() => {});
      }
    } catch {
      toast.error('Failed to update report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.officer.diseaseMonitoring')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.officer.diseaseMonitoringDesc')}</p>
        </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('dashboard.officer.searchCropDisease')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.totalReports')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.total}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileSearch className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.submitted')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.submitted}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.reviewed')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.reviewed}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('dashboard.officer.resolved')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.resolved}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">{t('common.all')} ({statusCounts.total})</TabsTrigger>
          <TabsTrigger value="submitted">{t('dashboard.officer.submitted')} ({statusCounts.submitted})</TabsTrigger>
          <TabsTrigger value="reviewed">{t('dashboard.officer.reviewed')} ({statusCounts.reviewed})</TabsTrigger>
          <TabsTrigger value="resolved">{t('dashboard.officer.resolved')} ({statusCounts.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {search.trim() ? t('dashboard.officer.noReportsSearch') : t('dashboard.officer.noDiseaseReports')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search.trim() ? t('dashboard.officer.tryDifferentSearch') : t('dashboard.officer.noDiseaseReportsDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filtered.map((report) => (
                  <div
                    key={report.id}
                    className="py-3 space-y-1.5 cursor-pointer"
                    onClick={() => {
                      setSelectedReport(report);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700">
                            {getFarmerName(report.user_id).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">{getFarmerName(report.user_id)}</span>
                      </div>
                      <Badge className={statusBadgeClass(report.status) + ' shrink-0'}>{report.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{report.crop_type}{report.disease_prediction ? ` - ${report.disease_prediction}` : ''}</span>
                      <span className="font-medium text-gray-800">
                        {report.confidence_score !== undefined ? `${Math.round(report.confidence_score * 100)}%` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <Badge className={riskBadgeClass(report.risk_level)}>
                        {report.risk_level || 'unknown'}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.farmer')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.cropType')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.diseasePrediction')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.confidenceLabel')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('dashboard.officer.riskLevel')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('common.status')}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">{t('common.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedReport(report);
                          setDialogOpen(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-emerald-700">
                                {getFarmerName(report.user_id).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800">{getFarmerName(report.user_id)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{report.crop_type}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{report.disease_prediction || '-'}</td>
                        <td className="px-4 py-3">
                          {report.confidence_score !== undefined ? (
                            <span className="font-medium text-gray-800">{Math.round(report.confidence_score * 100)}%</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={riskBadgeClass(report.risk_level)}>
                            {report.risk_level || 'unknown'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusBadgeClass(report.status)}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dashboard.officer.diseaseReportDetails')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.officer.submittedBy')} {selectedReport ? getFarmerName(selectedReport.user_id) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    {t('dashboard.officer.cropType')}
                   </p>
                  <p className="text-sm font-medium text-gray-900">{selectedReport.crop_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('dashboard.officer.riskLevel')}
                  </p>
                  <Badge className={riskBadgeClass(selectedReport.risk_level)}>
                    {selectedReport.risk_level || 'unknown'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {t('common.location')}
                   </p>
                  <p className="text-sm text-gray-900">{getFarmLocation(selectedReport.farm_id)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('common.status')}
                  </p>
                  <Badge className={statusBadgeClass(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.officer.diseasePrediction')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedReport.disease_prediction || t('common.unknown')}
                </p>
                {selectedReport.confidence_score !== undefined && (
                  <p className="text-xs text-gray-500">
                    {t('dashboard.officer.confidenceLabel')}: {Math.round(selectedReport.confidence_score * 100)}%
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.officer.symptoms')}</p>
                <p className="text-sm text-gray-700">{selectedReport.symptoms}</p>
              </div>

              {selectedReport.explanation && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.officer.aiExplanation')}</p>
                  <p className="text-sm text-gray-700">{selectedReport.explanation}</p>
                </div>
              )}

              {selectedReport.treatment && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.officer.treatment')}</p>
                  <p className="text-sm text-gray-700">{selectedReport.treatment}</p>
                </div>
              )}

              {selectedReport.prevention && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.officer.prevention')}</p>
                  <p className="text-sm text-gray-700">{selectedReport.prevention}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{t('dashboard.officer.reportedOn')}: {new Date(selectedReport.created_at).toLocaleString()}</span>
                  {selectedReport.reviewed_at && (
                    <>
                      <span className="mx-1">·</span>
                      <CheckCircle className="h-3 w-3" />
                      <span>{t('dashboard.officer.reviewedOn')}: {new Date(selectedReport.reviewed_at).toLocaleString()}</span>
                    </>
                  )}
                </div>
                {selectedReport.status === 'submitted' && (
                  <Button size="sm" onClick={handleMarkReviewed}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('dashboard.officer.markAsReviewed')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
