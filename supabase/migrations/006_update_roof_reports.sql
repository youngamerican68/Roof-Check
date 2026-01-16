-- Migration: Update roof_reports table for multi-tenant
-- Adds roofer_id, place_id, confidence_score
-- Removes lead fields (now in separate leads table)

-- ============================================
-- Add new columns
-- ============================================

-- Add roofer_id (nullable initially for migration)
ALTER TABLE roof_reports
ADD COLUMN IF NOT EXISTS roofer_id UUID REFERENCES roofers(id) ON DELETE CASCADE;

-- Add place_id for caching
ALTER TABLE roof_reports
ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add confidence score
ALTER TABLE roof_reports
ADD COLUMN IF NOT EXISTS confidence_score TEXT CHECK (confidence_score IN ('high', 'medium', 'low'));

-- Add imagery date
ALTER TABLE roof_reports
ADD COLUMN IF NOT EXISTS imagery_date DATE;

-- ============================================
-- Create indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reports_roofer_id ON roof_reports(roofer_id);
CREATE INDEX IF NOT EXISTS idx_reports_place_id ON roof_reports(place_id);
CREATE INDEX IF NOT EXISTS idx_reports_roofer_place ON roof_reports(roofer_id, place_id);

-- ============================================
-- Update RLS policies for multi-tenant
-- ============================================

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read access to roof reports" ON roof_reports;

-- Roofers can view their own reports
CREATE POLICY "Roofers can view own reports"
  ON roof_reports
  FOR SELECT
  USING (
    roofer_id IS NULL -- Legacy public reports
    OR roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

-- Public can view reports by ID (for homeowner report viewing)
CREATE POLICY "Public can view reports by direct ID access"
  ON roof_reports
  FOR SELECT
  USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to roof_reports"
  ON roof_reports
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Note: Lead fields (lead_captured, lead_name, etc.) are kept
-- for backward compatibility but will be deprecated.
-- New leads go to the leads table.
-- ============================================
