-- Migration 006: Auth enhancements — MFA, sessions, email verification columns
-- Run this in Supabase SQL Editor after migration-005

-- 1. Email verification columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- 2. OAuth provider accounts linking
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'github')),
  provider_account_id text NOT NULL,
  provider_email text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, provider_account_id)
);

-- 3. MFA credentials
CREATE TABLE IF NOT EXISTS mfa_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  method text NOT NULL DEFAULT 'authenticator' CHECK (method IN ('authenticator')),
  verified boolean DEFAULT false,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- 4. MFA recovery codes
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. User sessions (device tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  device_name text,
  device_type text,
  browser text,
  os text,
  ip_address inet,
  city text,
  country text,
  is_current boolean DEFAULT false,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_mfa_credentials_user_id ON mfa_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON mfa_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_current ON user_sessions(user_id) WHERE is_current = true;

-- RLS
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own rows
DROP POLICY IF EXISTS "Users read own oauth_accounts" ON oauth_accounts;
CREATE POLICY "Users read own oauth_accounts" ON oauth_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own mfa_credentials" ON mfa_credentials;
CREATE POLICY "Users read own mfa_credentials" ON mfa_credentials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own mfa_credentials" ON mfa_credentials;
CREATE POLICY "Users insert own mfa_credentials" ON mfa_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own mfa_credentials" ON mfa_credentials;
CREATE POLICY "Users update own mfa_credentials" ON mfa_credentials
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own mfa_recovery_codes" ON mfa_recovery_codes;
CREATE POLICY "Users read own mfa_recovery_codes" ON mfa_recovery_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own mfa_recovery_codes" ON mfa_recovery_codes;
CREATE POLICY "Users insert own mfa_recovery_codes" ON mfa_recovery_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own mfa_recovery_codes" ON mfa_recovery_codes;
CREATE POLICY "Users update own mfa_recovery_codes" ON mfa_recovery_codes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own sessions" ON user_sessions;
CREATE POLICY "Users read own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own sessions" ON user_sessions;
CREATE POLICY "Users update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own sessions" ON user_sessions;
CREATE POLICY "Users delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Admin read all
DROP POLICY IF EXISTS "Admin read all oauth_accounts" ON oauth_accounts;
CREATE POLICY "Admin read all oauth_accounts" ON oauth_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin read all mfa_credentials" ON mfa_credentials;
CREATE POLICY "Admin read all mfa_credentials" ON mfa_credentials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin read all sessions" ON user_sessions;
CREATE POLICY "Admin read all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Realtime (safe re-run via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'oauth_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE oauth_accounts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mfa_credentials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mfa_credentials;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mfa_recovery_codes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mfa_recovery_codes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
  END IF;
END $$;
