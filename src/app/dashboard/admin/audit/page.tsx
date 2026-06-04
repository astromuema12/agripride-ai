'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAuditLogs, getUsers } from '@/lib/db';
import type { AuditLog, User } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Shield, Users, Activity,
  Clock, Globe, User as UserIcon, Bot,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES: Record<string, string[]> = {
  'AI Logs': ['ai_recommendation', 'recommendations'],
  'User Logs': ['login', 'logout', 'users', 'auth'],
  'System Logs': ['create_farm', 'update_farm', 'delete_farm', 'create_crop', 'disease_report', 'view_report', 'export_data', 'farms', 'crops', 'disease_reports', 'weather', 'settings'],
};

type TabName = 'AI Logs' | 'User Logs' | 'System Logs';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabName>('AI Logs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [auditLogs, allUsers] = await Promise.all([getAuditLogs(), getUsers()]);
        setLogs(auditLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setUsers(allUsers);
      } catch {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    const categoryActions = CATEGORIES[activeTab];
    return logs.filter(
      (log) =>
        (categoryActions.includes(log.action) || categoryActions.includes(log.resource)) &&
        (log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (userMap.get(log.user_id) || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [logs, activeTab, searchQuery, userMap]);

  const todayStr = new Date().toISOString().split('T')[0];
  const actionsToday = logs.filter((l) => l.created_at.startsWith(todayStr)).length;
  const uniqueUsers = new Set(logs.map((l) => l.user_id)).size;

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audit Center</h1>
          <p className="text-sm text-gray-500">Comprehensive audit trail of all platform activities</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
              <p className="text-sm text-gray-500">Total Audit Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{uniqueUsers}</div>
              <p className="text-sm text-gray-500">Unique Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{actionsToday}</div>
              <p className="text-sm text-gray-500">Actions Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabName)}>
              <TabsList>
                <TabsTrigger value="AI Logs" className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  AI Logs
                </TabsTrigger>
                <TabsTrigger value="User Logs" className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  User Logs
                </TabsTrigger>
                <TabsTrigger value="System Logs" className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  System Logs
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by action, resource, or user..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <Shield className="h-10 w-10" />
              <p className="text-sm font-medium">No audit logs found</p>
              <p className="text-xs">{searchQuery ? 'Try a different search term' : `No ${activeTab.toLowerCase()} recorded yet`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Action</th>
                    <th className="pb-3 pr-4 font-medium">Resource</th>
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">IP Address</th>
                    <th className="pb-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4">
                        <Badge variant="default" className="capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{log.resource}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                            {(userMap.get(log.user_id) || 'U')[0]}
                          </div>
                          <span className="text-gray-600">{userMap.get(log.user_id) || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Globe className="h-3 w-3" />
                          {log.ip_address || '—'}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {timeAgo(log.created_at)}
                        </div>
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
