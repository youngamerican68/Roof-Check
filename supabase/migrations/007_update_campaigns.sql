-- Migration: Update campaigns table for multi-tenant
-- Adds roofer_id so each roofer has their own campaigns

-- ============================================
-- Add roofer_id to campaigns
-- ============================================

-- Add roofer_id (nullable initially for migration - legacy campaigns are global)
ALTER TABLE access_code_campaigns
ADD COLUMN IF NOT EXISTS roofer_id UUID REFERENCES roofers(id) ON DELETE CASCADE;

-- Add campaign token for QR codes (separate from code)
ALTER TABLE access_code_campaigns
ADD COLUMN IF NOT EXISTS campaign_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Add description and metadata
ALTER TABLE access_code_campaigns
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE access_code_campaigns
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_roofer_id ON access_code_campaigns(roofer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_token ON access_code_campaigns(campaign_token);

-- ============================================
-- Update RLS policies for multi-tenant
-- ============================================

-- Drop old public policy
DROP POLICY IF EXISTS "Allow public read access to active campaigns" ON access_code_campaigns;

-- Roofers can view their own campaigns
CREATE POLICY "Roofers can view own campaigns"
  ON access_code_campaigns
  FOR SELECT
  USING (
    roofer_id IS NULL -- Legacy global campaigns
    OR roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

-- Roofers can manage their own campaigns
CREATE POLICY "Roofers can insert own campaigns"
  ON access_code_campaigns
  FOR INSERT
  WITH CHECK (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Roofers can update own campaigns"
  ON access_code_campaigns
  FOR UPDATE
  USING (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Roofers can delete own campaigns"
  ON access_code_campaigns
  FOR DELETE
  USING (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

-- Public can validate campaign tokens (for QR code landing)
CREATE POLICY "Public can validate campaign tokens"
  ON access_code_campaigns
  FOR SELECT
  USING (is_active = true);

-- Service role has full access
CREATE POLICY "Service role has full access to campaigns"
  ON access_code_campaigns
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON access_code_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
