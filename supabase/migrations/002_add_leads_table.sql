-- Migration: Add leads table (separate from reports)
-- Leads are captured contacts, linked to reports and roofers

-- ============================================
-- Leads Table
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  roofer_id UUID NOT NULL REFERENCES roofers(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES roof_reports(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES access_code_campaigns(id),

  -- Contact info (will be encrypted at app level)
  name_encrypted TEXT NOT NULL,
  email_encrypted TEXT NOT NULL,
  phone_encrypted TEXT NOT NULL,

  -- Pipeline tracking
  pipeline_status TEXT DEFAULT 'new' CHECK (pipeline_status IN ('new', 'contacted', 'quoted', 'booked', 'won', 'lost')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_roofer_id ON leads(roofer_id);
CREATE INDEX IF NOT EXISTS idx_leads_report_id ON leads(report_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_status ON leads(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Roofers can only see their own leads
CREATE POLICY "Roofers can view own leads"
  ON leads
  FOR SELECT
  USING (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Roofers can update own leads"
  ON leads
  FOR UPDATE
  USING (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to leads"
  ON leads
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
