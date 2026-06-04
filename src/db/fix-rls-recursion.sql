DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS consent_records_read_own ON consent_records;
DROP POLICY IF EXISTS audit_logs_read_admin ON audit_logs;
DROP POLICY IF EXISTS system_logs_read_admin ON system_logs;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE POLICY users_read_own ON users FOR SELECT
  USING (auth.uid() = id OR get_user_role() = 'admin');

CREATE POLICY consent_records_read_own ON consent_records FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY audit_logs_read_admin ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY system_logs_read_admin ON system_logs FOR SELECT
  USING (get_user_role() = 'admin');
