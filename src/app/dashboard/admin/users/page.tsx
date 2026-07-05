'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/lib/db';
import { useI18n } from '@/lib/i18n';
import type { User, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Users as UsersIcon, Shield, UserCog, User as UserIcon,
  Pencil, Ban, CheckCircle, Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { writeAuditLog } from '@/lib/server-auth';
import { useAuth } from '@/contexts/AuthContext';

const roleColors: Record<UserRole, 'primary' | 'secondary' | 'default' | 'destructive' | 'warning' | 'outline'> = {
  admin: 'destructive',
  officer: 'secondary',
  farmer: 'primary',
};

export default function UsersPage() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 100;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('farmer');

  useEffect(() => {
    (async () => {
      try {
        const { data, total: totalUsers } = await getUsers(pageSize, (page - 1) * pageSize);
        setUsers(data);
        setTotal(totalUsers);
      } catch {
        toast.error(t('dashboard.admin.failedToLoadUsers'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    officers: users.filter((u) => u.role === 'officer').length,
    farmers: users.filter((u) => u.role === 'farmer').length,
    active: users.filter((u) => !u.is_suspended).length,
    suspended: users.filter((u) => u.is_suspended).length,
  };

  async function handleToggleSuspend(user: User) {
    try {
      const updated: User = { ...user, is_suspended: !user.is_suspended, updated_at: new Date().toISOString() };
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(updated.is_suspended ? t('dashboard.admin.userSuspended', { name: updated.name }) : t('dashboard.admin.userActivated', { name: updated.name }));
      writeAuditLog({
        user_id: currentUser?.id || 'unknown',
        action: updated.is_suspended ? 'suspend_user' : 'activate_user',
        resource: 'users',
        resource_id: user.id,
      }).catch(() => {});
    } catch {
      toast.error(t('dashboard.admin.failedToUpdateUserStatus'));
    }
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    try {
      const updated: User = { ...editingUser, name: editName, role: editRole, updated_at: new Date().toISOString() };
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      toast.success(t('dashboard.admin.userUpdated'));
      writeAuditLog({
        user_id: currentUser?.id || 'unknown',
        action: 'update_user',
        resource: 'users',
        resource_id: editingUser.id,
        details: { role: editRole },
      }).catch(() => {});
    } catch {
      toast.error(t('dashboard.admin.failedToUpdateUser'));
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('dashboard.admin.userManagement')}</h1>
          <p className="text-sm text-gray-500">{t('dashboard.admin.userManagementDesc')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-500">{t('dashboard.admin.totalUsers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.admins}</div>
              <p className="text-sm text-gray-500">{t('dashboard.admin.admins')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.officers}</div>
              <p className="text-sm text-gray-500">{t('dashboard.admin.officers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.farmers}</div>
              <p className="text-sm text-gray-500">{t('dashboard.admin.farmers')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{t('dashboard.admin.allUsers')}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('dashboard.admin.searchUsersPlaceholder')}
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
              <UsersIcon className="h-10 w-10" />
              <p className="text-sm font-medium">{t('dashboard.admin.noUsersFound')}</p>
              <p className="text-xs">{searchQuery ? t('dashboard.admin.tryDifferentSearch') : t('dashboard.admin.noUsersRegistered')}</p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filtered.map((user) => (
                  <div key={user.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <Badge variant={roleColors[user.role]} className="capitalize text-[10px]">{user.role}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 truncate">{user.email}</div>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant={user.is_suspended ? 'destructive' : 'primary'} className="text-[10px]">
                        {user.is_suspended ? t('common.inactive') : t('common.active')}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditDialog(user)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant={user.is_suspended ? 'secondary' : 'destructive'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleToggleSuspend(user)}
                      >
                        {user.is_suspended ? <CheckCircle className="mr-1 h-3 w-3" /> : <Ban className="mr-1 h-3 w-3" />}
                        {user.is_suspended ? t('dashboard.admin.activate') : t('dashboard.admin.suspend')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                      <th className="pb-3 pr-4 font-medium">{t('common.name')}</th>
                      <th className="pb-3 pr-4 font-medium">{t('common.email')}</th>
                      <th className="pb-3 pr-4 font-medium">{t('common.type')}</th>
                      <th className="pb-3 pr-4 font-medium">{t('common.status')}</th>
                      <th className="pb-3 pr-4 font-medium">{t('common.date')}</th>
                      <th className="pb-3 font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{user.email}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={roleColors[user.role]} className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={user.is_suspended ? 'destructive' : 'primary'}>
                        {user.is_suspended ? t('common.inactive') : t('common.active')}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              {t('common.edit')}
                            </Button>
                            <Button variant={user.is_suspended ? 'secondary' : 'destructive'} size="sm" onClick={() => handleToggleSuspend(user)}>
                              {user.is_suspended ? <CheckCircle className="mr-1 h-3.5 w-3.5" /> : <Ban className="mr-1 h-3.5 w-3.5" />}
                        {user.is_suspended ? t('dashboard.admin.activate') : t('dashboard.admin.suspend')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
          {t('dashboard.admin.pageOf', { page, totalPages: Math.ceil(total / pageSize), total })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            {t('common.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}>
            {t('common.next')}
          </Button>
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.admin.editUser')}</DialogTitle>
            <DialogDescription>{t('dashboard.admin.editUserDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('common.name')}</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('common.type')}</label>
              <select
                className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
              >
                 <option value="farmer">{t('auth.farmer')}</option>
                <option value="officer">{t('auth.officer')}</option>
                <option value="admin">{t('auth.admin')}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>{t('common.cancel')}</Button>
              <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
