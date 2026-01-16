-- Migration: Add roofers table for multi-tenant SaaS
-- This table stores roofing contractor accounts who subscribe to RoofCheck

-- ============================================
-- Roofers Table (Multi-tenant accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS roofers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth (linked to Supabase Auth)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Company branding
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb', -- Default blue

  -- Contact & notifications
  notification_email TEXT NOT NULL,
  notification_emails_additional TEXT[] DEFAULT '{}',
  scheduling_url TEXT, -- Calendly or similar

  -- Widget configuration
  allowed_domains TEXT[] DEFAULT '{}', -- Verified domains for embed
  cta_headline TEXT DEFAULT 'Get Your Free Roof Report',
  cta_button_text TEXT DEFAULT 'Unlock Full Report',

  -- Optional modules
  show_pitch BOOLEAN DEFAULT false,
  show_cost_estimates BOOLEAN DEFAULT false,
  cost_per_square DECIMAL(10,2), -- Roofer's own pricing

  -- Subscription (Stripe)
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_report_quota INTEGER DEFAULT 50,

  -- API access
  api_key TEXT UNIQUE DEFAULT ('rk_' || encode(gen_random_bytes(24), 'hex')),
  api_key_created_at TIMESTAMPTZ DEFAULT now(),

  -- Domain verification
  domain_verification_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_roofers_auth_user_id ON roofers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_roofers_email ON roofers(email);
CREATE INDEX IF NOT EXISTS idx_roofers_api_key ON roofers(api_key);
CREATE INDEX IF NOT EXISTS idx_roofers_stripe_customer_id ON roofers(stripe_customer_id);

-- Enable RLS
ALTER TABLE roofers ENABLE ROW LEVEL SECURITY;

-- Roofers can only read/update their own record
CREATE POLICY "Roofers can view own record"
  ON roofers
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Roofers can update own record"
  ON roofers
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role has full access to roofers"
  ON roofers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_roofers_updated_at
  BEFORE UPDATE ON roofers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
