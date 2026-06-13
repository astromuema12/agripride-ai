-- ============================================
-- AgriPride AI — RLS Fix Migration v3
-- Enables RLS on EVERY table with non-recursive
-- policies using SECURITY DEFINER helper function.
-- ============================================

-- 1. Drop ALL existing policies to start clean
DO $$ DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Drop old recursive get_user_role if exists
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;

-- 3. Create SECURITY DEFINER helper (no recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 4. Enable RLS on ALL tables (idempotent)
ALTER TABLE IF EXISTS public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.farms                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crops                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disease_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recommendations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weather_data            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.yield_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sustainability_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.market_prices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_inquiries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.farmer_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.testimonials            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mpesa_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_stats          ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLICIES — Table by table
-- ============================================

-- ---------- users ----------
CREATE POLICY users_insert_own ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_read_own ON users FOR SELECT
  USING (auth.uid() = id OR get_user_role() IN ('admin', 'officer'));

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY users_update_admin ON users FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY users_delete_admin ON users FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- farms ----------
CREATE POLICY farms_insert_own ON farms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY farms_read_all ON farms FOR SELECT
  USING (true);

CREATE POLICY farms_update_own ON farms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY farms_update_admin ON farms FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY farms_delete_own ON farms FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY farms_delete_admin ON farms FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- crops ----------
CREATE POLICY crops_insert_own ON crops FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

CREATE POLICY crops_read_all ON crops FOR SELECT
  USING (true);

CREATE POLICY crops_update_own ON crops FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

CREATE POLICY crops_update_admin ON crops FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY crops_delete_own ON crops FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

CREATE POLICY crops_delete_admin ON crops FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- disease_reports ----------
CREATE POLICY disease_reports_insert_own ON disease_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY disease_reports_read_all ON disease_reports FOR SELECT
  USING (true);

CREATE POLICY disease_reports_update_own ON disease_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY disease_reports_update_admin ON disease_reports FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY disease_reports_delete_own ON disease_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY disease_reports_delete_admin ON disease_reports FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- recommendations ----------
CREATE POLICY recommendations_insert_own ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recommendations_read_own ON recommendations FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'officer'));

CREATE POLICY recommendations_update_own ON recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY recommendations_update_admin ON recommendations FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY recommendations_delete_own ON recommendations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY recommendations_delete_admin ON recommendations FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- weather_data ----------
CREATE POLICY weather_data_read_all ON weather_data FOR SELECT
  USING (true);

CREATE POLICY weather_data_insert_admin ON weather_data FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- ---------- yield_records ----------
CREATE POLICY yield_records_read_all ON yield_records FOR SELECT
  USING (true);

CREATE POLICY yield_records_insert_own ON yield_records FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));

CREATE POLICY yield_records_update_admin ON yield_records FOR UPDATE
  USING (get_user_role() = 'admin');

-- ---------- notifications ----------
CREATE POLICY notifications_insert_own ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_read_own ON notifications FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY notifications_update_own ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------- consent_records ----------
CREATE POLICY consent_records_insert_own ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY consent_records_read_own ON consent_records FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY consent_records_update_own ON consent_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY consent_records_update_admin ON consent_records FOR UPDATE
  USING (get_user_role() = 'admin');

-- ---------- audit_logs ----------
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY audit_logs_read_admin ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- ---------- system_logs ----------
CREATE POLICY system_logs_insert ON system_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY system_logs_read_admin ON system_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- ---------- sustainability_scores ----------
CREATE POLICY sustainability_scores_read_all ON sustainability_scores FOR SELECT
  USING (true);

CREATE POLICY sustainability_scores_insert_own ON sustainability_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------- market_prices ----------
CREATE POLICY market_prices_read_all ON market_prices FOR SELECT
  USING (true);

CREATE POLICY market_prices_insert_admin ON market_prices FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- ---------- contact_inquiries ----------
CREATE POLICY contact_inquiries_insert ON contact_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY contact_inquiries_select_admin ON contact_inquiries FOR SELECT
  USING (get_user_role() IN ('admin', 'officer'));

CREATE POLICY contact_inquiries_update_admin ON contact_inquiries FOR UPDATE
  USING (get_user_role() IN ('admin', 'officer'));

-- ---------- farmer_profiles ----------
CREATE POLICY farmer_profiles_insert_own ON farmer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY farmer_profiles_manage_own ON farmer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY farmer_profiles_update_own ON farmer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY farmer_profiles_select_admin ON farmer_profiles FOR SELECT
  USING (get_user_role() = 'admin');

-- ---------- subscription_plans ----------
CREATE POLICY subscription_plans_select_all ON subscription_plans FOR SELECT
  USING (true);

CREATE POLICY subscription_plans_insert_admin ON subscription_plans FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- ---------- user_subscriptions ----------
CREATE POLICY user_subscriptions_insert_own ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_subscriptions_select_own ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY user_subscriptions_update_admin ON user_subscriptions FOR UPDATE
  USING (get_user_role() = 'admin');

-- ---------- testimonials ----------
CREATE POLICY testimonials_insert_own ON testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY testimonials_select_approved ON testimonials FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR get_user_role() IN ('admin', 'officer'));

CREATE POLICY testimonials_update_admin ON testimonials FOR UPDATE
  USING (get_user_role() IN ('admin', 'officer'));

CREATE POLICY testimonials_delete_admin ON testimonials FOR DELETE
  USING (get_user_role() = 'admin');

-- ---------- support_tickets ----------
CREATE POLICY support_tickets_insert_own ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY support_tickets_manage_own ON support_tickets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY support_tickets_select_admin ON support_tickets FOR SELECT
  USING (get_user_role() IN ('admin', 'officer'));

CREATE POLICY support_tickets_update_admin ON support_tickets FOR UPDATE
  USING (get_user_role() IN ('admin', 'officer'));

-- ---------- ticket_messages ----------
CREATE POLICY ticket_messages_insert_own ON ticket_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ticket_messages_select_own ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
        AND (support_tickets.user_id = auth.uid() OR get_user_role() IN ('admin', 'officer'))
    )
  );

-- ---------- mpesa_transactions ----------
CREATE POLICY mpesa_transactions_select_own ON mpesa_transactions FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY mpesa_transactions_insert ON mpesa_transactions FOR INSERT
  WITH CHECK (true);

-- ---------- ai_usage_logs ----------
CREATE POLICY ai_usage_logs_insert ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY ai_usage_logs_select_admin ON ai_usage_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- ---------- activity_logs ----------
CREATE POLICY activity_logs_insert ON activity_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY activity_logs_select_admin ON activity_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- ---------- platform_stats ----------
CREATE POLICY platform_stats_select_all ON platform_stats FOR SELECT
  USING (true);

CREATE POLICY platform_stats_update_admin ON platform_stats FOR UPDATE
  USING (get_user_role() = 'admin');

-- ============================================
-- Done — RLS is now enforced on every table
-- with non-recursive, role-aware policies.
-- ============================================
