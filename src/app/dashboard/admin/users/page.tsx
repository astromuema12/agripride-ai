'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/lib/db';
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

const roleColors: Record<UserRole, 'primary' | 'secondary' | 'default' | 'destructive' | 'warning' | 'outline'> = {
  admin: 'destructive',
  officer: 'secondary',
  farmer: 'primary',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('farmer');

  useEffect(() => {
    (async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      const updated = { ...user, is_suspended: !user.is_suspended, updated_at: new Date().toISOString() };
      const store = JSON.parse(localStorage.getItem('agripride_demo_data') || '{}');
      const idx = store.users.findIndex((u: User) => u.id === user.id);
      if (idx !== -1) {
        store.users[idx] = updated;
        localStorage.setItem('agripride_demo_data', JSON.stringify(store));
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast.success(`User ${updated.is_suspended ? 'suspended' : 'activated'} successfully`);
    } catch {
      toast.error('Failed to update user status');
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
      const updated = { ...editingUser, name: editName, role: editRole, updated_at: new Date().toISOString() };
      const store = JSON.parse(localStorage.getItem('agripride_demo_data') || '{}');
      const idx = store.users.findIndex((u: User) => u.id === editingUser.id);
      if (idx !== -1) {
        store.users[idx] = updated;
        localStorage.setItem('agripride_demo_data', JSON.stringify(store));
      }
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch {
      toast.error('Failed to update user');
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage all platform users and their permissions</p>
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
              <p className="text-sm text-gray-500">Total Users</p>
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
              <p className="text-sm text-gray-500">Admins</p>
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
              <p className="text-sm text-gray-500">Officers</p>
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
              <p className="text-sm text-gray-500">Farmers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Users</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
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
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs">{searchQuery ? 'Try a different search term' : 'No users registered yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
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
                          {user.is_suspended ? 'Suspended' : 'Active'}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant={user.is_suspended ? 'secondary' : 'destructive'}
                            size="sm"
                            onClick={() => handleToggleSuspend(user)}
                          >
                            {user.is_suspended ? (
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                            ) : (
                              <Ban className="mr-1 h-3.5 w-3.5" />
                            )}
                            {user.is_suspended ? 'Activate' : 'Suspend'}
                          </Button>
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

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user name and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
              <select
                className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
              >
                <option value="farmer">Farmer</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
