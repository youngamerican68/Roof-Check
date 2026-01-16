# RoofCheck MVP Progress

## Overview
RoofCheck is a satellite-based roof analysis tool that provides homeowners with instant roof measurements and replacement cost estimates.

**Live URL:** https://roofcheck-nine.vercel.app

---

## MVP Status: COMPLETE

### Core Homeowner Flow (100% Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Address input with Google Places autocomplete | Done | Real-time address suggestions |
| Location confirmation with satellite map | Done | Draggable marker for precision |
| Google Solar API integration | Done | Fetches roof data from satellite imagery |
| Roof analysis (area, squares, complexity) | Done | Calculates measurements from Solar API |
| Cost estimation (Economy/Standard/Premium) | Done | Based on roof squares and complexity |
| Report preview (gated content) | Done | Shows blurred costs until lead captured |
| Lead capture form | Done | Name, email, phone, consent checkbox |
| Full report unlock after lead capture | Done | All data visible after form submission |
| Static satellite map image | Done | Google Maps Static API |

### Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Hosting | Vercel |
| APIs | Google Places, Solar API, Maps Static |

### Database Schema

```
roof_reports table:
- id (UUID, primary key)
- Address fields (address_line1, city, state, postal_code, full_address)
- Location (lat, lng, place_id)
- Roof metrics (roof_area_sqft_low/high, roof_squares_low/high, complexity, pitch_degrees)
- Solar data (azimuth_primary, sunshine_hours_annual, imagery_date)
- Cost estimates (cost_economy_low/high, cost_standard_low/high, cost_premium_low/high)
- Lead capture (lead_captured, lead_name, lead_email, lead_phone, lead_captured_at)
- Metadata (static_map_url, confidence_score, created_at, updated_at)
```

---

## Recent Fixes (January 16, 2026)

### Issue: Lead capture form not unlocking report
**Symptom:** Clicking "Send My Full Report" did nothing - form submitted successfully (200 OK) but UI didn't update.

**Root Cause:** Next.js was caching API responses on the server. The `/api/report/[id]` endpoint returned stale data with `leadCaptured: false` even after the database was updated to `true`.

**Solution:** Added cache-busting exports to all API routes:
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Files Modified:**
- `app/api/report/[id]/route.ts`
- `app/api/capture-lead/route.ts`
- `app/api/analyze/route.ts`

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
GOOGLE_SOLAR_API_KEY=...
NEXT_PUBLIC_PARTNER_NAME=... (optional)
```

---

## Deployment

The app auto-deploys from the `main` branch on GitHub to Vercel.

```bash
# Manual deployment
vercel --prod

# Alias to production domain
vercel alias [deployment-url] roofcheck-nine.vercel.app
```

---

## Next Steps (Phase 2 - Roofer Dashboard)

- [ ] Roofer authentication (Supabase Auth)
- [ ] Roofer dashboard with lead management
- [ ] Campaign system with unique URLs
- [ ] Embeddable widget for roofer websites
- [ ] Usage tracking and analytics
- [ ] Stripe integration for billing

---

## Testing

To test the full flow:
1. Go to https://roofcheck-nine.vercel.app
2. Enter any US address
3. Confirm location on satellite map
4. View preview report (costs blurred)
5. Fill out lead capture form
6. Submit to unlock full report

---

*Last Updated: January 16, 2026*
