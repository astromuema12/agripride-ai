-- ============================================
-- Migration 005: Flutterwave Payments
-- ============================================

-- Flutterwave transactions table
CREATE TABLE IF NOT EXISTS flutterwave_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tx_ref TEXT NOT NULL UNIQUE,
  flw_transaction_id BIGINT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  phone TEXT,
  email TEXT,
  plan_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_user_id
  ON flutterwave_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_ref
  ON flutterwave_transactions(tx_ref);
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_status
  ON flutterwave_transactions(status);
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_flw_id
  ON flutterwave_transactions(flw_transaction_id);

-- Enable RLS
ALTER TABLE flutterwave_transactions ENABLE ROW LEVEL SECURITY;

-- RLS: users see own transactions, admins see all
CREATE POLICY flutterwave_transactions_user_select
  ON flutterwave_transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('admin', 'officer')
  );

CREATE POLICY flutterwave_transactions_admin_insert
  ON flutterwave_transactions FOR INSERT
  WITH CHECK (
    get_user_role() IN ('admin', 'officer')
    OR user_id = auth.uid()
  );

CREATE POLICY flutterwave_transactions_admin_update
  ON flutterwave_transactions FOR UPDATE
  USING (get_user_role() IN ('admin', 'officer'));

-- Notify table for rate limiting / monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE flutterwave_transactions;

-- Index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_plan_id
  ON flutterwave_transactions(plan_id);

-- Composite index for user recent transactions
CREATE INDEX IF NOT EXISTS idx_flutterwave_tx_user_created
  ON flutterwave_transactions(user_id, created_at DESC);
