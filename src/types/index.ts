export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'unknown';

export type SymptomCategory = 'leaf' | 'flower' | 'fruit_nut' | 'stem_root' | 'environmental_stress' | 'general';

export type Likelihood = 'high' | 'medium' | 'low';

export type ConditionType = 'disease' | 'stress' | 'physiological' | 'nutrient_deficiency' | 'pest';

export interface PossibleCause {
  name: string;
  type: ConditionType;
  pathogen?: string;
  likelihood: Likelihood;
  confidence: number;
  treatment?: string;
  prevention?: string;
}

export interface DiagnosisResult {
  primaryDiagnosis?: PossibleCause;
  possibleCauses: PossibleCause[];
  confidenceRange: { min: number; max: number };
  reasoning: {
    summary: string;
    symptomInfluences: string[];
    uncertainties: string[];
    growthStageNote?: string;
  };
  symptomCategories: Partial<Record<SymptomCategory, string[]>>;
  growthStage: GrowthStage;
  uncertaintyLevel: 'low' | 'moderate' | 'high';
  requestMoreInfo: boolean;
  missingInfo?: string[];
}

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
  growth_stage?: GrowthStage;
  image_url?: string;
  disease_prediction?: string;
  possible_causes?: PossibleCause[];
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  treatment?: string;
  prevention?: string;
  explanation?: string;
  reasoning?: string;
  uncertainty_level?: 'low' | 'moderate' | 'high';
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
  possible_causes?: PossibleCause[];
  reasoning?: {
    summary: string;
    symptomInfluences: string[];
    uncertainties: string[];
    growthStageNote?: string;
  };
  uncertainty_level?: 'low' | 'moderate' | 'high';
  responsible_agent?: string;
  frameworks_used?: string[];
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_name?: string;
  confidence_score?: number;
  frameworks_used?: string[];
  created_at: string;
}

export interface YieldPrediction {
  id: string;
  farm_id: string;
  crop_name: string;
  planting_date: string;
  predicted_yield_kg: number;
  confidence_score: number;
  factors: string[];
  created_at: string;
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

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'spam';
  admin_response?: string;
  responded_at?: string;
  responded_by?: string;
  created_at: string;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  name?: string;
  phone?: string;
  county?: string;
  farm_size_acres?: number;
  crop_types: string[];
  has_livestock: boolean;
  livestock_details?: string;
  gps_lat?: number;
  gps_lng?: number;
  goals: string[];
  ai_personalized: boolean;
  consent_ai?: boolean;
  onboarding_completed: boolean;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'cooperative' | 'enterprise';
  price_kes: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  mpesa_receipt?: string;
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  user_id?: string;
  name: string;
  location?: string;
  farm_type?: string;
  photo_url?: string;
  content: string;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  description?: string;
  category?: string;
  email?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface MpesaTransaction {
  id: string;
  user_id?: string;
  phone: string;
  amount: number;
  receipt_number?: string;
  transaction_id?: string;
  result_code?: number;
  result_desc?: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  user_id?: string;
  endpoint: string;
  tokens_used: number;
  response_time_ms: number;
  model?: string;
  success: boolean;
  created_at: string;
}

export interface PlatformStat {
  id: string;
  metric_name: string;
  metric_value: number;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type FlutterwavePaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled';

export interface FlutterwaveTransaction {
  id: string;
  user_id: string;
  tx_ref: string;
  flw_transaction_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: FlutterwavePaymentStatus;
  phone?: string;
  email?: string;
  plan_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type AdminRole = 'super_admin' | 'support_admin' | 'finance_admin' | 'content_admin';

export interface AdminUser extends User {
  admin_role?: AdminRole;
  permissions?: string[];
}

// --- Auth enhancements (Phase 1-7) ---

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: 'google' | 'github';
  provider_account_id: string;
  provider_email?: string;
  created_at: string;
}

export interface MfaCredential {
  id: string;
  user_id: string;
  secret: string;
  method: 'authenticator';
  verified: boolean;
  enabled: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface MfaRecoveryCode {
  id: string;
  user_id: string;
  code_hash: string;
  used: boolean;
  used_at?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  city?: string;
  country?: string;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string;
}

export interface MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface PasswordStrengthResult {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  color: string;
  cracks: string[];
  suggestions: string[];
}
