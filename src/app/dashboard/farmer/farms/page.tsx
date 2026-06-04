'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFarms, createFarm } from '@/lib/db';
import type { Farm } from '@/types';
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
import {
  Plus, MapPin, Sprout, Ruler, Leaf, MoreHorizontal,
} from 'lucide-react';

const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky', 'Saline'];

function StatusBadge({ status }: { status: Farm['status'] }) {
  const map: Record<string, { variant: 'primary' | 'default'; label: string }> = {
    active: { variant: 'primary', label: 'Active' },
    archived: { variant: 'default', label: 'Archived' },
  };
  const { variant, label } = map[status] ?? map.active;
  return <Badge variant={variant}>{label}</Badge>;
}

export default function FarmsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New farm form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [sizeAcres, setSizeAcres] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropsGrown, setCropsGrown] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getFarms(user.id);
        setFarms(data);
      } catch {
        toast.error('Failed to load farms');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleCreateFarm = async () => {
    if (!user) return;

    if (!name.trim()) {
      toast.error('Farm name is required');
      return;
    }
    if (!location.trim()) {
      toast.error('Location is required');
      return;
    }
    if (!sizeAcres || Number(sizeAcres) <= 0) {
      toast.error('Size must be a positive number');
      return;
    }
    if (!soilType) {
      toast.error('Please select a soil type');
      return;
    }

    setSubmitting(true);
    try {
      const newFarm = await createFarm({
        user_id: user.id,
        name: name.trim(),
        location: location.trim(),
        size_acres: Number(sizeAcres),
        soil_type: soilType,
        crops_grown: cropsGrown
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        status: 'active',
      });
      setFarms((prev) => [newFarm, ...prev]);
      toast.success('Farm added successfully');
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Failed to create farm');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setSizeAcres('');
    setSoilType('');
    setCropsGrown('');
  };

  const totalAcres = farms.reduce((sum, f) => sum + f.size_acres, 0);
  const activeFarms = farms.filter((f) => f.status === 'active').length;

  if (!user) return null;

  const stats = [
    { icon: Sprout, label: 'Total Farms', value: farms.length, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Ruler, label: 'Total Acres', value: totalAcres.toFixed(1), color: 'text-blue-600 bg-blue-50' },
    { icon: Leaf, label: 'Active Farms', value: activeFarms, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Farms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your registered farms and their details
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Farm</DialogTitle>
              <DialogDescription>
                Enter the details of your farm to register it in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="farm-name">Farm Name</Label>
                <Input
                  id="farm-name"
                  placeholder="e.g., Green Valley Farm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm-location">Location</Label>
                <Input
                  id="farm-location"
                  placeholder="e.g., Rift Valley, Kenya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm-size">Size (Acres)</Label>
                <Input
                  id="farm-size"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 25"
                  value={sizeAcres}
                  onChange={(e) => setSizeAcres(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm-soil">Soil Type</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger id="farm-soil">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOIL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm-crops">Crops Grown</Label>
                <Input
                  id="farm-crops"
                  placeholder="e.g., Maize, Beans, Wheat"
                  value={cropsGrown}
                  onChange={(e) => setCropsGrown(e.target.value)}
                />
                <p className="text-xs text-gray-400">Separate multiple crops with commas</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFarm} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Farm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Farm Grid */}
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
      ) : farms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="rounded-full bg-emerald-50 p-4 mb-4">
              <Sprout className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Farms Registered</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your first farm to start managing your agricultural operations.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{farm.name}</CardTitle>
                  <StatusBadge status={farm.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{farm.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Ruler className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{farm.size_acres} acres</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Leaf className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{farm.soil_type}</span>
                </div>
                {farm.crops_grown.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Sprout className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {farm.crops_grown.map((crop) => (
                        <Badge key={crop} variant="primary" className="text-[10px] px-1.5 py-0">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Added {formatDate(farm.created_at)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/farmer/farms/${farm.id}/crops`)}
                  >
                    <MoreHorizontal className="mr-1 h-3.5 w-3.5" />
                    View Crops
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
