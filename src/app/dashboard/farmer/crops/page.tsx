'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCrops, createCrop, getFarms } from '@/lib/db';
import type { Crop, Farm } from '@/types';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
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
  Sprout, Plus, Calendar, MapPin, Ruler, Package, Sparkles,
  Sun, CloudSun, Wind, Cherry,
} from 'lucide-react';

const CROP_TYPES = ['Maize', 'Wheat', 'Rice', 'Cassava', 'Beans', 'Coffee', 'Tea', 'Cotton', 'Sorghum', 'Millet', 'Groundnuts', 'Sunflower', 'Sugarcane', 'Sweet Potato'];

const GROWTH_DURATION_DAYS: Record<string, number> = {
  maize: 120, wheat: 110, rice: 150, cassava: 300, beans: 90,
  coffee: 180, tea: 365, cotton: 160, sorghum: 120, millet: 100,
  groundnuts: 120, sunflower: 110, sugarcane: 365, sweet_potato: 150,
};

const STAGE_ICONS: Record<number, typeof Sprout> = {
  0: Sprout,
  1: Sun,
  2: Wind,
  3: Cherry,
  4: Package,
};

const STAGE_NAMES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting'] as const;

function computeGrowthStage(plantingDate: string, cropName: string): { stage: number; stageName: string; pct: number; daysLeft: number } {
  const key = cropName.toLowerCase().replace(/\s+/g, '_');
  const totalDays = GROWTH_DURATION_DAYS[key] || 120;
  const planted = new Date(plantingDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  const pct = Math.min(100, Math.max(0, (daysSince / totalDays) * 100));
  let stage = 0;
  if (pct >= 90) stage = 4;
  else if (pct >= 70) stage = 3;
  else if (pct >= 50) stage = 2;
  else if (pct >= 20) stage = 1;
  const daysLeft = Math.max(0, totalDays - daysSince);
  return { stage, stageName: STAGE_NAMES[stage], pct, daysLeft };
}

function StatusBadge({ status }: { status: Crop['status'] }) {
  const { t } = useI18n();
  const map: Record<string, { variant: 'primary' | 'warning' | 'destructive'; label: string }> = {
    growing: { variant: 'primary', label: t('crops.statuses.growing') },
    harvested: { variant: 'warning', label: t('crops.statuses.harvested') },
    failed: { variant: 'destructive', label: t('crops.statuses.failed') },
  };
  const { variant, label } = map[status] ?? map.growing;
  return <Badge variant={variant}>{label}</Badge>;
}

function GrowthStageBar({ crop }: { crop: Crop }) {
  const { t } = useI18n();
  const growth = useMemo(() => computeGrowthStage(crop.planting_date, crop.name), [crop.planting_date, crop.name]);
  const Icon = STAGE_ICONS[growth.stage];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-gray-700">
            {t(`cropsEnhanced.stage.${growth.stageName}`)}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{growth.daysLeft} {t('cropsEnhanced.daysToHarvest')}</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 transition-all duration-700"
          style={{ width: `${growth.pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-full" />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{t('cropsEnhanced.stage.seedling')}</span>
        <span>{t('cropsEnhanced.stage.vegetative')}</span>
        <span>{t('cropsEnhanced.stage.flowering')}</span>
        <span>{t('cropsEnhanced.stage.fruiting')}</span>
        <span>{t('cropsEnhanced.stage.harvesting')}</span>
      </div>
      <div className="relative" style={{ left: `${Math.min(growth.pct, 95)}%`, width: 0, height: 0 }}>
        <div className="absolute -translate-x-1/2 -top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
      </div>
      <p className="text-[10px] text-emerald-600 italic">
        <Sparkles className="w-3 h-3 inline mr-0.5" />
        {t(`cropsEnhanced.taskTips.${growth.stageName}`)}
      </p>
    </div>
  );
}

export default function CropsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
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
        toast.error(t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, t]);

  const handleCreateCrop = async () => {
    if (!user) return;
    if (!cropName || !variety.trim() || !farmId || !plantingDate || !areaAcres || Number(areaAcres) <= 0) {
      toast.error(t('crops.fillRequired'));
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
      toast.success(t('crops.addSuccess'));
      setDialogOpen(false);
      setCropName(''); setVariety(''); setFarmId(''); setPlantingDate(''); setAreaAcres(''); setExpectedYield('');
    } catch {
      toast.error(t('crops.addFailed'));
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
    { icon: Sprout, label: t('crops.total'), value: totalCrops, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Sprout, label: t('crops.statuses.growing'), value: growing, color: 'text-green-600 bg-green-50' },
    { icon: Package, label: t('crops.statuses.harvested'), value: harvested, color: 'text-amber-600 bg-amber-50' },
    { icon: Sprout, label: t('crops.statuses.failed'), value: failed, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6 page-enter">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-950 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium backdrop-blur-sm border border-white/10">
              <Sprout className="w-3 h-3" />
              {t('crops.title')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('crops.title')}</h1>
          <p className="mt-2 text-emerald-100/80 max-w-xl">{t('crops.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('crops.addCrop')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('crops.dialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('crops.dialogDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="crop-name">{t('crops.name')}</Label>
                <Select value={cropName} onValueChange={setCropName}>
                  <SelectTrigger id="crop-name">
                    <SelectValue placeholder={t('crops.selectCrop')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-variety">{t('crops.variety')}</Label>
                <Input
                  id="crop-variety"
                  placeholder={t('crops.varietyPlaceholder')}
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-farm">{t('crops.selectFarm')}</Label>
                <Select value={farmId} onValueChange={setFarmId}>
                  <SelectTrigger id="crop-farm">
                    <SelectValue placeholder={t('crops.selectFarmPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-date">{t('crops.plantingDate')}</Label>
                <Input
                  id="crop-date"
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-area">{t('crops.areaAcres')}</Label>
                <Input
                  id="crop-area"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t('crops.areaPlaceholder')}
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop-yield">{t('crops.expectedYield')}</Label>
                <Input
                  id="crop-yield"
                  type="number"
                  min="0"
                  placeholder={t('crops.yieldPlaceholder')}
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateCrop} disabled={submitting}>
                  {submitting ? t('common.adding') : t('crops.addCrop')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 stagger-grid">
        {stats.map((stat) => (
          <Card key={stat.label} className="premium-card">
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="growing">{t('crops.statuses.growing')}</TabsTrigger>
          <TabsTrigger value="harvested">{t('crops.statuses.harvested')}</TabsTrigger>
          <TabsTrigger value="failed">{t('crops.statuses.failed')}</TabsTrigger>
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
            <Card className="premium-card">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="empty-state-icon">
                  <Sprout className="h-7 w-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {statusFilter === 'all' ? t('crops.noCrops') : t('crops.noCropsStatus').replace('{status}', statusFilter)}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {statusFilter === 'all' ? t('crops.noCropsDesc') : t('crops.noCropsMatch')}
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('crops.addFirst')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((crop) => {
                const farm = farmMap.get(crop.farm_id);
                return (
                  <Card key={crop.id} className="premium-card">
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
                        <span>{t('crops.variety')}: {crop.variety}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{farm?.name || t('common.unknown')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{t('crops.planted')} {formatDate(crop.planting_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Ruler className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{crop.area_acres} {t('crops.acres')}</span>
                      </div>
                      {crop.expected_yield_kg > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{t('crops.expected')}: {crop.expected_yield_kg.toLocaleString()} {t('crops.kg')}</span>
                        </div>
                      )}
                      {crop.status === 'growing' && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                            {t('cropsEnhanced.growthStages')}
                          </p>
                          <GrowthStageBar crop={crop} />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{t('crops.added')} {formatDate(crop.created_at)}</span>
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
