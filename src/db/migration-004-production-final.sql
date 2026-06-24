-- ============================================
-- AgriPride AI — Production Final Migration v4
-- Adds missing tables, composite indexes, triggers
-- for chat_messages, yield_predictions, and more
-- ============================================

-- 1. Chat Messages table (for AI chat history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_name VARCHAR(255),
  confidence_score DECIMAL(5,4),
  frameworks_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- 2. Yield Predictions table
CREATE TABLE IF NOT EXISTS yield_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_name VARCHAR(255) NOT NULL,
  planting_date DATE NOT NULL,
  predicted_yield_kg DECIMAL(12,2) NOT NULL,
  confidence_score DECIMAL(5,4),
  factors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yield_predictions_farm_id ON yield_predictions(farm_id);
CREATE INDEX IF NOT EXISTS idx_yield_predictions_created_at ON yield_predictions(created_at);

-- 3. Composite Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_farms_user_status ON farms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crops_farm_status ON crops(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_disease_reports_farm_status ON disease_reports(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_disease_reports_user_status ON disease_reports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_read ON recommendations(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_event ON activity_logs(user_id, event_type, created_at DESC);

-- 4. Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_disease_reports_critical ON disease_reports(created_at DESC) WHERE risk_level IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_recommendations_unread ON recommendations(user_id) WHERE is_read = FALSE;

-- 5. Updated_at trigger for farmer_profiles
DROP TRIGGER IF EXISTS update_farmer_profiles_updated_at ON farmer_profiles;
CREATE TRIGGER update_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Updated_at trigger for support_tickets
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS on new tables
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS yield_predictions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for chat_messages
CREATE POLICY IF NOT EXISTS chat_messages_insert_own ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS chat_messages_select_own ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- 9. RLS Policies for yield_predictions
CREATE POLICY IF NOT EXISTS yield_predictions_select_own ON yield_predictions FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

-- 10. Platform stats refresh trigger (uses security definer helper from v3)
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO platform_stats (metric_name, metric_value, updated_at)
  VALUES
    ('registered_farmers', (SELECT COUNT(*) FROM users), NOW()),
    ('total_farms', (SELECT COUNT(*) FROM farms), NOW()),
    ('diagnoses_performed', (SELECT COUNT(*) FROM disease_reports), NOW()),
    ('ai_chats', (SELECT COUNT(*) FROM chat_messages), NOW())
  ON CONFLICT (metric_name)
  DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();
END;
$$;

-- ============================================
-- Done — v4 migration complete
-- ============================================
