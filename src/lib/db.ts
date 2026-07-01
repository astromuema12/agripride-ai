import { supabase, isSupabaseConfigured } from './supabase';
import {
  generateUsers, generateFarms, generateCrops,
  generateDiseaseReports, generateWeatherData, generateMarketPrices,
  generateSustainabilityScores, generateNotifications, generateAuditLogs,
  generateYieldRecords, generateRecommendations, generateConsentRecords,
} from './demo-data';
import type {
  Farm, Crop, DiseaseReport, Recommendation, WeatherData,
  MarketPrice, SustainabilityScore, Notification, AuditLog,
  YieldRecord, DashboardStats, User, ConsentRecord, ChatMessage,
  YieldPrediction,
} from '@/types';
import { writeAuditLog } from './server-auth';
import { getCollection, getPaginatedCollection, setCollection, getItem, putItem, deleteItem, getTotalCount, getDemoDataKey, clearAllData } from './demo-store';

const DEMO_USERS_COUNT = 10000;
const FARMS_PER_USER = 1;
const CROPS_PER_FARM = 5;
const DISEASE_REPORTS_PER_FARM = 2;

async function ensureSeeded(): Promise<void> {
  const key = await getDemoDataKey();
  const count = await getTotalCount('users', key).catch(() => 0);
  if (count > 0) return;

  const users = generateUsers(DEMO_USERS_COUNT);
  const userIds = users.map((u) => u.id);

  const farms = generateFarms(DEMO_USERS_COUNT * FARMS_PER_USER, userIds);
  const farmIds = farms.map((f) => f.id);

  const sampleSize = Math.min(2000, farmIds.length);
  const sampleFarmIds = farmIds.slice(0, sampleSize);
  const sampleCropIds = generateCrops(sampleSize * CROPS_PER_FARM, sampleFarmIds).map((c) => c.id);

  await Promise.all([
    setCollection('users', users, key),
    setCollection('farms', farms, key),
    setCollection('crops', generateCrops(sampleSize * CROPS_PER_FARM, sampleFarmIds), key),
    setCollection('diseaseReports', generateDiseaseReports(sampleSize * DISEASE_REPORTS_PER_FARM, sampleFarmIds, sampleCropIds, userIds), key),
    setCollection('recommendations', generateRecommendations(userIds), key),
    setCollection('weatherData', generateWeatherData(['Rift Valley', 'Central', 'Coastal', 'Eastern', 'Western', 'Nyanza']), key),
    setCollection('marketPrices', generateMarketPrices(), key),
    setCollection('sustainabilityScores', generateSustainabilityScores(farmIds), key),
    setCollection('notifications', generateNotifications(userIds), key),
    setCollection('auditLogs', generateAuditLogs(userIds), key),
    setCollection('yieldRecords', generateYieldRecords(sampleFarmIds, sampleCropIds), key),
    setCollection('consentRecords', generateConsentRecords(userIds), key),
    setCollection('chatMessages', [], key),
    setCollection('yieldPredictions', [], key),
  ]);
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

  await ensureSeeded();
  const key = await getDemoDataKey();
  const [
    totalUsers, totalFarms, totalCrops, totalDiseaseReports,
    weatherCount, recCount, auditCount,
  ] = await Promise.all([
    getTotalCount('users', key),
    getTotalCount('farms', key),
    getTotalCount('crops', key),
    getTotalCount('diseaseReports', key),
    getTotalCount('weatherData', key),
    getTotalCount('recommendations', key),
    getTotalCount('auditLogs', key),
  ]);

  const [sustainabilityScores, allReports] = await Promise.all([
    getCollection<SustainabilityScore>('sustainabilityScores', key),
    getCollection<DiseaseReport>('diseaseReports', key),
  ]);

  const resolvedCount = allReports.filter((r) => r.status === 'resolved').length;
  return {
    total_users: totalUsers,
    total_farms: totalFarms,
    total_crops: totalCrops,
    total_disease_reports: totalDiseaseReports,
    weather_alerts: weatherCount,
    ai_requests: recCount,
    audit_events: auditCount,
    avg_sustainability_score: sustainabilityScores.length > 0
      ? sustainabilityScores.reduce((a, b) => a + b.overall_score, 0) / sustainabilityScores.length : 0,
    user_growth: 12.5,
    disease_resolution_rate: totalDiseaseReports > 0 ? resolvedCount / totalDiseaseReports : 0,
  };
}

