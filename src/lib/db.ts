import { supabase, isSupabaseConfigured } from './supabase';
import {
  DEMO_DATA_KEY, demoUsers, generateFarms, generateCrops,
  generateDiseaseReports, generateWeatherData, generateMarketPrices,
  generateSustainabilityScores, generateNotifications, generateAuditLogs,
  generateYieldRecords, generateRecommendations, generateConsentRecords,
} from './demo-data';
import type {
  Farm, Crop, DiseaseReport, Recommendation, WeatherData,
  MarketPrice, SustainabilityScore, Notification, AuditLog,
  YieldRecord, DashboardStats, User, ConsentRecord,
} from '@/types';

interface DemoStore {
  users: User[];
  farms: Farm[];
  crops: Crop[];
  diseaseReports: DiseaseReport[];
  recommendations: Recommendation[];
  weatherData: WeatherData[];
  marketPrices: MarketPrice[];
  sustainabilityScores: SustainabilityScore[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  yieldRecords: YieldRecord[];
  consentRecords: ConsentRecord[];
}

function getStore(): DemoStore {
  if (typeof window === 'undefined') {
    return {} as DemoStore;
  }
  const stored = localStorage.getItem(DEMO_DATA_KEY);
  if (stored) return JSON.parse(stored);

  const userIds = demoUsers.map((u) => u.id);
  const farms = generateFarms(100, userIds);
  const farmIds = farms.map((f) => f.id);
  const crops = generateCrops(500, farmIds);
  const cropIds = crops.map((c) => c.id);
  const store: DemoStore = {
    users: demoUsers,
    farms,
    crops,
    diseaseReports: generateDiseaseReports(100, farmIds, cropIds, userIds),
    recommendations: generateRecommendations(userIds),
    weatherData: generateWeatherData(['Rift Valley', 'Central', 'Coastal', 'Eastern', 'Western', 'Nyanza']),
    marketPrices: generateMarketPrices(),
    sustainabilityScores: generateSustainabilityScores(farmIds),
    notifications: generateNotifications(userIds),
    auditLogs: generateAuditLogs(userIds),
    yieldRecords: generateYieldRecords(farmIds, cropIds),
    consentRecords: generateConsentRecords(userIds),
  };
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(store));
  return store;
}

function saveStore(store: DemoStore) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(store));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isSupabaseConfigured) {
    const [
      { count: totalUsers },
      { count: totalFarms },
      { count: totalCrops },
      { count: totalDiseaseReports },
      { count: weatherAlerts },
      { count: aiRequests },
      { count: auditEvents },
      { data: sustainabilityData },
      { data: resolvedData },
    ] = await Promise.all([
      supabase!.from('users').select('*', { count: 'exact', head: true }),
      supabase!.from('farms').select('*', { count: 'exact', head: true }),
      supabase!.from('crops').select('*', { count: 'exact', head: true }),
      supabase!.from('disease_reports').select('*', { count: 'exact', head: true }),
      supabase!.from('weather_data').select('*', { count: 'exact', head: true }),
      supabase!.from('recommendations').select('*', { count: 'exact', head: true }),
      supabase!.from('audit_logs').select('*', { count: 'exact', head: true }),
      supabase!.from('sustainability_scores').select('overall_score'),
      supabase!.from('disease_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    ]);

    const avgScore = sustainabilityData && sustainabilityData.length > 0
      ? sustainabilityData.reduce((a: number, b: { overall_score: number }) => a + b.overall_score, 0) / sustainabilityData.length
      : 0;

    return {
      total_users: totalUsers ?? 0,
      total_farms: totalFarms ?? 0,
      total_crops: totalCrops ?? 0,
      total_disease_reports: totalDiseaseReports ?? 0,
      weather_alerts: weatherAlerts ?? 0,
      ai_requests: aiRequests ?? 0,
      audit_events: auditEvents ?? 0,
      avg_sustainability_score: avgScore,
      user_growth: 12.5,
      disease_resolution_rate: totalDiseaseReports && totalDiseaseReports > 0
        ? (resolvedData?.length ?? 0) / totalDiseaseReports : 0,
    };
  }

  const store = getStore();
  const resolvedCount = store.diseaseReports.filter((r) => r.status === 'resolved').length;
  return {
    total_users: store.users.length,
    total_farms: store.farms.length,
    total_crops: store.crops.length,
    total_disease_reports: store.diseaseReports.length,
    weather_alerts: store.weatherData.length,
    ai_requests: store.recommendations.length,
    audit_events: store.auditLogs.length,
    avg_sustainability_score: store.sustainabilityScores.reduce((a, b) => a + b.overall_score, 0) / store.sustainabilityScores.length,
    user_growth: 12.5,
    disease_resolution_rate: store.diseaseReports.length > 0 ? resolvedCount / store.diseaseReports.length : 0,
  };
}

export async function getFarms(userId?: string): Promise<Farm[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('farms').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data ?? []) as Farm[];
  }
  const store = getStore();
  return userId ? store.farms.filter((f) => f.user_id === userId) : store.farms;
}

export async function getFarm(id: string): Promise<Farm | undefined> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('farms').select('*').eq('id', id).single();
    return (data ?? undefined) as Farm | undefined;
  }
  const store = getStore();
  return store.farms.find((f) => f.id === id);
}

