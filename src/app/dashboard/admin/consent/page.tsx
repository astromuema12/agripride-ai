'use client';

import { useState, useMemo, useEffect } from 'react';
import { getCollection, getDemoDataKey } from '@/lib/demo-store';
import type { ConsentRecord, User } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, Search, Download, CheckCircle, XCircle, Clock,
  Mail, FileText,
} from 'lucide-react';

type ConsentType = ConsentRecord['type'];
type ConsentStatus = 'granted' | 'revoked' | 'all';

const CONSENT_TYPES: { value: ConsentType; label: string }[] = [
  { value: 'data_collection', label: 'Data Collection' },
  { value: 'ai_processing', label: 'AI Processing' },
  { value: 'disease_diagnosis', label: 'Disease Diagnosis' },
  { value: 'weather_monitoring', label: 'Weather Monitoring' },
];

export default function ConsentPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [recs, usrs] = await Promise.all([
          getCollection<ConsentRecord>('consentRecords'),
          getCollection<User>('users'),
        ]);
        setRecords(recs);
        setUsers(usrs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConsentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ConsentStatus>('all');

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const user = userMap.get(r.user_id);
      const email = user?.email || '';
      const name = user?.name || '';

      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (statusFilter === 'granted' && !r.granted) return false;
      if (statusFilter === 'revoked' && r.granted) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!email.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, typeFilter, statusFilter, searchQuery, userMap]);

  const stats = useMemo(() => ({
    total: records.length,
    granted: records.filter((r) => r.granted).length,
    revoked: records.filter((r) => !r.granted).length,
  }), [records]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Consent Management</h1>
          <p className="text-sm text-gray-500">
            Manage user consent records for data collection, AI processing, and monitoring
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {}}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-500">Total Consents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.granted}</div>
              <p className="text-sm text-gray-500">Granted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.revoked}</div>
              <p className="text-sm text-gray-500">Revoked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ConsentType | 'all')}>
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                {CONSENT_TYPES.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user email or name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            {(['all', 'granted', 'revoked'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s === 'granted' && <CheckCircle className="mr-1 h-3 w-3" />}
                {s === 'revoked' && <XCircle className="mr-1 h-3 w-3" />}
                {s}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <Shield className="h-10 w-10" />
              <p className="text-sm font-medium">No consent records found</p>
              <p className="text-xs">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No consent records available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Consent Type</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Granted Date</th>
                    <th className="pb-3 font-medium">Revoked Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => {
                    const user = userMap.get(record.user_id);
                    return (
                      <tr key={record.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                              {(user?.name || 'U')[0]}
                            </div>
                            <span className="font-medium text-gray-900">{user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="h-3 w-3" />
                            {user?.email || '—'}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="capitalize">
                            {record.type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {record.granted ? (
                            <Badge variant="primary" className="flex w-fit items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Granted
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Revoked
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(record.granted_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3">
                          {record.revoked_at ? (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(record.revoked_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
