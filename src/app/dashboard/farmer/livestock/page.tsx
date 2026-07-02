'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAnimals, getFarms, getHealthRecords, getVaccinationRecords, getMilkProduction } from '@/lib/db';
import type { Animal, Farm, HealthRecord, VaccinationRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  PawPrint, AlertTriangle, Syringe, Milk, Heart, Calendar,
  MapPin, Ruler, Activity, Plus,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, string> = {
  dairy_cattle: 'Dairy Cattle',
  beef_cattle: 'Beef Cattle',
  goat: 'Goat',
  sheep: 'Sheep',
  poultry_layer: 'Poultry (Layer)',
  poultry_broiler: 'Poultry (Broiler)',
  pig: 'Pig',
};

function HealthStatusBadge({ status }: { status: Animal['health_status'] }) {
  const map: Record<string, { variant: 'primary' | 'destructive' | 'warning' | 'default'; label: string }> = {
    healthy: { variant: 'primary', label: 'Healthy' },
    sick: { variant: 'destructive', label: 'Sick' },
    recovering: { variant: 'warning', label: 'Recovering' },
    critical: { variant: 'destructive', label: 'Critical' },
    deceased: { variant: 'default', label: 'Deceased' },
  };
  const { variant, label } = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

function VaccinationStatusBadge({ status }: { status: Animal['vaccination_status'] }) {
  const map: Record<string, { variant: 'primary' | 'destructive' | 'warning'; label: string }> = {
    up_to_date: { variant: 'primary', label: 'Up to Date' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    not_started: { variant: 'warning', label: 'Not Started' },
  };
  const { variant, label } = map[status] ?? { variant: 'warning' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function LivestockPage() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [milkRecords, setMilkRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ data: userFarms }, { data: allAnimals }, allHealth, allVax] = await Promise.all([
          getFarms(user.id),
          getAnimals(),
          getHealthRecords(),
          getVaccinationRecords(),
        ]);
        const farmIds = userFarms.map((f) => f.id);
        setFarms(userFarms);
        const userAnimals = allAnimals.filter((a) => farmIds.includes(a.farm_id));
        setAnimals(userAnimals);
        const animalIds = new Set(userAnimals.map((a) => a.id));
        setHealthRecords(allHealth.filter((h) => animalIds.has(h.animal_id)));
        setVaccinations(allVax.filter((v) => animalIds.has(v.animal_id)));

        const milkData = userAnimals.filter((a) => a.category === 'dairy_cattle' && a.gender === 'female').length > 0
          ? await getMilkProduction()
          : [];
        setMilkRecords(milkData.filter((m) => animalIds.has(m.animal_id)));
      } catch {
        toast.error('Failed to load livestock data');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;

  const total = animals.length;
  const healthy = animals.filter((a) => a.health_status === 'healthy').length;
  const sick = animals.filter((a) => a.health_status === 'sick' || a.health_status === 'critical').length;
  const overdueVax = animals.filter((a) => a.vaccination_status === 'overdue').length;
  const activeAlerts = healthRecords.filter((h) => h.outcome === 'ongoing').length;

  const farmMap = new Map(farms.map((f) => [f.id, f]));
  const filtered = categoryFilter === 'all' ? animals : animals.filter((a) => a.category === categoryFilter);

  const stats = [
    { icon: PawPrint, label: 'Total Animals', value: total, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Heart, label: 'Healthy', value: healthy, color: 'text-green-600 bg-green-50' },
    { icon: AlertTriangle, label: 'Sick / Critical', value: sick, color: sick > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50' },
    { icon: Syringe, label: 'Vaccinations Overdue', value: overdueVax, color: overdueVax > 0 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livestock Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track health, vaccinations, breeding, and production for all your animals
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeAlerts > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{activeAlerts} active health issue{activeAlerts !== 1 ? 's' : ''}</strong> requiring attention. View animal profiles for details.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(CATEGORY_MAP).map(([key, label]) => {
            const count = animals.filter((a) => a.category === key).length;
            if (count === 0) return null;
            return <TabsTrigger key={key} value={key}>{label} ({count})</TabsTrigger>;
          })}
        </TabsList>
        <TabsContent value={categoryFilter} className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <PawPrint className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Animals Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {categoryFilter === 'all' ? 'You have no livestock registered yet.' : `No ${CATEGORY_MAP[categoryFilter]?.toLowerCase() ?? categoryFilter} animals.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((animal) => {
                const farm = farmMap.get(animal.farm_id);
                const alerts = healthRecords.filter((h) => h.animal_id === animal.id && h.outcome === 'ongoing').length;
                const vaxCount = vaccinations.filter((v) => v.animal_id === animal.id).length;
                return (
                  <Link key={animal.id} href={`/dashboard/farmer/livestock/animals/${animal.id}`}>
                    <Card className="transition-shadow hover:shadow-md cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PawPrint className="h-4 w-4 text-emerald-600" />
                            {animal.name ?? animal.tag_number}
                          </CardTitle>
                          <div className="flex gap-1">
                            {alerts > 0 && <Badge variant="destructive" className="text-xs">{alerts} alert{alerts > 1 ? 's' : ''}</Badge>}
                            {!animal.is_active && <Badge variant="default" className="text-xs">Inactive</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PawPrint className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{CATEGORY_MAP[animal.category] ?? animal.category} &middot; {animal.breed}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{farm?.name || 'Unknown Farm'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>Born {formatDate(animal.birth_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Syringe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{vaxCount} vaccine{vaxCount !== 1 ? 's' : ''} recorded</span>
                          <VaccinationStatusBadge status={animal.vaccination_status} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <HealthStatusBadge status={animal.health_status} />
                          <span className="text-xs text-gray-400">Tag: {animal.tag_number}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
