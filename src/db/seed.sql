-- AgriPride AI - Seed Data
-- This file contains sample data for development and testing

-- Demo Users
INSERT INTO users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@agripride.ai', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'officer@agripride.ai', 'Jane Extension', 'officer'),
  ('00000000-0000-0000-0000-000000000003', 'farmer@agripride.ai', 'John Farmer', 'farmer');

-- Additional farmers
INSERT INTO users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000004', 'farmer2@agripride.ai', 'Grace Mwangi', 'farmer'),
  ('00000000-0000-0000-0000-000000000005', 'farmer3@agripride.ai', 'Peter Ochieng', 'farmer'),
  ('00000000-0000-0000-0000-000000000006', 'farmer4@agripride.ai', 'Sarah Ndagire', 'farmer'),
  ('00000000-0000-0000-0000-000000000007', 'farmer5@agripride.ai', 'David Kimani', 'farmer');

-- Sample Farms
INSERT INTO farms (id, user_id, name, location, size_acres, soil_type, crops_grown) VALUES
  ('f1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Green Acres Farm', 'Rift Valley Region, Kenya', 25.5, 'Loamy', ARRAY['Maize', 'Beans']),
  ('f1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Sunrise Farm', 'Central Region, Kenya', 15.0, 'Clay', ARRAY['Coffee', 'Tea']),
  ('f1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Highland Farm', 'Eastern Region, Kenya', 30.0, 'Laterite', ARRAY['Maize', 'Cassava']);

-- Sample Crops
INSERT INTO crops (id, farm_id, name, variety, planting_date, area_acres, status, expected_yield_kg) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Maize', 'H513', '2026-03-15', 10.0, 'growing', 3000),
  ('c1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'Beans', 'GLP 2', '2026-03-15', 5.0, 'growing', 1000);

-- Sample Disease Reports
INSERT INTO disease_reports (id, farm_id, crop_id, user_id, crop_type, symptoms, disease_prediction, confidence_score, risk_level, treatment, status) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Maize', 'Yellowing leaves with elongated gray-green lesions on lower leaves', 'Northern Leaf Blight', 0.92, 'high', 'Apply fungicide containing triazole or strobilurin', 'submitted');

-- Enable Row Level Security
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

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Farmers can manage own farms" ON farms FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Officers can view all farms" ON farms FOR SELECT USING (auth.jwt() ->> 'role' IN ('officer', 'admin'));
CREATE POLICY "Farmers can manage own crops" ON crops FOR ALL USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = crops.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Officers can view all crops" ON crops FOR SELECT USING (auth.jwt() ->> 'role' IN ('officer', 'admin'));
CREATE POLICY "Users can manage own disease reports" ON disease_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Officers can view all disease reports" ON disease_reports FOR SELECT USING (auth.jwt() ->> 'role' IN ('officer', 'admin'));
CREATE POLICY "Users can view own recommendations" ON recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consent" ON consent_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
