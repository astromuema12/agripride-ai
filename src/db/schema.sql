-- Create tables for AgriPride AI
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users table
-- Core user accounts for farmers, officers, and admins
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'officer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_suspended BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- Farms table
-- Registered farms owned by users with farmer role
-- ============================================
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  size_acres DECIMAL(10,2) NOT NULL CHECK (size_acres > 0),
  soil_type VARCHAR(100) NOT NULL,
  crops_grown TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_farms_status ON farms(status);
CREATE INDEX idx_farms_location ON farms(location);

-- ============================================
-- Crops table
-- Individual crop plantings tied to specific farms
-- ============================================
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  planting_date DATE NOT NULL,
  harvest_date DATE,
  area_acres DECIMAL(10,2) NOT NULL CHECK (area_acres > 0),
  status VARCHAR(20) DEFAULT 'growing' CHECK (status IN ('growing', 'harvested', 'failed')),
  expected_yield_kg DECIMAL(12,2),
  actual_yield_kg DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crops_farm_id ON crops(farm_id);
CREATE INDEX idx_crops_status ON crops(status);
CREATE INDEX idx_crops_name ON crops(name);

-- ============================================
-- Disease reports table
-- Farmer-submitted disease reports with AI analysis
-- ============================================
CREATE TABLE disease_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_type VARCHAR(255) NOT NULL,
  symptoms TEXT NOT NULL,
  image_url TEXT,
  disease_prediction VARCHAR(255),
  confidence_score DECIMAL(5,4),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  treatment TEXT,
  prevention TEXT,
  explanation TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_disease_reports_farm_id ON disease_reports(farm_id);
CREATE INDEX idx_disease_reports_status ON disease_reports(status);
CREATE INDEX idx_disease_reports_risk_level ON disease_reports(risk_level);
CREATE INDEX idx_disease_reports_created_at ON disease_reports(created_at);

-- ============================================
-- Recommendations table
-- AI-generated recommendations for farmers
-- ============================================
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('crop_advisor', 'disease', 'weather', 'general')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_data JSONB,
  confidence_score DECIMAL(5,4),
  responsible_agent VARCHAR(255),
  frameworks TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at);

-- ============================================
-- Weather data table
-- Current and historical weather observations
-- ============================================
CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location VARCHAR(255) NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  rainfall_mm DECIMAL(8,2),
  wind_speed DECIMAL(5,2),
  condition VARCHAR(100),
  forecast JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_data_location ON weather_data(location);
CREATE INDEX idx_weather_data_recorded_at ON weather_data(recorded_at);

-- ============================================
-- Yield records table
-- Harvest yield data for crop performance tracking
-- ============================================
CREATE TABLE yield_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  yield_kg DECIMAL(12,2) NOT NULL,
  area_acres DECIMAL(10,2) NOT NULL,
  quality_rating DECIMAL(3,1) CHECK (quality_rating >= 0 AND quality_rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_yield_records_farm_id ON yield_records(farm_id);
CREATE INDEX idx_yield_records_crop_id ON yield_records(crop_id);
CREATE INDEX idx_yield_records_harvest_date ON yield_records(harvest_date);

-- ============================================
-- Notifications table
-- System and alert notifications for users
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('weather_alert', 'disease_alert', 'recommendation', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- Consent records table
-- User consent management for data collection and AI processing
-- ============================================
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('data_collection', 'ai_processing', 'disease_diagnosis', 'weather_monitoring')),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(type);

-- ============================================
-- Audit logs table
-- Comprehensive audit trail for platform activities
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- Sustainability scores table
-- Farm-level environmental sustainability metrics
-- ============================================
CREATE TABLE sustainability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  soil_health DECIMAL(5,4) NOT NULL CHECK (soil_health >= 0 AND soil_health <= 1),
  water_usage DECIMAL(5,4) NOT NULL CHECK (water_usage >= 0 AND water_usage <= 1),
  biodiversity DECIMAL(5,4) NOT NULL CHECK (biodiversity >= 0 AND biodiversity <= 1),
  carbon_footprint DECIMAL(5,4) NOT NULL CHECK (carbon_footprint >= 0 AND carbon_footprint <= 1),
  overall_score DECIMAL(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sustainability_scores_farm_id ON sustainability_scores(farm_id);
CREATE INDEX idx_sustainability_scores_recorded_at ON sustainability_scores(recorded_at);

-- ============================================
-- Market prices table
-- Current and historical crop market prices by region
-- ============================================
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_prices_crop ON market_prices(crop);
CREATE INDEX idx_market_prices_region ON market_prices(region);
CREATE INDEX idx_market_prices_recorded_at ON market_prices(recorded_at);

-- ============================================
-- System logs table
-- Internal system events and error tracking
-- ============================================
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  component VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_component ON system_logs(component);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Users: users can read their own data; admins can read all
CREATE POLICY users_read_own ON users FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id);

-- Farms: farmers can CRUD own farms; officers/admins can read all
CREATE POLICY farms_read_all ON farms FOR SELECT
  USING (true);

CREATE POLICY farms_insert_own ON farms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY farms_update_own ON farms FOR UPDATE
  USING (auth.uid() = user_id);

-- Crops: farmers can CRUD own crops; officers/admins can read all
CREATE POLICY crops_read_all ON crops FOR SELECT
  USING (true);

CREATE POLICY crops_insert_own ON crops FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

-- Disease reports: farmers see own; officers/admins see all
CREATE POLICY disease_reports_read_all ON disease_reports FOR SELECT
  USING (true);

CREATE POLICY disease_reports_insert_own ON disease_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recommendations: users see their own
CREATE POLICY recommendations_read_own ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Weather data: public read
CREATE POLICY weather_data_read_all ON weather_data FOR SELECT
  USING (true);

-- Yield records: farmers see own; officers/admins see all
CREATE POLICY yield_records_read_all ON yield_records FOR SELECT
  USING (true);

-- Notifications: users see their own
CREATE POLICY notifications_read_own ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Consent records: users see own; admins see all
CREATE POLICY consent_records_read_own ON consent_records FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Audit logs: admins only
CREATE POLICY audit_logs_read_admin ON audit_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Sustainability scores: public read
CREATE POLICY sustainability_scores_read_all ON sustainability_scores FOR SELECT
  USING (true);

-- Market prices: public read
CREATE POLICY market_prices_read_all ON market_prices FOR SELECT
  USING (true);

-- System logs: admins only
CREATE POLICY system_logs_read_admin ON system_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
  BEFORE UPDATE ON farms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
