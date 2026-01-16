# RoofCheck: Migrate to Neon for Validation Launch

## Goal
Migrate the homeowner flow from Supabase to Neon (PostgreSQL) to validate lead generation. Keep it minimal - just what's needed to collect leads.

## Scope
- **In scope:** Homeowner flow (address → analysis → report → lead capture)
- **Out of scope:** Contractor dashboard, auth (Clerk), multi-tenant features, email notifications

---

## Current Status

### Completed
- [x] Neon MCP configured
- [x] Vercel MCP configured
- [x] Created Neon database "roofcheck" in existing project
- [x] Got connection string (DATABASE_URL)
- [x] Installed Drizzle ORM dependencies
- [x] Created database schema (lib/db/schema.ts)
- [x] Created database client (lib/db/index.ts)
- [x] Created drizzle.config.ts
- [x] Created roof_reports table in Neon
- [x] Updated /api/analyze to use Drizzle (simplified, no multi-tenant)
- [x] Updated /api/capture-lead to use Drizzle (no email sending)
- [x] Updated /api/report/[id] to use Drizzle
- [x] Simplified middleware (no auth required for MVP)
- [x] Tested all APIs locally - working!

### Next Steps
1. [x] Add environment variables to Vercel project:
   - DATABASE_URL
   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   - GOOGLE_SOLAR_API_KEY
   - NEXT_PUBLIC_APP_URL
2. [x] Redeploy to Vercel
3. [x] Test production deployment

## Migration Complete! ✓

All tasks completed successfully. The homeowner flow is now running on Neon PostgreSQL with Drizzle ORM.

---

## Technical Details

### Dependencies to Install
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### New Files to Create

**`lib/db/schema.ts`** - Drizzle schema for roof_reports table
**`lib/db/index.ts`** - Database client
**`drizzle.config.ts`** - Drizzle Kit configuration

### API Routes to Update

| Route | Changes |
|-------|---------|
| `app/api/analyze/route.ts` | Remove multi-tenant logic, use Drizzle insert |
| `app/api/capture-lead/route.ts` | Use Drizzle, remove email sending |
| `app/api/report/[id]/route.ts` | Use Drizzle select |

### Environment Variables Needed
```env
DATABASE_URL=postgres://...@...neon.tech/neondb?sslmode=require
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
GOOGLE_SOLAR_API_KEY=...
```

---

## Database Schema

```sql
CREATE TABLE roof_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Address
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  full_address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  place_id TEXT,
  -- Roof metrics
  estimation_source TEXT,
  roof_area_sqft_low NUMERIC,
  roof_area_sqft_high NUMERIC,
  roof_squares_low NUMERIC,
  roof_squares_high NUMERIC,
  complexity TEXT,
  pitch_degrees NUMERIC,
  azimuth_primary NUMERIC,
  sunshine_hours_annual NUMERIC,
  -- Cost estimates
  cost_economy_low NUMERIC,
  cost_economy_high NUMERIC,
  cost_standard_low NUMERIC,
  cost_standard_high NUMERIC,
  cost_premium_low NUMERIC,
  cost_premium_high NUMERIC,
  -- Map & metadata
  static_map_url TEXT,
  confidence_score TEXT,
  imagery_date TEXT,
  -- Lead capture
  lead_captured BOOLEAN DEFAULT FALSE,
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_captured_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## What Stays The Same

The Google APIs are completely separate from the database migration:
- Google Maps API (address autocomplete, map display)
- Google Solar API (roof analysis, satellite imagery, measurements)
- Static Maps (aerial view on report)
- All roof calculation logic

The homeowner flow works exactly the same - we're just changing where data gets stored.

---

## MCP Servers Configured

| Server | Purpose | Status |
|--------|---------|--------|
| supabase | Legacy (can remove later) | Connected |
| neon | Direct DB access | Connected |
| vercel | Deployment + DB provisioning | Needs OAuth |

---

*Last updated: January 16, 2026 - Migration Complete*
