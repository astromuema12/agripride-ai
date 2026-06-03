'use client';

import { useState, useEffect } from 'react';
import { getUsers, getFarms } from '@/lib/db';
import type { User, Farm } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Building2, Search, ChevronDown, ChevronRight,
  MapPin, Calendar, Mail, Sprout, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FarmersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [u, f] = await Promise.all([getUsers(), getFarms()]);
        setUsers(u);
        setFarms(f);
      } catch (err) {
        console.error('Failed to load farmers data:', err);
        toast.error('Failed to load farmers data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const farmers = users
    .filter((u) => u.role === 'farmer')
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  const totalFarmers = users.filter((u) => u.role === 'farmer').length;
  const totalFarms = farms.length;
  const avgFarms = totalFarmers > 0 ? (totalFarms / totalFarmers).toFixed(1) : '0';

  const getFarmerFarms = (userId: string) =>
    farms.filter((f) => f.user_id === userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading farmers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmers Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all registered farmers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-72"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Farmers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalFarmers}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Farms</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalFarms}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Farms / Farmer</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgFarms}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmers List */}
      {farmers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search.trim() ? 'No farmers match your search' : 'No farmers registered'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search.trim() ? 'Try a different search term' : 'Farmers will appear here once they register'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farmers.map((farmer) => {
            const farmerFarms = getFarmerFarms(farmer.id);
            const isExpanded = expandedId === farmer.id;
            return (
              <Card key={farmer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-emerald-700">
                            {farmer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{farmer.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{farmer.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="primary" className="shrink-0 ml-2">
                      {farmerFarms.length} {farmerFarms.length === 1 ? 'farm' : 'farms'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>Registered {new Date(farmer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>

                  {farmerFarms.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-emerald-600 hover:text-emerald-700 p-0 h-auto font-medium"
                        onClick={() => setExpandedId(isExpanded ? null : farmer.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        {isExpanded ? 'Hide Farms' : 'View Farms'}
                      </Button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {farmerFarms.map((farm) => (
                            <div
                              key={farm.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <Sprout className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-sm font-medium text-gray-800 truncate">{farm.name}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                  <span className="text-xs text-gray-500 truncate">{farm.location}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                  <span>{farm.size_acres} acres</span>
                                  <span>·</span>
                                  <span>{farm.soil_type}</span>
                                </div>
                              </div>
                              <Badge variant={farm.status === 'active' ? 'primary' : 'default'} className="shrink-0 ml-2">
                                {farm.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