export async function getUsers(limit = 100, offset = 0): Promise<{ data: User[]; total: number }> {
  if (isSupabaseConfigured) {
    const [{ data, count }, { count: total }] = await Promise.all([
      supabase!.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      supabase!.from('users').select('*', { count: 'exact', head: true }),
    ]);
    return { data: (data ?? []) as User[], total: total ?? 0 };
  }
  await ensureSeeded();
  return getPaginatedCollection<User>('users', limit, offset);
}

export async function getFarms(userId?: string, limit = 100, offset = 0): Promise<{ data: Farm[]; total: number }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase!.from('farms').select('*', { count: 'exact' });
      let countQuery = supabase!.from('farms').select('*', { count: 'exact', head: true });
      if (userId) {
        query = query.eq('user_id', userId);
        countQuery = countQuery.eq('user_id', userId);
      }
      const [{ data, count }, { count: total }] = await Promise.all([
        query.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
        countQuery,
      ]);
      if (data && data.length > 0) {
        return { data: data as Farm[], total: total ?? 0 };
      }
    } catch {
      // Fall through to demo store
    }
  }
  await ensureSeeded();
  const all = await getCollection<Farm>('farms');
  const filtered = userId ? all.filter((f) => f.user_id === userId) : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function getFarm(id: string): Promise<Farm | undefined> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('farms').select('*').eq('id', id).single();
    return (data ?? undefined) as Farm | undefined;
  }
  await ensureSeeded();
  return getItem<Farm>('farms', id);
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
    writeAuditLog({ user_id: farm.user_id, action: 'create_farm', resource: 'farms', resource_id: data.id }).catch(() => {});
    return data as Farm;
  }
  await ensureSeeded();
  const newFarm: Farm = {
    ...farm,
    id: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await putItem('farms', newFarm);
  writeAuditLog({ user_id: farm.user_id, action: 'create_farm', resource: 'farms', resource_id: newFarm.id }).catch(() => {});
  return newFarm;
}

export async function updateFarm(id: string, updates: Partial<Farm>): Promise<Farm | undefined> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('farms').update(updates).eq('id', id).select().single();
    writeAuditLog({ user_id: updates.user_id || 'unknown', action: 'update_farm', resource: 'farms', resource_id: id }).catch(() => {});
    return (data ?? undefined) as Farm | undefined;
  }
  await ensureSeeded();
  const existing = await getItem<Farm>('farms', id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await putItem('farms', updated);
  writeAuditLog({ user_id: updated.user_id, action: 'update_farm', resource: 'farms', resource_id: id }).catch(() => {});
  return updated;
}

export async function getCrops(farmId?: string, limit = 100, offset = 0): Promise<{ data: Crop[]; total: number }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase!.from('crops').select('*', { count: 'exact' });
      let countQuery = supabase!.from('crops').select('*', { count: 'exact', head: true });
      if (farmId) {
        query = query.eq('farm_id', farmId);
        countQuery = countQuery.eq('farm_id', farmId);
      }
      const [{ data, count }, { count: total }] = await Promise.all([
        query.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
        countQuery,
      ]);
      if (data && data.length > 0) {
        return { data: data as Crop[], total: total ?? 0 };
      }
    } catch {
      // Fall through to demo store
    }
  }
  await ensureSeeded();
  const all = await getCollection<Crop>('crops');
  const filtered = farmId ? all.filter((c) => c.farm_id === farmId) : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
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
    writeAuditLog({ user_id: 'unknown', action: 'create_crop', resource: 'crops', resource_id: data.id }).catch(() => {});
    return data as Crop;
  }
  await ensureSeeded();
  const newCrop: Crop = { ...crop, id: `crop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: new Date().toISOString() };
  await putItem('crops', newCrop);
  writeAuditLog({ user_id: 'unknown', action: 'create_crop', resource: 'crops', resource_id: newCrop.id }).catch(() => {});
  return newCrop;
}

export async function getDiseaseReports(farmId?: string, limit = 100, offset = 0): Promise<{ data: DiseaseReport[]; total: number }> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('disease_reports').select('*', { count: 'exact' });
    let countQuery = supabase!.from('disease_reports').select('*', { count: 'exact', head: true });
    if (farmId) {
      query = query.eq('farm_id', farmId);
      countQuery = countQuery.eq('farm_id', farmId);
    }
    const [{ data, count }, { count: total }] = await Promise.all([
      query.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      countQuery,
    ]);
    return { data: (data ?? []) as DiseaseReport[], total: total ?? 0 };
  }
  await ensureSeeded();
  const all = await getCollection<DiseaseReport>('diseaseReports');
  const filtered = farmId ? all.filter((r) => r.farm_id === farmId) : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
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
  await ensureSeeded();
  const newReport: DiseaseReport = { ...report, id: `disease-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: new Date().toISOString() };
  await putItem('diseaseReports', newReport);
  return newReport;
}

