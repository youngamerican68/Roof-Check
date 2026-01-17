-- Migration: Add Lead Qualification Fields
-- Phase 2: Lead Quality Improvements for RoofCheck
-- Run this migration to add the new columns to your existing roof_reports table

-- Add lead qualification fields (Phase 2.1)
ALTER TABLE roof_reports
  ADD COLUMN IF NOT EXISTS wants_contractor_contact BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_timeline VARCHAR(50),
  ADD COLUMN IF NOT EXISTS lead_issue_type VARCHAR(100);

-- Add consent fields (Phase 2.2 & 2.3)
ALTER TABLE roof_reports
  ADD COLUMN IF NOT EXISTS phone_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Add index for querying leads who want contractor contact
CREATE INDEX IF NOT EXISTS idx_roof_reports_wants_contractor_contact
  ON roof_reports(wants_contractor_contact)
  WHERE wants_contractor_contact = true;

-- Add index for querying by timeline (hot leads)
CREATE INDEX IF NOT EXISTS idx_roof_reports_lead_timeline
  ON roof_reports(lead_timeline)
  WHERE lead_timeline IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN roof_reports.wants_contractor_contact IS 'Whether the user opted in to receive contractor contact';
COMMENT ON COLUMN roof_reports.lead_timeline IS 'User-selected timeline for roof work: within_7_days, within_30_days, 1_3_months, 3_6_months, just_researching';
COMMENT ON COLUMN roof_reports.lead_issue_type IS 'What prompted the search: storm_damage, age_wear, leak, getting_quotes, other';
COMMENT ON COLUMN roof_reports.phone_consent IS 'TCPA consent for calls/texts';
COMMENT ON COLUMN roof_reports.phone_consent_at IS 'Timestamp when TCPA consent was given';
COMMENT ON COLUMN roof_reports.marketing_consent IS 'Consent to receive marketing emails (CAN-SPAM)';