export async function createFarm(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('farms').insert({
      user_id: farm.user_id,
      name: farm.name,
      location: farm.location,
      size_acres: farm.size_acres,
      soil_type: farm.soil_type,
      crops_grown: farm.crops_grown,
      status: farm.status,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as Farm;
  }
  const store = getStore();
  const newFarm: Farm = {
    ...farm,
    id: `farm-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.farms.push(newFarm);
  saveStore(store);
  return newFarm;
}

export async function updateFarm(id: string, updates: Partial<Farm>): Promise<Farm | undefined> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('farms').update(updates).eq('id', id).select().single();
    return (data ?? undefined) as Farm | undefined;
  }
  const store = getStore();
  const index = store.farms.findIndex((f) => f.id === id);
  if (index === -1) return undefined;
  store.farms[index] = { ...store.farms[index], ...updates, updated_at: new Date().toISOString() };
  saveStore(store);
  return store.farms[index];
}

export async function getCrops(farmId?: string): Promise<Crop[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('crops').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data ?? []) as Crop[];
  }
  const store = getStore();
  return farmId ? store.crops.filter((c) => c.farm_id === farmId) : store.crops;
}

export async function createCrop(crop: Omit<Crop, 'id' | 'created_at'>): Promise<Crop> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('crops').insert({
      farm_id: crop.farm_id,
      name: crop.name,
      variety: crop.variety,
      planting_date: crop.planting_date,
      area_acres: crop.area_acres,
      status: crop.status,
      expected_yield_kg: crop.expected_yield_kg,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as Crop;
  }
  const store = getStore();
  const newCrop: Crop = { ...crop, id: `crop-${Date.now()}`, created_at: new Date().toISOString() };
  store.crops.push(newCrop);
  saveStore(store);
  return newCrop;
}

export async function getDiseaseReports(farmId?: string): Promise<DiseaseReport[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('disease_reports').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data ?? []) as DiseaseReport[];
  }
  const store = getStore();
  return farmId ? store.diseaseReports.filter((r) => r.farm_id === farmId) : store.diseaseReports;
}

export async function createDiseaseReport(report: Omit<DiseaseReport, 'id' | 'created_at'>): Promise<DiseaseReport> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('disease_reports').insert({
      farm_id: report.farm_id,
      crop_id: report.crop_id,
      user_id: report.user_id,
      crop_type: report.crop_type,
      symptoms: report.symptoms,
      disease_prediction: report.disease_prediction,
      confidence_score: report.confidence_score,
      risk_level: report.risk_level,
      treatment: report.treatment,
      prevention: report.prevention,
      explanation: report.explanation,
      status: report.status,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as DiseaseReport;
  }
  const store = getStore();
  const newReport: DiseaseReport = { ...report, id: `disease-${Date.now()}`, created_at: new Date().toISOString() };
  store.diseaseReports.push(newReport);
  saveStore(store);
  return newReport;
}

export async function getRecommendations(userId?: string): Promise<Recommendation[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('recommendations').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query.order('created_at', { ascending: false });
    return (data ?? []) as Recommendation[];
  }
  const store = getStore();
  return userId ? store.recommendations.filter((r) => r.user_id === userId) : store.recommendations;
}

export async function getWeatherData(location?: string): Promise<WeatherData[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('weather_data').select('*');
    if (location) query = query.eq('location', location);
    const { data } = await query.order('recorded_at', { ascending: false });
    return (data ?? []) as WeatherData[];
  }
  const store = getStore();
  return location ? store.weatherData.filter((w) => w.location === location) : store.weatherData;
}

export async function getMarketPrices(): Promise<MarketPrice[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('market_prices').select('*').order('recorded_at', { ascending: false });
    return (data ?? []) as MarketPrice[];
  }
  const store = getStore();
  return store.marketPrices;
}

export async function getSustainabilityScores(farmId?: string): Promise<SustainabilityScore[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('sustainability_scores').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data } = await query.order('recorded_at', { ascending: false });
    return (data ?? []) as SustainabilityScore[];
  }
  const store = getStore();
  return farmId ? store.sustainabilityScores.filter((s) => s.farm_id === farmId) : store.sustainabilityScores;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('notifications').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Notification[];
  }
  const store = getStore();
  return store.notifications.filter((n) => n.user_id === userId);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from('notifications').update({ is_read: true }).eq('id', id);
    return;
  }
  const store = getStore();
  const notif = store.notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    saveStore(store);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('audit_logs').select('*').order('created_at', { ascending: false });
    return (data ?? []) as AuditLog[];
  }
  const store = getStore();
  return store.auditLogs;
}

export async function getYieldRecords(farmId?: string): Promise<YieldRecord[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('yield_records').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data } = await query.order('harvest_date', { ascending: false });
    return (data ?? []) as YieldRecord[];
  }
  const store = getStore();
  return farmId ? store.yieldRecords.filter((y) => y.farm_id === farmId) : store.yieldRecords;
}

export async function getUsers(): Promise<User[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('users').select('*').order('created_at', { ascending: false });
    return (data ?? []) as User[];
  }
  const store = getStore();
  return store.users;
}

export { getStore };
