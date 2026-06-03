export type UserRole = 'farmer' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_suspended: boolean;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location: string;
  size_acres: number;
  soil_type: string;
  crops_grown: string[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface Crop {
  id: string;
  farm_id: string;
  name: string;
  variety: string;
  planting_date: string;
  harvest_date?: string;
  area_acres: number;
  status: 'growing' | 'harvested' | 'failed';
  expected_yield_kg: number;
  actual_yield_kg?: number;
  created_at: string;
}

export interface DiseaseReport {
  id: string;
  farm_id: string;
  crop_id: string;
  user_id: string;
  crop_type: string;
  symptoms: string;
  image_url?: string;
  disease_prediction?: string;
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  treatment?: string;
  prevention?: string;
  explanation?: string;
  status: 'submitted' | 'reviewed' | 'resolved';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  type: 'crop_advisor' | 'disease' | 'weather' | 'general';
  title: string;
  content: string;
  source_data?: Record<string, unknown>;
  confidence_score?: number;
  responsible_agent?: string;
  frameworks?: string[];
  is_read: boolean;
  created_at: string;
}

export interface WeatherData {
  id: string;
  location: string;
  temperature: number;
  humidity: number;
  rainfall_mm: number;
  wind_speed: number;
  condition: string;
  forecast: WeatherForecast[];
  recorded_at: string;
}

export interface WeatherForecast {
  date: string;
  temp_high: number;
  temp_low: number;
  condition: string;
  rainfall_chance: number;
}

export interface YieldRecord {
  id: string;
  farm_id: string;
  crop_id: string;
  harvest_date: string;
  yield_kg: number;
  area_acres: number;
  quality_rating?: number;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'weather_alert' | 'disease_alert' | 'recommendation' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  type: 'data_collection' | 'ai_processing' | 'disease_diagnosis' | 'weather_monitoring';
  granted: boolean;
  granted_at: string;
  revoked_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface MarketPrice {
  id: string;
  crop: string;
  region: string;
  price_per_kg: number;
  currency: string;
  trend: 'up' | 'down' | 'stable';
  recorded_at: string;
}

export interface SustainabilityScore {
  id: string;
  farm_id: string;
  soil_health: number;
  water_usage: number;
  biodiversity: number;
  carbon_footprint: number;
  overall_score: number;
  recorded_at: string;
}

export interface AIAgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  confidence_score?: number;
  responsible_agent?: string;
  frameworks_used?: string[];
  timestamp?: string;
}

export interface DashboardStats {
  total_users: number;
  total_farms: number;
  total_crops: number;
  total_disease_reports: number;
  weather_alerts: number;
  ai_requests: number;
  audit_events: number;
  avg_sustainability_score: number;
  user_growth: number;
  disease_resolution_rate: number;
}
