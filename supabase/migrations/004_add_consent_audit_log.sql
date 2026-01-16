-- Migration: Add consent_audit_log table for TCPA compliance
-- Stores immutable records of user consent for legal audit trail

-- ============================================
-- Consent Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship to lead
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Consent details
  consent_type TEXT NOT NULL CHECK (consent_type IN ('contact', 'sms', 'email', 'marketing')),
  consent_text TEXT NOT NULL, -- Exact text shown to user
  consent_given BOOLEAN NOT NULL,

  -- Audit trail
  ip_address INET,
  user_agent TEXT,
  form_version TEXT DEFAULT 'v1.0',

  -- Timestamp (immutable - no updated_at)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_audit_lead_id ON consent_audit_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created_at ON consent_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_audit_consent_type ON consent_audit_log(consent_type);

-- Enable RLS
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Roofers can view consent logs for their leads
CREATE POLICY "Roofers can view consent logs for own leads"
  ON consent_audit_log
  FOR SELECT
  USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN roofers r ON l.roofer_id = r.id
      WHERE r.auth_user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to consent_audit_log"
  ON consent_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- Note: No UPDATE policy - consent logs should be immutable
-- Only INSERT is allowed for new consent records
