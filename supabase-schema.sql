-- RoofCheck Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to set up the database

-- ============================================
-- Access Code Campaigns Table
-- Used for tracking which mailer/door hanger generated leads
-- ============================================
CREATE TABLE IF NOT EXISTS access_code_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- e.g., "RPT-294-XQ"
  name TEXT NOT NULL,                  -- e.g., "Oakwood Neighborhood Nov 2025"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Roof Reports Table
-- Stores the generated analysis and lead information
-- ============================================
CREATE TABLE IF NOT EXISTS roof_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Access code tracking (optional)
  access_code_id UUID REFERENCES access_code_campaigns(id),

  -- Location data
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  full_address TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,

  -- Estimation source
  estimation_source TEXT NOT NULL CHECK (estimation_source IN ('solar_api', 'heuristic', 'fallback')),

  -- Roof metrics (all stored as ranges)
  roof_area_sqft_low INTEGER,
  roof_area_sqft_high INTEGER,
  roof_squares_low DECIMAL(4,1),
  roof_squares_high DECIMAL(4,1),
  complexity TEXT CHECK (complexity IN ('simple', 'moderate', 'complex')),
  pitch_degrees DECIMAL(4,1),
  azimuth_primary TEXT,                -- "South", "West", etc.
  sunshine_hours_annual INTEGER,

  -- Cost estimates
  cost_economy_low INTEGER,
  cost_economy_high INTEGER,
  cost_standard_low INTEGER,
  cost_standard_high INTEGER,
  cost_premium_low INTEGER,
  cost_premium_high INTEGER,

  -- User-provided context (optional)
  approx_home_sqft INTEGER,
  roof_age_years INTEGER,

  -- Assets
  static_map_url TEXT,

  -- Raw API response for debugging
  solar_raw_json JSONB,

  -- Lead capture (populated when user submits contact form)
  lead_captured BOOLEAN DEFAULT false,
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_captured_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for common queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reports_lead_email ON roof_reports(lead_email);
CREATE INDEX IF NOT EXISTS idx_reports_access_code ON roof_reports(access_code_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON roof_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_lead_captured ON roof_reports(lead_captured);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE access_code_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE roof_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access to access code campaigns (for validation)
CREATE POLICY "Allow public read access to active campaigns"
  ON access_code_campaigns
  FOR SELECT
  USING (is_active = true);

-- Allow public read access to roof reports (for viewing reports)
CREATE POLICY "Allow public read access to roof reports"
  ON roof_reports
  FOR SELECT
  USING (true);

-- Note: INSERT and UPDATE operations require service role key
-- which bypasses RLS - this is handled by server-side API routes

-- ============================================
-- Seed Data
-- ============================================

-- Demo access code for testing
INSERT INTO access_code_campaigns (code, name)
VALUES ('DEMO-2024', 'Demo/Testing Campaign')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Helper Functions (Optional)
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_roof_reports_updated_at
  BEFORE UPDATE ON roof_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
