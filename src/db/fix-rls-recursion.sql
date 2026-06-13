-- Fix recursive RLS policies using SECURITY DEFINER function
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS consent_records_read_own ON consent_records;
DROP POLICY IF EXISTS audit_logs_read_admin ON audit_logs;
DROP POLICY IF EXISTS system_logs_read_admin ON system_logs;

-- Function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Users: users can read their own data; admins can read all
CREATE POLICY users_read_own ON users FOR SELECT
  USING (auth.uid() = id OR get_user_role() = 'admin');

-- Consent records: users see own; admins see all
CREATE POLICY consent_records_read_own ON consent_records FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

-- Audit logs: admins only
CREATE POLICY audit_logs_read_admin ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- System logs: admins only
CREATE POLICY system_logs_read_admin ON system_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- Additional INSERT/UPDATE/DELETE policies

-- Users: admins can update any user; users can update own
CREATE POLICY users_update_admin ON users FOR UPDATE
  USING (get_user_role() = 'admin');

-- Users: admins can insert
CREATE POLICY users_insert_admin ON users FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- Farms: farmers can update own; admins can update all
CREATE POLICY farms_update_all ON farms FOR UPDATE
  USING (get_user_role() = 'admin' OR auth.uid() = user_id);

-- Farms: farmers can delete own; admins can delete all
CREATE POLICY farms_delete_own ON farms FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY farms_delete_admin ON farms FOR DELETE
  USING (get_user_role() = 'admin');

-- Crops: farmers can update own; admins can update all
CREATE POLICY crops_update_own ON crops FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));
CREATE POLICY crops_update_admin ON crops FOR UPDATE
  USING (get_user_role() = 'admin');

-- Crops: farmers can delete own; admins can delete all
CREATE POLICY crops_delete_own ON crops FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM farms WHERE id = farm_id));
CREATE POLICY crops_delete_admin ON crops FOR DELETE
  USING (get_user_role() = 'admin');

-- Disease reports: farmers can update own; admins can update all
CREATE POLICY disease_reports_update_own ON disease_reports FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY disease_reports_update_admin ON disease_reports FOR UPDATE
  USING (get_user_role() = 'admin');

-- Disease reports: farmers can delete own; admins can delete all
CREATE POLICY disease_reports_delete_own ON disease_reports FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY disease_reports_delete_admin ON disease_reports FOR DELETE
  USING (get_user_role() = 'admin');

-- Recommendations: users can update own; admins can update all
CREATE POLICY recommendations_update_own ON recommendations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY recommendations_update_admin ON recommendations FOR UPDATE
  USING (get_user_role() = 'admin');

-- Recommendations: users can delete own; admins can delete all
CREATE POLICY recommendations_delete_own ON recommendations FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY recommendations_delete_admin ON recommendations FOR DELETE
  USING (get_user_role() = 'admin');

-- Consent records: users can update own; admins can update all
CREATE POLICY consent_records_update_own ON consent_records FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY consent_records_update_admin ON consent_records FOR UPDATE
  USING (get_user_role() = 'admin');

-- Audit logs: admins can insert
CREATE POLICY audit_logs_insert_admin ON audit_logs FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- System logs: admins can insert
CREATE POLICY system_logs_insert_admin ON system_logs FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- Notifications: users can update own (mark as read)
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
