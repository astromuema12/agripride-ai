-- ============================================
-- AgriPride AI Production Migration v2
-- Adds tables for: contact, onboarding, pricing,
-- testimonials, support, analytics, subscriptions
-- ============================================

-- Contact Inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'spam')),
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX idx_contact_inquiries_created_at ON contact_inquiries(created_at);

-- Farmer Onboarding Profiles
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  phone VARCHAR(50),
  county VARCHAR(255),
  farm_size_acres DECIMAL(10,2),
  crop_types TEXT[] DEFAULT '{}',
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  goals TEXT[] DEFAULT '{}',
  ai_personalized BOOLEAN DEFAULT FALSE,
  consent_ai BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farmer_profiles_user_id ON farmer_profiles(user_id);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('free', 'premium', 'cooperative', 'enterprise')),
  price_kes DECIMAL(10,2) DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  mpesa_receipt VARCHAR(255),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  farm_type VARCHAR(100),
  photo_url TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- M-Pesa Transactions
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  receipt_number VARCHAR(255),
  transaction_id VARCHAR(255),
  result_code INTEGER,
  result_desc TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mpesa_transactions_user_id ON mpesa_transactions(user_id);
CREATE INDEX idx_mpesa_transactions_status ON mpesa_transactions(status);

-- AI Usage Tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(100) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  model VARCHAR(100),
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_endpoint ON ai_usage_logs(endpoint);

-- Activity Log (for analytics)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- System Statistics (cached)
CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) UNIQUE NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_stats (metric_name, metric_value) VALUES
  ('registered_farmers', 0),
  ('active_users', 0),
  ('diagnoses_performed', 0),
  ('loans_processed', 0),
  ('crops_monitored', 0),
  ('total_farms', 0),
  ('ai_chats', 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Contact Inquiries: admins can see all, users can see own
CREATE POLICY contact_inquiries_insert ON contact_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY contact_inquiries_select_admin ON contact_inquiries FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'officer'));

-- Farmer Profiles: users can manage own, admins see all
CREATE POLICY farmer_profiles_manage_own ON farmer_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY farmer_profiles_select_admin ON farmer_profiles FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Subscription Plans: public read
CREATE POLICY subscription_plans_select_all ON subscription_plans FOR SELECT
  USING (true);

-- User Subscriptions: users see own, admins see all
CREATE POLICY user_subscriptions_select_own ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Testimonials: approved ones public, users can insert
CREATE POLICY testimonials_select_approved ON testimonials FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'officer'));

CREATE POLICY testimonials_insert_own ON testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY testimonials_update_admin ON testimonials FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'officer'));

-- Support Tickets: users manage own, admins see all
CREATE POLICY support_tickets_manage_own ON support_tickets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY support_tickets_select_admin ON support_tickets FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'officer'));

-- Ticket Messages: users see own ticket messages, admins see all
CREATE POLICY ticket_messages_select_own ON ticket_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND (support_tickets.user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'officer'))));

-- M-Pesa Transactions: users see own, admins see all
CREATE POLICY mpesa_transactions_select_own ON mpesa_transactions FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- AI Usage Logs: admins only
CREATE POLICY ai_usage_logs_select_admin ON ai_usage_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Activity Logs: admins only
CREATE POLICY activity_logs_select_admin ON activity_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Platform Stats: public read
CREATE POLICY platform_stats_select_all ON platform_stats FOR SELECT
  USING (true);

CREATE POLICY platform_stats_update_admin ON platform_stats FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
