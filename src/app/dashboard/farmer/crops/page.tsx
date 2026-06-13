'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCrops, createCrop, getFarms } from '@/lib/db';
import type { Crop, Farm } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sprout, Plus, Calendar, MapPin, Ruler, Package,
} from 'lucide-react';

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Beans', 'Coffee', 'Tea', 'Cotton', 'Sorghum', 'Millet', 'Groundnuts', 'Sunflower', 'Sugarcane', 'Sweet Potato'];

function StatusBadge({ status }: { status: Crop['status'] }) {
  const map: Record<string, { variant: 'primary' | 'warning' | 'destructive'; label: string }> = {
    growing: { variant: 'primary', label: 'Growing' },
    harvested: { variant: 'warning', label: 'Harvested' },
    failed: { variant: 'destructive', label: 'Failed' },
  };
  const { variant, label } = map[status] ?? map.growing;
  return <Badge variant={variant}>{label}</Badge>;
}

export default function CropsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [farmId, setFarmId] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ data: userFarms }, { data: allCrops }] = await Promise.all([getFarms(user.id), getCrops()]);
        const farmIds = userFarms.map((f) => f.id);
        setFarms(userFarms);
        setCrops(allCrops.filter((c) => farmIds.includes(c.farm_id)));
      } catch {
        toast.error('Failed to load crop records');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleCreateCrop = async () => {
    if (!user) return;
    if (!cropName || !variety.trim() || !farmId || !plantingDate || !areaAcres || Number(areaAcres) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const newCrop = await createCrop({
        farm_id: farmId,
        name: cropName,
        variety: variety.trim(),
        planting_date: plantingDate,
        area_acres: Number(areaAcres),
        status: 'growing',
        expected_yield_kg: Number(expectedYield) || 0,
      });
      setCrops((prev) => [newCrop, ...prev]);
      toast.success('Crop added successfully');
      setDialogOpen(false);
      setCropName(''); setVariety(''); setFarmId(''); setPlantingDate(''); setAreaAcres(''); setExpectedYield('');
    } catch {
      toast.error('Failed to create crop record');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const farmMap = new Map(farms.map((f) => [f.id, f]));
  const filtered = statusFilter === 'all' ? crops : crops.filter((c) => c.status === statusFilter);
  const totalCrops = crops.length;
  const growing = crops.filter((c) => c.status === 'growing').length;
  const harvested = crops.filter((c) => c.status === 'harvested').length;
  const failed = crops.filter((c) => c.status === 'failed').length;

  const stats = [
    { icon: Sprout, label: 'Total Crops', value: totalCrops, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Sprout, label: 'Growing', value: growing, color: 'text-green-600 bg-green-50' },
    { icon: Package, label: 'Harvested', value: harvested, color: 'text-amber-600 bg-amber-50' },
    { icon: Sprout, label: 'Failed', value: failed, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crop Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your crop plantings across all farms
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Crop
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Crop</DialogTitle>
              <DialogDescription>
                Record a new crop planting for one of your farms.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="crop-name">Crop Name</Label>
                <Select value={cropName} onValueChange={setCropName}>
                  <SelectTrigger id="crop-name">
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-variety">Variety</Label>
                <Input
                  id="crop-variety"
                  placeholder="e.g., H614, Duma 43"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-farm">Farm</Label>
                <Select value={farmId} onValueChange={setFarmId}>
                  <SelectTrigger id="crop-farm">
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-date">Planting Date</Label>
                <Input
                  id="crop-date"
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-area">Area (Acres)</Label>
                <Input
                  id="crop-area"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 5"
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-yield">Expected Yield (kg) — optional</Label>
                <Input
                  id="crop-yield"
                  type="number"
                  min="0"
                  placeholder="e.g., 2000"
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCrop} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Crop'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="growing">Growing</TabsTrigger>
          <TabsTrigger value="harvested">Harvested</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value={statusFilter} className="mt-4">
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
                  <Sprout className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {statusFilter === 'all' ? 'No Crops Recorded' : `No ${statusFilter} crops`}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {statusFilter === 'all' ? 'Add your first crop to start tracking.' : 'No crops match this status.'}
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Crop
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((crop) => {
                const farm = farmMap.get(crop.farm_id);
                return (
                  <Card key={crop.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-emerald-600" />
                          {crop.name}
                        </CardTitle>
                        <StatusBadge status={crop.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Variety: {crop.variety}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{farm?.name || 'Unknown Farm'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Planted {formatDate(crop.planting_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Ruler className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{crop.area_acres} acres</span>
                      </div>
                      {crop.expected_yield_kg > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>Expected: {crop.expected_yield_kg.toLocaleString()} kg</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Added {formatDate(crop.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
