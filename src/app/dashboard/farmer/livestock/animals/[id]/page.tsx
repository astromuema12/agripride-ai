'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAnimalById, getFarms, getHealthRecords, getVaccinationRecords, getMilkProduction, getBreedingRecords, getFeedRecords, updateAnimal } from '@/lib/db';
import type { Animal, Farm, HealthRecord, VaccinationRecord, MilkProduction, BreedingRecord, FeedRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  PawPrint, Calendar, MapPin, Syringe, Heart, Milk, Activity,
  AlertTriangle, ArrowLeft, Edit3, Weight, Droplets,
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

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [milkProduction, setMilkProduction] = useState<MilkProduction[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const [animalData, { data: userFarms }, healthData, vaxData, milkData, breedData, feedData] = await Promise.all([
          getAnimalById(id as string),
          getFarms(user.id),
          getHealthRecords(id as string),
          getVaccinationRecords(id as string),
          getMilkProduction(id as string),
          getBreedingRecords(id as string),
          getFeedRecords(id as string),
        ]);
        if (!animalData) {
          toast.error('Animal not found');
          router.push('/dashboard/farmer/livestock');
          return;
        }
        setAnimal(animalData);
        setFarm(userFarms.find((f) => f.id === animalData.farm_id) ?? null);
        setHealthRecords(healthData);
        setVaccinations(vaxData);
        setMilkProduction(milkData);
        setBreedingRecords(breedData);
        setFeedRecords(feedData);
      } catch {
        toast.error('Failed to load animal details');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id, router]);

  if (!user || !animal) return null;

  const ongoingHealthIssues = healthRecords.filter((h) => h.outcome === 'ongoing');
  const totalMilkKg = milkProduction.reduce((sum, m) => sum + m.total_kg, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{animal.name ?? animal.tag_number}</h1>
            <HealthStatusBadge status={animal.health_status} />
            <VaccinationStatusBadge status={animal.vaccination_status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Tag: {animal.tag_number} &middot; {CATEGORY_MAP[animal.category] ?? animal.category} &middot; {animal.breed} &middot; {animal.gender === 'male' ? 'Male' : 'Female'}
          </p>
        </div>
      </div>

      {ongoingHealthIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <strong>{ongoingHealthIssues.length} ongoing health issue{ongoingHealthIssues.length !== 1 ? 's' : ''}:</strong>
              {ongoingHealthIssues.map((h) => (
                <span key={h.id} className="block ml-2">&bull; {h.condition} — {h.treatment ?? 'Under observation'}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-blue-50">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Born</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(animal.birth_date)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-purple-50">
              <Weight className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Weight</p>
              <p className="text-lg font-bold text-gray-900">{animal.weight_kg ? `${animal.weight_kg} kg` : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-amber-50">
              <Syringe className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Vaccinations</p>
              <p className="text-lg font-bold text-gray-900">{vaccinations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-green-50">
              <Milk className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Milk</p>
              <p className="text-lg font-bold text-gray-900">{totalMilkKg > 0 ? `${totalMilkKg.toFixed(0)} kg` : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="health">Health Records ({healthRecords.length})</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations ({vaccinations.length})</TabsTrigger>
          <TabsTrigger value="milk">Milk Production ({milkProduction.length})</TabsTrigger>
          <TabsTrigger value="breeding">Breeding ({breedingRecords.length})</TabsTrigger>
          <TabsTrigger value="feeding">Feeding ({feedRecords.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No health records found.</p>
              ) : (
                <div className="space-y-4">
                  {healthRecords.map((record) => (
                    <Card key={record.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{record.condition}</p>
                            <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                          </div>
                          <Badge variant={
                            record.outcome === 'recovered' ? 'primary' :
                            record.outcome === 'ongoing' ? 'destructive' : 'warning'
                          }>
                            {record.outcome}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Symptoms:</span> {record.symptoms}</p>
                          {record.diagnosis && <p><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>}
                          {record.treatment && <p><span className="font-medium">Treatment:</span> {record.treatment}</p>}
                          {record.veterinarian && <p><span className="font-medium">Vet:</span> {record.veterinarian}</p>}
                          {record.cost_kes && <p><span className="font-medium">Cost:</span> KES {record.cost_kes.toLocaleString()}</p>}
                          {record.follow_up_date && <p><span className="font-medium">Follow-up:</span> {formatDate(record.follow_up_date)}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-amber-500" />
                Vaccination Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No vaccination records found.</p>
              ) : (
                <div className="space-y-3">
                  {vaccinations.map((vax) => (
                    <Card key={vax.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{vax.vaccine_name}</p>
                            <p className="text-sm text-gray-500">Administered: {formatDate(vax.date_administered)}</p>
                          </div>
                          {vax.next_due_date && (
                            <Badge variant="warning">Due {formatDate(vax.next_due_date)}</Badge>
                          )}
                        </div>
                        {vax.batch_number && (
                          <p className="text-sm text-gray-500 mt-1">Batch: {vax.batch_number}</p>
                        )}
                        {vax.notes && <p className="text-sm text-gray-500 mt-1">{vax.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Milk className="h-5 w-5 text-blue-500" />
                Milk Production Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milkProduction.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No milk production records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Morning (kg)</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Evening (kg)</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-500">Total (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milkProduction.slice(0, 50).map((milk) => (
                        <tr key={milk.id} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-gray-900">{milk.date}</td>
                          <td className="py-2 px-2 text-right text-gray-900">{milk.morning_kg}</td>
                          <td className="py-2 px-2 text-right text-gray-900">{milk.evening_kg}</td>
                          <td className="py-2 px-2 text-right font-medium text-gray-900">{milk.total_kg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breeding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Breeding Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breedingRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No breeding records found.</p>
              ) : (
                <div className="space-y-3">
                  {breedingRecords.map((record) => (
                    <Card key={record.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {record.method === 'artificial_insemination' ? 'AI' : 'Natural'} Breeding
                          </p>
                          <Badge variant={
                            record.outcome === 'successful' ? 'primary' :
                            record.outcome === 'failed' ? 'destructive' : 'warning'
                          }>
                            {record.outcome ?? 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">Date: {formatDate(record.breeding_date)}</p>
                        {record.sire_breed && <p className="text-sm text-gray-500">Sire breed: {record.sire_breed}</p>}
                        {record.expected_delivery && <p className="text-sm text-gray-500">Expected: {formatDate(record.expected_delivery)}</p>}
                        {record.delivery_date && <p className="text-sm text-gray-500">Delivered: {formatDate(record.delivery_date)}</p>}
                        {record.offspring_count != null && <p className="text-sm text-gray-500">Offspring: {record.offspring_count}</p>}
                        {record.notes && <p className="text-sm text-gray-500 mt-1">{record.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feeding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-green-500" />
                Feeding Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No feeding records found.</p>
              ) : (
                <div className="space-y-3">
                  {feedRecords.map((feed) => (
                    <Card key={feed.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{feed.feed_type}</p>
                            <p className="text-sm text-gray-500">{formatDate(feed.date)}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{feed.quantity_kg} kg</span>
                        </div>
                        {feed.cost_kes != null && (
                          <p className="text-sm text-gray-500 mt-1">Cost: KES {feed.cost_kes.toLocaleString()}</p>
                        )}
                        {feed.notes && <p className="text-sm text-gray-500 mt-1">{feed.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
