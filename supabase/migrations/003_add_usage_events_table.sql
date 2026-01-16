-- Migration: Add usage_events table for quota tracking
-- Tracks all billable events (reports generated) with cost data

-- ============================================
-- Usage Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  roofer_id UUID NOT NULL REFERENCES roofers(id) ON DELETE CASCADE,
  report_id UUID REFERENCES roof_reports(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('report', 'geocode', 'map_tile')),

  -- Cost tracking (in cents for precision)
  cost_cents INTEGER DEFAULT 0,

  -- Provider info
  provider TEXT, -- 'google_solar', 'google_maps', etc.

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for quota calculations and analytics
CREATE INDEX IF NOT EXISTS idx_usage_events_roofer_id ON usage_events(roofer_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_roofer_created ON usage_events(roofer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Roofers can view their own usage
CREATE POLICY "Roofers can view own usage"
  ON usage_events
  FOR SELECT
  USING (
    roofer_id IN (
      SELECT id FROM roofers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can insert/manage all
CREATE POLICY "Service role has full access to usage_events"
  ON usage_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Helper function to get usage count for billing period
-- ============================================
CREATE OR REPLACE FUNCTION get_roofer_usage_count(
  p_roofer_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM usage_events
    WHERE roofer_id = p_roofer_id
      AND event_type = 'report'
      AND created_at >= p_period_start
      AND created_at < p_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
