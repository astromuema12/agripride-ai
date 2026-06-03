import { supabase, isSupabaseConfigured } from './supabase';
import {
  DEMO_DATA_KEY, demoUsers, generateFarms, generateCrops,
  generateDiseaseReports, generateWeatherData, generateMarketPrices,
  generateSustainabilityScores, generateNotifications, generateAuditLogs,
  generateYieldRecords, generateRecommendations, generateConsentRecords,
} from './demo-data';
import {
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

async function supabaseQuery(_table: string, _action: string, _params?: unknown) {
  return null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
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
  const store = getStore();
  return userId ? store.farms.filter((f) => f.user_id === userId) : store.farms;
}

export async function getFarm(id: string): Promise<Farm | undefined> {
  const store = getStore();
  return store.farms.find((f) => f.id === id);
}

export async function createFarm(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
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
  const store = getStore();
  const index = store.farms.findIndex((f) => f.id === id);
  if (index === -1) return undefined;
  store.farms[index] = { ...store.farms[index], ...updates, updated_at: new Date().toISOString() };
  saveStore(store);
  return store.farms[index];
}

export async function getCrops(farmId?: string): Promise<Crop[]> {
  const store = getStore();
  return farmId ? store.crops.filter((c) => c.farm_id === farmId) : store.crops;
}

export async function createCrop(crop: Omit<Crop, 'id' | 'created_at'>): Promise<Crop> {
  const store = getStore();
  const newCrop: Crop = { ...crop, id: `crop-${Date.now()}`, created_at: new Date().toISOString() };
  store.crops.push(newCrop);
  saveStore(store);
  return newCrop;
}

export async function getDiseaseReports(farmId?: string): Promise<DiseaseReport[]> {
  const store = getStore();
  return farmId ? store.diseaseReports.filter((r) => r.farm_id === farmId) : store.diseaseReports;
}

export async function createDiseaseReport(report: Omit<DiseaseReport, 'id' | 'created_at'>): Promise<DiseaseReport> {
  const store = getStore();
  const newReport: DiseaseReport = { ...report, id: `disease-${Date.now()}`, created_at: new Date().toISOString() };
  store.diseaseReports.push(newReport);
  saveStore(store);
  return newReport;
}

export async function getRecommendations(userId?: string): Promise<Recommendation[]> {
  const store = getStore();
  return userId ? store.recommendations.filter((r) => r.user_id === userId) : store.recommendations;
}

export async function getWeatherData(location?: string): Promise<WeatherData[]> {
  const store = getStore();
  return location ? store.weatherData.filter((w) => w.location === location) : store.weatherData;
}

export async function getMarketPrices(): Promise<MarketPrice[]> {
  const store = getStore();
  return store.marketPrices;
}

export async function getSustainabilityScores(farmId?: string): Promise<SustainabilityScore[]> {
  const store = getStore();
  return farmId ? store.sustainabilityScores.filter((s) => s.farm_id === farmId) : store.sustainabilityScores;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const store = getStore();
  return store.notifications.filter((n) => n.user_id === userId);
}

export async function markNotificationRead(id: string): Promise<void> {
  const store = getStore();
  const notif = store.notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    saveStore(store);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const store = getStore();
  return store.auditLogs;
}

export async function getYieldRecords(farmId?: string): Promise<YieldRecord[]> {
  const store = getStore();
  return farmId ? store.yieldRecords.filter((y) => y.farm_id === farmId) : store.yieldRecords;
}

export async function getUsers(): Promise<User[]> {
  const store = getStore();
  return store.users;
}

export { getStore };
