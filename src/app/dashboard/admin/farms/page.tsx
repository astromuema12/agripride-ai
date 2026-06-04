'use client';

import { useState, useEffect, useMemo } from 'react';
import { getFarms, updateFarm, getUsers } from '@/lib/db';
import type { Farm, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Building2, CheckCircle, Archive,
  Clock, MapPin, Ruler,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allFarms, allUsers] = await Promise.all([getFarms(), getUsers()]);
        setFarms(allFarms);
        setUsers(allUsers);
      } catch {
        toast.error('Failed to load farms');
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

  const filtered = farms.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: farms.length,
    active: farms.filter((f) => f.status === 'active').length,
    archived: farms.filter((f) => f.status === 'archived').length,
  };

  async function handleApprove(farm: Farm) {
    try {
      await updateFarm(farm.id, { status: 'active' });
      setFarms((prev) => prev.map((f) => (f.id === farm.id ? { ...f, status: 'active' } : f)));
      toast.success('Farm approved successfully');
    } catch {
      toast.error('Failed to approve farm');
    }
  }

  async function handleArchive(farm: Farm) {
    try {
      await updateFarm(farm.id, { status: 'archived' });
      setFarms((prev) => prev.map((f) => (f.id === farm.id ? { ...f, status: 'archived' } : f)));
      toast.success('Farm archived successfully');
    } catch {
      toast.error('Failed to archive farm');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Farm Management</h1>
          <p className="text-sm text-gray-500">View and manage all registered farms</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-500">Total Farms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.archived}</div>
              <p className="text-sm text-gray-500">Archived</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Farms</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by farm name..."
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
              <Building2 className="h-10 w-10" />
              <p className="text-sm font-medium">No farms found</p>
              <p className="text-xs">{searchQuery ? 'Try a different search term' : 'No farms registered yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Owner</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Size</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((farm) => (
                    <tr key={farm.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-900">{farm.name}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                            {(userMap.get(farm.user_id) || 'U')[0]}
                          </div>
                          <span className="text-gray-600">{userMap.get(farm.user_id) || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {farm.location}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Ruler className="h-3 w-3 text-gray-400" />
                          {farm.size_acres} acres
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={farm.status === 'active' ? 'primary' : 'warning'}>
                          {farm.status === 'active' ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(farm.created_at)}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {farm.status === 'archived' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApprove(farm)}
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              Approve
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(farm)}
                            >
                              <Archive className="mr-1 h-3.5 w-3.5" />
                              Archive
                            </Button>
                          )}
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