export async function getRecommendations(userId?: string, limit = 50, offset = 0): Promise<{ data: Recommendation[]; total: number }> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('recommendations').select('*', { count: 'exact' });
    let countQuery = supabase!.from('recommendations').select('*', { count: 'exact', head: true });
    if (userId) {
      query = query.eq('user_id', userId);
      countQuery = countQuery.eq('user_id', userId);
    }
    const [{ data, count }, { count: total }] = await Promise.all([
      query.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      countQuery,
    ]);
    return { data: (data ?? []) as Recommendation[], total: total ?? 0 };
  }
  await ensureSeeded();
  const all = await getCollection<Recommendation>('recommendations');
  const filtered = userId ? all.filter((r) => r.user_id === userId) : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function getWeatherData(location?: string): Promise<WeatherData[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('weather_data').select('*');
    if (location) query = query.eq('location', location);
    const { data } = await query.order('recorded_at', { ascending: false });
    return (data ?? []) as WeatherData[];
  }
  await ensureSeeded();
  const all = await getCollection<WeatherData>('weatherData');
  return location ? all.filter((w) => w.location === location) : all;
}

export async function getMarketPrices(): Promise<MarketPrice[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('market_prices').select('*').order('recorded_at', { ascending: false });
    return (data ?? []) as MarketPrice[];
  }
  await ensureSeeded();
  return getCollection<MarketPrice>('marketPrices');
}

export async function getSustainabilityScores(farmId?: string): Promise<SustainabilityScore[]> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('sustainability_scores').select('*');
    if (farmId) query = query.eq('farm_id', farmId);
    const { data } = await query.order('recorded_at', { ascending: false });
    return (data ?? []) as SustainabilityScore[];
  }
  await ensureSeeded();
  const all = await getCollection<SustainabilityScore>('sustainabilityScores');
  return farmId ? all.filter((s) => s.farm_id === farmId) : all;
}

