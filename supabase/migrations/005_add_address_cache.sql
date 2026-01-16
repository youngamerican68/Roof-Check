-- Migration: Add address_cache table for caching roof data
-- Reduces API costs by caching derived metrics by place_id

-- ============================================
-- Address Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS address_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key (place_id from Google Places)
  place_id TEXT UNIQUE NOT NULL,
  normalized_address TEXT, -- Fallback key

  -- Provider info
  provider_source TEXT NOT NULL, -- 'google_solar', 'nearmap', 'fallback'

  -- Cached derived metrics (NOT raw API response - TOS compliance)
  derived_metrics JSONB NOT NULL,
  confidence_score TEXT CHECK (confidence_score IN ('high', 'medium', 'low')),
  imagery_date DATE,

  -- Cache management
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  hit_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_address_cache_place_id ON address_cache(place_id);
CREATE INDEX IF NOT EXISTS idx_address_cache_expires_at ON address_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_address_cache_normalized_address ON address_cache(normalized_address);

-- Enable RLS
ALTER TABLE address_cache ENABLE ROW LEVEL SECURITY;

-- Cache is only accessible by service role (internal use only)
CREATE POLICY "Service role has full access to address_cache"
  ON address_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Helper function to get or create cache entry
-- ============================================
CREATE OR REPLACE FUNCTION get_cached_roof_data(p_place_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT derived_metrics INTO v_result
  FROM address_cache
  WHERE place_id = p_place_id
    AND expires_at > now();

  IF v_result IS NOT NULL THEN
    -- Increment hit count
    UPDATE address_cache
    SET hit_count = hit_count + 1
    WHERE place_id = p_place_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Cleanup job for expired cache entries
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM address_cache
  WHERE expires_at < now();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