export async function getNotifications(userId: string, limit = 50, offset = 0): Promise<{ data: Notification[]; total: number }> {
  if (isSupabaseConfigured) {
    const [{ data, count }, { count: total }] = await Promise.all([
      supabase!.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      supabase!.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return { data: (data ?? []) as Notification[], total: total ?? 0 };
  }
  await ensureSeeded();
  const all = await getCollection<Notification>('notifications');
  const filtered = all.filter((n) => n.user_id === userId);
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from('notifications').update({ is_read: true }).eq('id', id);
    return;
  }
  const notif = await getItem<Notification>('notifications', id);
  if (notif) {
    notif.is_read = true;
    await putItem('notifications', notif);
  }
}

export async function getAuditLogs(limit = 100, offset = 0): Promise<{ data: AuditLog[]; total: number }> {
  if (isSupabaseConfigured) {
    const [{ data, count }, { count: total }] = await Promise.all([
      supabase!.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      supabase!.from('audit_logs').select('*', { count: 'exact', head: true }),
    ]);
    return { data: (data ?? []) as AuditLog[], total: total ?? 0 };
  }
  await ensureSeeded();
  return getPaginatedCollection<AuditLog>('auditLogs', limit, offset);
}

export async function getYieldRecords(farmId?: string, limit = 100, offset = 0): Promise<{ data: YieldRecord[]; total: number }> {
  if (isSupabaseConfigured) {
    let query = supabase!.from('yield_records').select('*', { count: 'exact' });
    let countQuery = supabase!.from('yield_records').select('*', { count: 'exact', head: true });
    if (farmId) {
      query = query.eq('farm_id', farmId);
      countQuery = countQuery.eq('farm_id', farmId);
    }
    const [{ data, count }, { count: total }] = await Promise.all([
      query.order('harvest_date', { ascending: false }).range(offset, offset + limit - 1),
      countQuery,
    ]);
    return { data: (data ?? []) as YieldRecord[], total: total ?? 0 };
  }
  await ensureSeeded();
  const all = await getCollection<YieldRecord>('yieldRecords');
  const filtered = farmId ? all.filter((y) => y.farm_id === farmId) : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function getChatMessages(userId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.from('chat_messages').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    return (data ?? []) as ChatMessage[];
  }
  await ensureSeeded();
  const all = await getCollection<ChatMessage>('chatMessages');
  return all.filter((m) => m.user_id === userId);
}

export async function addChatMessage(msg: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    ...msg,
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('chat_messages').insert(newMsg).select().single();
    if (error) throw new Error(error.message);
    return data as ChatMessage;
  }
  await putItem('chatMessages', newMsg);
  return newMsg;
}

export async function getYieldPredictions(farmId?: string): Promise<YieldPrediction[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase!.from('yield_predictions').select('*');
      if (farmId) query = query.eq('farm_id', farmId);
      const { data } = await query.order('created_at', { ascending: false });
      if (data && data.length > 0) {
        return data as YieldPrediction[];
      }
    } catch {
      // Fall through to demo store
    }
  }
  await ensureSeeded();
  const all = await getCollection<YieldPrediction>('yieldPredictions');
  return farmId ? all.filter((p) => p.farm_id === farmId) : all;
}

export async function saveYieldPrediction(pred: Omit<YieldPrediction, 'id' | 'created_at'>): Promise<YieldPrediction> {
  const newPred: YieldPrediction = {
    ...pred,
    id: `yp-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('yield_predictions').insert(newPred).select().single();
    if (error) throw new Error(error.message);
    return data as YieldPrediction;
  }
  await putItem('yieldPredictions', newPred);
  return newPred;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase!.from('notifications').update({ is_read: true }).eq('user_id', userId);
    return;
  }
  const all = await getCollection<Notification>('notifications');
  const changed = all.filter((n) => n.user_id === userId && !n.is_read);
  for (const n of changed) {
    n.is_read = true;
    await putItem('notifications', n);
  }
}

export async function updateUserProfile(userId: string, updates: { name?: string }): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from('users').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
    return;
  }
  const existing = await getItem<User>('users', userId);
  if (existing) {
    existing.name = updates.name ?? existing.name;
    existing.updated_at = new Date().toISOString();
    await putItem('users', existing);
  }
}

export async function updateUserConsent(userId: string, type: ConsentRecord['type'], granted: boolean): Promise<void> {
  if (isSupabaseConfigured) {
    const existing = await supabase!.from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .single();
    if (existing.data) {
      await supabase!.from('consent_records')
        .update({ granted, revoked_at: granted ? null : new Date().toISOString() })
        .eq('id', existing.data.id);
    } else {
      await supabase!.from('consent_records').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        type,
        granted,
        granted_at: new Date().toISOString(),
      });
    }
    return;
  }
  const all = await getCollection<ConsentRecord>('consentRecords');
  const idx = all.findIndex((c) => c.user_id === userId && c.type === type);
  if (idx !== -1) {
    all[idx] = {
      ...all[idx],
      granted,
      revoked_at: granted ? undefined : new Date().toISOString(),
    };
    await setCollection('consentRecords', all);
  } else {
    await putItem('consentRecords', {
      id: `consent-${userId}-${type}`,
      user_id: userId,
      type,
      granted,
      granted_at: new Date().toISOString(),
    });
  }
}
