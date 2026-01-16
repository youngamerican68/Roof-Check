# RoofCheck: Product Strategy & MVP Plan

## Executive Summary

RoofCheck is an **embeddable aerial roof-report widget** for roofing contractors. It converts website visitors and offline marketing (door hangers, mailers) into captured leads by offering homeowners a free roof report (size, complexity, cost estimates) powered by satellite data. Roofers pay a monthly SaaS subscription; they drive their own traffic.

**Key differentiator:** We don't sell leads. We sell a conversion tool + offline-to-online attribution that roofers embed on their own properties.

---

## 1. Product Critique

### What's Compelling

| Strength | Why It Matters |
|----------|----------------|
| **Curiosity-driven hook** | "See your roof from space" is visceral, shareable, and non-threatening |
| **Value-first exchange** | Homeowner gets useful info before giving contact details |
| **Offline attribution** | Roofers spend heavily on door hangers/mailers but can't track ROI. Campaign codes solve this |
| **SMB-friendly** | Small roofers want leads, not complex software. Widget drops into existing site |
| **Warm leads** | Anyone who looks up their roof is already thinking about it |
| **Hands-off for us** | Roofers drive traffic; we just convert it. Recurring SaaS revenue |

### What's Risky

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Accuracy trust** | HIGH | If roof outline/area looks wrong, users bounce. Must show confidence indicators, disclaimers, and degrade gracefully when data is weak |
| **Cost estimate backlash** | MEDIUM | Homeowners may treat estimates as quotes. Strong "not a quote" language + range displays |
| **TCPA/compliance** | HIGH | Lead capture + calling = legal exposure. Need explicit consent, audit trails, SMS opt-in language |
| **API dependency** | HIGH | Google Solar API coverage/pricing can change. Need provider abstraction layer |
| **Churn from "doesn't work"** | MEDIUM | Roofers judge by booked inspections, not reports generated. Must make ROI visible via funnel metrics |
| **Competitive commoditization** | LOW-MED | Aerial measurement tools exist (EagleView, Roofr). Our angle is "embedded conversion widget + attribution," not generic measurements |

### What Would Kill It

1. **Google Solar API becomes unreliable/expensive** without a fallback provider
2. **Compliance lawsuit** from improper consent handling
3. **Roofers churn** because they can't see the connection between widget → booked jobs
4. **Trust collapse** if reports are visibly inaccurate in key markets

---

## 2. Recommended MVP Scope

### MVP Features (Build First)

| # | Feature | Purpose | Complexity |
|---|---------|---------|------------|
| 1 | **Multi-tenant database** | Separate leads from reports, usage_events for quotas | Medium |
| 2 | **Roofer auth + onboarding** | Signup, login, full branding (name, logo, colors) | Small-Med |
| 3 | **Embeddable widget (iframe)** | Script tag embed (WP plugin is Phase 2 polish) | Medium |
| 4 | **Anti-abuse protections** | Rate limiting, origin allowlist, campaign tokens, Turnstile | Medium |
| 5 | **Campaign code system** | Create codes, generate QR, scoped tokens for attribution | Small |
| 6 | **Lead dashboard + email alerts** | View leads, CSV export, instant email on new lead | Medium |
| 7 | **Compliance layer** | Consent audit log, TCPA-safe language, privacy policy | Small-Med |
| 8 | **Confidence-gated output** | Area always shown; pitch/cost only with high confidence OR roofer opt-in | Small |

**Key Decisions:**
- **Launch**: Paid from day one with 14-day free trial (no credit card to start)
- **Branding**: Full customization (company name, logo upload, primary color)
- **Data gaps**: Show degraded reports with "limited data available" warnings
- **Pitch/Cost**: Optional modules — roofers toggle on, cost uses their $/square
- **WordPress**: Phase 2 polish (script tag + iframe embed is sufficient for MVP)
- **Email alerts**: MVP-required (roofers live in inbox, won't check dashboard)
- **Leads vs Reports**: Separate tables for clean data model

### Postpone (Post-MVP)

| Feature | Why Wait |
|---------|----------|
| **WordPress plugin** | Script tag works fine; WP plugin is Phase 2 polish |
| Zapier/CRM integrations | Nice retention moat, not launch-critical |
| PDF report download | Adds polish, not core conversion |
| Multi-location / zip routing | Complexity; start with single-location roofers |
| SMS notifications | Requires additional TCPA compliance |
| Advanced analytics | Basic funnel first; fancy charts later |
| Provider abstraction (Nearmap, etc.) | Architect for it now, implement when needed |
| Pipeline status tracking | "new/contacted/quoted/won/lost" — future CRM-lite feature |

### MVP User Stories

```
As a ROOFER, I can:
- Sign up and configure my company branding
- Get an embed code to paste on my website
- Create campaign codes for door hangers
- View all my leads with campaign attribution
- Export leads to CSV

As a HOMEOWNER, I can:
- Enter my address in the widget
- See my roof from above with basic specs (preview)
- Provide my contact info to unlock the full report
- Understand this is an estimate, not a quote
```

---

## 3. Data & Architecture Sketch

### Entity Model (Revised)

**Key change:** Leads are now a separate table from Reports. This allows:
- Multiple submissions per report (resubmits, household members)
- Clean deletion requests (delete lead, keep anonymized report)
- Pipeline/status tracking without contaminating report rows

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROOFERS                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                    │
│ email (UNIQUE)                                                   │
│ password_hash (via Supabase Auth)                                │
│ company_name                                                     │
│ logo_url                                                         │
│ primary_color                                                    │
│ notification_email                                               │
│ notification_emails_additional (TEXT[])  ← for multiple recipients│
│ scheduling_url                                                   │
│ allowed_domains (TEXT[])  ← origin allowlist for embed           │
│ show_pitch (BOOLEAN, default: false)  ← optional module          │
│ show_cost_estimates (BOOLEAN, default: false)  ← optional module │
│ cost_per_square (DECIMAL)  ← roofer's own pricing for estimates  │
│ subscription_status (trialing | active | past_due | canceled)    │
│ stripe_customer_id                                               │
│ stripe_subscription_id                                           │
│ current_period_start (TIMESTAMPTZ)                               │
│ current_period_end (TIMESTAMPTZ)                                 │
│ monthly_report_quota (default: 50)                               │
│ created_at, updated_at                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │ 1:many              │ 1:many              │ 1:many
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│   CAMPAIGNS   │   │  ROOF_REPORTS   │   │    USAGE_EVENTS     │
├───────────────┤   ├─────────────────┤   ├─────────────────────┤
│ id (UUID, PK) │   │ id (UUID, PK)   │   │ id (UUID, PK)       │
│ roofer_id (FK)│   │ roofer_id (FK)  │   │ roofer_id (FK)      │
│ code (UNIQUE) │   │ campaign_id (FK)│   │ report_id (FK)      │
│ name          │   │                 │   │ event_type (report) │
│ is_active     │   │ -- Location --  │   │ cost_cents (INT)    │
│ created_at    │   │ place_id ← KEY  │   │ created_at          │
└───────────────┘   │ full_address    │   └─────────────────────┘
        │           │ lat, lng        │
        │           │                 │   Usage computed from events
        │           │ -- Metrics --   │   for billing period, not
        │           │ roof_area_sqft_ │   a simple counter field
        │           │   low/high      │
        │           │ roof_squares_   │
        │           │   low/high      │
        │           │ complexity      │
        │           │ pitch_degrees   │  ← only if confidence high
        │           │ azimuth_primary │
        │           │ confidence_score│  ← high/medium/low
        │           │ imagery_date    │
        │           │                 │
        │           │ -- Source --    │
        │           │ estimation_src  │
        │           │ provider_id     │  ← for cache lookup
        │           │                 │
        │           │ -- NO LEAD DATA │  ← leads are separate!
        │           │ -- NO raw_json  │  ← TOS compliance
        │           │                 │
        │           │ static_map_url  │
        │           │ created_at      │
        │           └─────────────────┘
        │                     │
        │                     │ 1:many (separate table!)
        │                     ▼
        │           ┌─────────────────────────────────────────────┐
        │           │                    LEADS                     │
        │           ├─────────────────────────────────────────────┤
        │           │ id (UUID, PK)                                │
        │           │ roofer_id (FK)                               │
        │           │ report_id (FK)                               │
        └──────────►│ campaign_id (FK, nullable)                   │
                    │                                              │
                    │ name, email, phone                           │
                    │ pipeline_status (new | contacted | quoted |  │
                    │                  won | lost)  ← future       │
                    │                                              │
                    │ created_at                                   │
                    └─────────────────────────────────────────────┘
                                      │
                                      │ 1:many
                                      ▼
                    ┌─────────────────────────────────────────────┐
                    │              CONSENT_AUDIT_LOG               │
                    ├─────────────────────────────────────────────┤
                    │ id (UUID, PK)                                │
                    │ lead_id (FK)  ← now references leads         │
                    │ consent_type (contact | sms | email)         │
                    │ consent_text (exact language shown)          │
                    │ consent_given (boolean)                      │
                    │ ip_address                                   │
                    │ user_agent                                   │
                    │ timestamp                                    │
                    └─────────────────────────────────────────────┘
```

### Provider Abstraction (Architect Now)

```typescript
// lib/services/roofDataProvider.ts

interface RoofDataProvider {
  name: string;
  fetchRoofData(lat: number, lng: number): Promise<RoofDataResult>;
  getCoverage(lat: number, lng: number): Promise<CoverageInfo>;
}

interface RoofDataResult {
  success: boolean;
  source: 'google_solar' | 'nearmap' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
  imageryDate?: string;
  data?: {
    areaSquareFeet: { low: number; high: number };
    segments?: RoofSegment[];
    pitchDegrees?: number;
    azimuth?: string;
  };
  error?: string;
}

// Start with Google Solar, swap/add providers later
const providers: RoofDataProvider[] = [
  googleSolarProvider,
  // nearmapProvider,  // future
  fallbackProvider,    // always last
];
```

### Caching Strategy (Revised)

**Warning:** Caching by rounded lat/lng (geohash) at ~50m precision can collide neighboring houses in dense suburbs, leading to "your roof is actually your neighbor's roof" — a trust-killer.

**Safer approach:** Cache by standardized address ID (place_id from geocoder).

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADDRESS_CACHE                               │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                    │
│ place_id (TEXT, UNIQUE)  ← Google Places place_id                │
│ normalized_address (TEXT)  ← fallback key                        │
│ provider_source                                                  │
│ derived_metrics (JSONB)  ← NOT raw response (TOS compliance)     │
│ confidence_score                                                 │
│ imagery_date                                                     │
│ cached_at                                                        │
│ expires_at (e.g., 30 days)                                       │
└─────────────────────────────────────────────────────────────────┘

Logic:
1. Use place_id from Google Places autocomplete as primary cache key
2. Fallback: normalized address string if no place_id
3. Check cache before API call
4. If cache hit && not expired → use cached data (no API cost)
5. If cache miss → call API, store DERIVED metrics only (not raw response)
6. Verify provider TOS before storing any imagery-related data
```

### Google Places / Geocoding Cost & Terms

**Warning:** Google Places Autocomplete is one of the pricier Google surfaces, and terms around storing/using data are specific.

| Concern | Mitigation |
|---------|------------|
| **Autocomplete cost** | Log as separate cost center; consider address text → geocode fallback without Autocomplete |
| **place_id storage** | Permitted per Google TOS, but verify current terms |
| **static_map_url display** | Google Maps Platform has strict rules on caching/displaying; verify terms |
| **Fallback providers** | Architect for Mapbox/OpenStreetMap geocoding fallback if Google becomes problematic |

**Cost tracking:** Add `geocoding_events` or expand `usage_events` to log geocoding calls separately from Solar API calls.

### Provider TOS Compliance (Hard Gate, Not a Note)

**This is not a "verify later" item — it's a launch blocker.**

| Rule | Implementation |
|------|----------------|
| **Store only derived metrics** | area_sqft, pitch, confidence, imagery_date — NOT raw API responses |
| **No imagery caching** | Unless explicitly permitted; link to imagery, don't store it |
| **Document storage schema** | For each provider, document exactly what is stored and for how long |
| **Data retention policy** | Auto-purge leads after X months (configurable); delete on request within 30 days |
| **PII deletion** | GDPR/CCPA: "Delete my data" flow that removes lead record, keeps anonymized report |
| **Audit before launch** | Review Google Solar API, Google Maps Platform, and Resend TOS before going live |

### PII Protection (Encryption + Retention + Deletion)

**Address + roof characteristics + contact info = sensitive PII.** Even "derived metrics only" requires protection.

| Protection | Implementation |
|------------|----------------|
| **Encrypt sensitive columns** | App-level encryption for phone, email, full_address (or Postgres pgcrypto) |
| **Automatic retention** | Leads auto-purge after configurable months (default: 24) |
| **Deletion flow (end-to-end)** | Delete: lead record + consent_audit_log entries + any cached metrics keyed to that address |
| **Anonymization option** | Keep report for analytics, strip PII fields |
| **Audit log** | Track who deleted what, when |

**Implementation detail:**
```sql
-- Encrypted columns (app-level with key from env)
leads.email_encrypted
leads.phone_encrypted
leads.name_encrypted

-- Deletion cascade
DELETE FROM consent_audit_log WHERE lead_id = ?;
DELETE FROM leads WHERE id = ?;
-- Keep roof_reports but clear any PII if present
```

### Operational Monitoring (MVP Required)

**You cannot run a paid API service without observability.**

| Alert | Trigger |
|-------|---------|
| **API error spikes** | >5% error rate on /api/analyze over 15 minutes |
| **Provider coverage failures** | >20% "no data available" responses in a region |
| **Quota anomalies** | Single roofer consuming >3x normal rate |
| **Email send failures** | >10% failure rate on lead notifications |
| **Latency degradation** | p95 analyze latency >5 seconds |

**Internal Dashboard (simple, MVP-viable):**
- Cost per report (blended: geocoding + Solar API + Maps tiles + email + infra)
- Cache hit rate (should be >30% after initial rollout)
- Analyze latency p50/p95
- Daily active roofers / reports generated
- Trial → paid conversion rate

**Implementation:** Start with Supabase logs + simple Vercel analytics; upgrade to Sentry/Datadog post-launch.

### Quota & Gating (Revised)

**Avoid counter fields** — a single `reports_used_this_month` counter on the roofer row gets weird with concurrency, retries, and billing-cycle alignment.

**Better approach:** Use `usage_events` table, compute usage dynamically.

```
On each /api/analyze request:
1. Validate roofer API key (or campaign token — see anti-abuse)
2. Verify origin/domain is in roofer.allowed_domains (if embed)
3. Check roofer.subscription_status === 'active' or 'trialing'
4. Query usage_events for current billing period:
   SELECT COUNT(*) FROM usage_events
   WHERE roofer_id = ?
   AND created_at >= roofer.current_period_start
   AND created_at < roofer.current_period_end
5. If usage >= quota → return 402 with upgrade prompt
6. Process request
7. INSERT INTO usage_events (roofer_id, report_id, event_type, cost_cents, created_at)
```

Benefits:
- Auditability when someone claims "your quota math is wrong"
- Handles concurrent requests correctly
- Easy to compute overages for billing
- Can track cost_cents per request for real unit economics

### Anti-Abuse Protections (MVP Required)

**If you publish an endpoint that triggers paid API calls, it WILL get abused** — by bots, competitors, or "oops that QR went viral."

**Important:** `Origin` header checking is NOT a full security control — headers can be spoofed server-side.

| Protection | Implementation |
|------------|----------------|
| **Signed embed tokens** | Short-lived JWT minted server-side for widget session (not just Origin check) |
| **Rate limiting (IP)** | 10 requests/minute per IP via middleware or edge |
| **Rate limiting (roofer)** | 100 requests/hour per roofer key |
| **Bot friction** | Cloudflare Turnstile (invisible challenge) on analyze action |
| **Key rotation** | "Regenerate API key" + "Revoke all embeds" buttons in dashboard |
| **Campaign tokens ≠ API keys** | QR codes use scoped, revocable tokens |
| **Quota alerts** | Email roofer at 80% and 100% of quota |
| **Trial abuse gates** | See trial controls below |

**Signed Embed Token Flow:**
```
Roofer embeds widget.js with public roofer_key
                ↓
widget.js calls /api/embed/init with roofer_key + domain
                ↓
Server validates domain is in allowed_domains
                ↓
Server returns signed JWT (embed_token) valid for 1 hour
                ↓
All subsequent API calls include embed_token
                ↓
Server validates JWT signature + expiry before processing
```

**Campaign QR Token Flow:**
```
QR Code → roofcheck.com/c/[campaign_token]
                ↓
Server validates campaign_token → gets roofer_id + campaign_id
                ↓
Server mints signed session token for this visitor
                ↓
Request counted against roofer's quota
```

**Trial Abuse Controls:**
- Domain verification required before widget goes live
- Tighter trial quota (10 reports, not 50)
- **Card required to enable QR campaign tokens** (since QR can be widely shared)
- Stricter bot gating on trial accounts (lower Turnstile threshold)

### Widget Architecture

```
Roofer's website:
┌─────────────────────────────────────────────────────────┐
│  <div id="roofcheck-widget"></div>                      │
│  <script src="https://app.roofcheck.com/widget.js"      │
│          data-roofer-key="rk_abc123"></script>          │
└─────────────────────────────────────────────────────────┘
                         │
                         │ 1. Calls /api/embed/init → gets signed JWT
                         │ 2. Loads iframe with embed_token
                         ▼
┌─────────────────────────────────────────────────────────┐
│  https://app.roofcheck.com/embed/[key]?token=[jwt]      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Branded widget (roofer's colors/logo)            │  │
│  │  Address input → Map confirm → Report preview     │  │
│  │  Contact capture → Full report + Scheduling CTA   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Why iframe:**
- Isolated from host site CSS/JS conflicts
- Secure (can't access host page DOM)
- Easy to implement
- Responsive via postMessage for height adjustments

**postMessage Events (for GA/Meta Pixel tracking):**

Widget emits events to parent window so roofers can track conversions.

**SECURITY:** Don't use `'*'` in production — it's a common footgun.

```javascript
// widget.js emits to parent with STRICT targetOrigin:
const allowedOrigin = rooferConfig.allowedDomain; // e.g., 'https://roofer.com'
window.parent.postMessage({
  event: 'roofcheck_contact_captured',
  reportId: '...',
  nonce: sessionNonce  // from JWT, prevents spoofing
}, allowedOrigin);

// Roofer's site listens with origin validation:
window.addEventListener('message', (e) => {
  // Validate origin
  if (e.origin !== 'https://app.roofcheck.com') return;
  // Validate message schema
  if (!e.data?.event || !e.data?.nonce) return;

  if (e.data.event === 'roofcheck_contact_captured') {
    gtag('event', 'conversion', {...});
  }
});
```
**This materially helps renewals** — roofers can prove ROI in their own analytics.

### Real Domain Verification (Not Just Allowlist)

**Problem:** Checking that a request claims it's from `roofer.com` isn't the same as verifying the roofer controls `roofer.com`. An attacker could sign up, add any domain to their settings, and burn your quota.

**Solution:** Require one of these before widget goes live:

| Method | How It Works |
|--------|--------------|
| **DNS TXT record** | Add `roofcheck-verify=abc123` to domain DNS |
| **HTML file upload** | Upload `/.well-known/roofcheck-verify.txt` containing token |
| **Meta tag** | Add `<meta name="roofcheck-verify" content="abc123">` to homepage |

**Flow:**
1. Roofer adds domain in dashboard
2. Dashboard shows verification instructions + unique token
3. Roofer adds DNS/file/meta
4. Dashboard has "Verify" button that checks for token
5. Only verified domains can use the widget

### Dashboard UX Polish (Churn Reducers)

| Feature | Why It Matters |
|---------|----------------|
| **Installation test page** | "Widget status: receiving events / not detected" — reduces support |
| **Prominent scheduling CTA** | Full report includes Calendly link (use `scheduling_url`) |
| **First contact celebration** | Dashboard highlights first captured contact |
| **Campaign performance view** | Which door hanger campaigns are converting? |
| **Basic pipeline status** | new/contacted/booked/won/lost (manual) — connects widget → revenue |
| **Customizable CTA wording** | 2 lines (headline + button) — materially changes conversion |

### High-Value "Small Effort" Features (Add to MVP)

| Feature | Why Ship Early |
|---------|----------------|
| **Pipeline status** | Low complexity, high perceived value, creates "proof" in dashboard |
| **Customizable CTA** | Roofers can test copy; reduces "it doesn't work" complaints |
| **"Confirm your roof" step** | Already exists in current app! Map confirmation with draggable pin protects trust |

**Note:** The current app already has a map confirmation step with draggable marker (`/confirm` page). This is excellent — keep it prominent in the widget flow.

### Architectural Note: place_id Uniqueness

**Be careful about uniqueness constraints:**
- Multiple roofers may run reports for the same home
- `place_id` should be indexed but NOT unique across the whole `roof_reports` table
- `address_cache` can key by `place_id` globally (shared cache across roofers)
- Consider: unique constraint on `(roofer_id, place_id)` if you want to prevent duplicate reports per roofer

---

## 4. Compliance Checklist

### Lead Capture Consent (TCPA/CCPA/GDPR-aware)

| Requirement | Implementation |
|-------------|----------------|
| **Explicit opt-in** | Unchecked checkbox, user must actively check |
| **Clear language** | "I agree to receive calls and texts from [Company] about my roof. Msg & data rates may apply." |
| **No pre-checked boxes** | Checkbox default = false |
| **Separate SMS consent** | If SMS planned, separate checkbox: "I agree to receive SMS messages..." |
| **Consent timestamp** | Store exact datetime in `consent_audit_log` |
| **IP address** | Store for audit trail |
| **User agent** | Store for audit trail |
| **Consent text version** | Store exact text shown (in case it changes) |
| **Privacy policy link** | Visible link near form: "See our Privacy Policy" |
| **Partner identification** | Clearly show roofer's company name in consent |

### Consent Language Templates

**Contact consent (required):**
```
☐ I consent to be contacted by [Company Name] regarding my roof
  assessment. I understand I may receive calls at the number provided.
```

**SMS consent (optional, separate):**
```
☐ I also agree to receive text messages from [Company Name].
  Message and data rates may apply. Reply STOP to opt out.
```

### Audit Log Requirements

Every lead capture must log:
```json
{
  "report_id": "uuid",
  "consents": [
    {
      "type": "contact",
      "text": "I consent to be contacted by ABC Roofing...",
      "given": true,
      "timestamp": "2025-12-30T10:30:00Z"
    },
    {
      "type": "sms",
      "text": "I also agree to receive text messages...",
      "given": false,
      "timestamp": "2025-12-30T10:30:00Z"
    }
  ],
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "form_version": "v1.2"
}
```

### Privacy Policy Requirements

Must cover:
- What data is collected (address, contact info, roof data)
- How it's used (shared with the specific roofer)
- Data retention period
- How to request deletion
- Cookie usage (if any)
- Third-party services (Google Maps, Supabase, Resend)

### Roofer Responsibilities (Terms of Service)

Roofers must agree to:
- Only contact leads who consented
- Honor opt-out requests
- Not resell lead data
- Comply with TCPA/local calling laws
- Maintain their own privacy policy

---

## 5. Pricing Model

### Tier Structure

| Tier | Price | Report Quota | Features |
|------|-------|--------------|----------|
| **Starter** | $99/mo | 50 reports | Widget, 3 campaigns, CSV export |
| **Pro** | $199/mo | 150 reports | + Unlimited campaigns, priority support |
| **Agency** | $499/mo | 500 reports | + Multi-location, white-label, API access |

### Overage Pricing

- $2.00 per report over quota
- Automatically billed at end of cycle
- Roofer gets warning at 80% and 100% of quota

### Why This Works

| Cost Factor | Our Cost | Revenue |
|-------------|----------|---------|
| Google Solar API | ~$0.01/call | Covered by subscription |
| Supabase/hosting | ~$0.001/report | Covered |
| Support | Minimal (self-serve) | Covered |
| **Gross margin** | | **~90%+** |

### Free Trial

- 14-day trial, 10 reports included
- No credit card required to start
- Card required to continue after trial

### Annual Discount

- 2 months free (17% discount) for annual prepay
- Reduces churn, improves cash flow

---

## 6. Core Metrics (PMF Validation)

### Primary Metrics

| Metric | What It Tells Us | Target |
|--------|------------------|--------|
| **Widget → Report Conversion** | Is the preview compelling enough? | >60% of address entries complete report |
| **Report → Contact Conversion** | Is the value exchange working? | >25% of previews convert to captured contacts |
| **Roofer Monthly Retention** | Are roofers getting value? | >90% month-over-month |
| **Reports per Roofer per Month** | Is the widget being used? | >20 reports/month average |

### Activation Metrics (Churn Predictors)

| Metric | Why It Matters | Target |
|--------|----------------|--------|
| **Time to install** | Signup → widget live on site | <24 hours |
| **Time to first contact** | Signup → first captured contact | <7 days |

These correlate strongly with retention in SMB SaaS. If a roofer hasn't installed within 48 hours or gotten a contact within 2 weeks, they're at high churn risk → trigger onboarding outreach.

### Secondary Metrics

| Metric | Purpose |
|--------|---------|
| **Campaign code usage rate** | Are roofers using offline attribution? |
| **Contact export/integration usage** | Stickiness indicator |
| **Support ticket volume** | Product quality indicator |
| **Cost per report (internal)** | Unit economics health check |

### Churn Diagnostics

Track why roofers cancel:
- "Not enough contacts" → Need better conversion or they need more traffic
- "Contacts weren't qualified" → Expectation mismatch (we capture contacts, not guarantee sales)
- "Too expensive" → Pricing/value disconnect
- "Switched to competitor" → Feature gap

---

## 7. Positioning & Messaging

**Messaging note:** Avoid "warm leads" language — it drifts toward lead-selling vibes. Use:
- "contacts captured from your traffic"
- "conversion rate"
- "attribution"

### One-Liner

> **RoofCheck: The aerial roof-report widget that turns your website visitors and door hangers into captured contacts.**

### Alternative Angles

- "Drop-in contact capture for roofing contractors"
- "See your roof from above — the widget that converts curious homeowners into inspection requests"
- "Offline-to-online attribution for roofers who actually track their marketing"

### "Do You Sell Leads?" Response

> "No — we don't generate or sell leads. You drive your own traffic (your website, your door hangers, your mailers). RoofCheck is the conversion tool that turns that traffic into captured contacts with full attribution, so you know exactly which campaigns are working."

### Competitor Differentiation

| Them | Us |
|------|-----|
| EagleView / Hover | Measurement tools for contractors, not contact capture |
| Roofr | Instant estimates, but they own the lead flow |
| Lead gen companies | Sell shared leads; you compete with other roofers |
| **RoofCheck** | **You own the widget, the traffic, and the contacts. We just convert.** |

---

## 8. Implementation Phases

### Phase 1: Multi-Tenant Foundation (Week 1-2)
- [ ] Add `roofers` table with auth (Supabase Auth)
- [ ] Add `leads` table (separate from reports!) with **encrypted PII columns**
- [ ] Add `usage_events` table (for quota tracking + cost logging)
- [ ] Add `consent_audit_log` table
- [ ] Update `roof_reports` — remove lead fields, add place_id (indexed, not unique), confidence_score
- [ ] Update `campaigns` — add roofer_id FK
- [ ] Update RLS policies for tenant isolation
- [ ] Roofer signup/login flow
- [ ] Settings page:
  - [ ] Company name, logo upload, primary color
  - [ ] Notification emails (multiple recipients)
  - [ ] Allowed domains with **real domain verification** (DNS TXT / HTML file / meta tag)
  - [ ] Customizable CTA wording (headline + button text)
- [ ] Optional modules toggles (show_pitch, show_cost_estimates, cost_per_square)
- [ ] **Pipeline status** on leads (new/contacted/booked/won/lost) — simple dropdown

### Phase 2: Embeddable Widget + Anti-Abuse (Week 2-3)
- [ ] Create `/embed/[roofer_key]` route (widget UI)
- [ ] Create `/c/[campaign_token]` route (campaign landing)
- [ ] Create `/api/embed/init` route (mints signed JWT with session nonce)
- [ ] Build `widget.js` loader script (calls init, loads iframe with token)
- [ ] Apply roofer branding (name, logo, primary color, **customizable CTA**)
- [ ] **Secure postMessage events** (strict targetOrigin, nonce validation, origin check)
- [ ] Handle iframe ↔ parent communication (height, events)
- [ ] Signed embed token validation (JWT signature + expiry + nonce)
- [ ] Rate limiting middleware (IP + roofer key)
- [ ] Cloudflare Turnstile integration (invisible challenge on analyze)
- [ ] Campaign tokens (scoped, revocable, not exposing API keys)
- [ ] Key rotation + "Revoke all embeds" button
- [ ] **Map confirmation step** in widget flow (draggable pin — already built!)
- [ ] Test on various host sites (Squarespace, Wix, raw HTML)

### Phase 3: Dashboard, Campaigns & Email Alerts (Week 3-4)
- [ ] Contact list view with filtering (leads table)
- [ ] Campaign CRUD (create, edit, deactivate)
- [ ] QR code generator for campaign tokens
- [ ] CSV export
- [ ] **Email alerts on new contact** (instant notification to roofer)
- [ ] Multiple notification recipients support
- [ ] Basic funnel metrics (reports → contacts by campaign)
- [ ] Quota usage display
- [ ] **Installation test page** ("Widget status: receiving events / not detected")
- [ ] First contact celebration (dashboard highlight)

### Phase 4: Compliance, Confidence-Gated Output & Polish (Week 4-5)
- [ ] Consent audit logging (IP, timestamp, exact text, user_agent)
- [ ] Updated consent language (TCPA-safe, separate SMS checkbox)
- [ ] Privacy policy page
- [ ] Terms of service for roofers
- [ ] **PII encryption** (app-level encryption for phone, email, address in leads table)
- [ ] **Deletion flow** (delete lead → cascade to consent_audit_log → anonymize report)
- [ ] **Auto-retention** (configurable months, default 24, cron job to purge)
- [ ] Confidence-gated output (pitch/cost only when high confidence OR roofer opted in)
- [ ] Roofer-configured cost estimates (their $/square, not ours)
- [ ] "Estimated from aerial data" disclaimers throughout
- [ ] Imagery date display when available
- [ ] Degraded report UI (show available data with "limited coverage" warning)

### Phase 5: Paid Launch + Monitoring (Week 5-6)
- [ ] Stripe integration (subscriptions, 14-day trial, billing portal)
- [ ] Quota enforcement via usage_events (not counter field)
- [ ] Overage billing at end of cycle
- [ ] Quota alerts at 80% and 100%
- [ ] **Trial abuse controls:**
  - [ ] Real domain verification before widget goes live
  - [ ] Tighter trial quota (10 reports)
  - [ ] Card required to enable QR campaign tokens
  - [ ] Stricter bot gating on trial accounts
- [ ] **Operational monitoring:**
  - [ ] API error rate alerts (>5% over 15 min)
  - [ ] Email send failure alerts
  - [ ] **Blended cost per report logging** (geocoding + Solar + Maps + email + infra)
  - [ ] Basic internal dashboard (cost, cache rate, latency)
- [ ] **Cost validation:** Set quotas based on real data, not assumptions
- [ ] Onboarding flow polish (signup → setup → embed → first contact)
- [ ] Landing/marketing page for RoofCheck SaaS
- [ ] Launch to first paying customers

### Phase 6: Post-Launch Polish
- [ ] WordPress plugin (once we have real user feedback)
- [ ] Zapier/webhook integrations
- [ ] PDF report download
- [ ] Provider TOS audit (verify caching/storage compliance)

---

## 9. Files to Modify/Create

### Database Migrations
- `supabase/migrations/001_add_roofers_table.sql`
- `supabase/migrations/002_add_leads_table.sql` ← separate from reports
- `supabase/migrations/003_add_usage_events_table.sql`
- `supabase/migrations/004_add_consent_audit_log.sql`
- `supabase/migrations/005_add_address_cache.sql`
- `supabase/migrations/006_update_roof_reports.sql` ← remove lead fields, add place_id
- `supabase/migrations/007_update_campaigns.sql` ← add roofer_id

### Auth & Dashboard
- `app/dashboard/` (new directory)
- `app/dashboard/page.tsx` - Overview + quota usage
- `app/dashboard/contacts/page.tsx` - Contact list (from leads table)
- `app/dashboard/campaigns/page.tsx` - Campaign management + QR generator
- `app/dashboard/settings/page.tsx` - Branding, domains, notification emails
- `app/dashboard/embed/page.tsx` - Get embed code + test widget
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `middleware.ts` - Protect dashboard routes, rate limiting

### Widget & Campaign Landing
- `app/embed/[rooferKey]/page.tsx` - Widget UI (iframe target)
- `app/c/[campaignToken]/page.tsx` - Campaign landing (QR destination)
- `public/widget.js` - Embed loader script
- `components/WidgetContainer.tsx`
- `components/DegradedReportNotice.tsx` - "Limited data" warning
- `components/ConfidenceIndicator.tsx` - High/Medium/Low badge
- `components/TurnstileChallenge.tsx` - Bot protection

### API Routes
- `app/api/embed/init/route.ts` - Mint signed JWT for widget session
- `app/api/analyze/route.ts` - Add roofer_id, quota check, rate limiting, JWT validation
- `app/api/capture-contact/route.ts` - Creates lead record + consent audit (renamed from capture-lead)
- `app/api/roofer/campaigns/route.ts` - Campaign CRUD
- `app/api/roofer/contacts/route.ts` - Contact list with filters
- `app/api/roofer/usage/route.ts` - Quota/usage stats
- `app/api/roofer/keys/route.ts` - API key rotation, revoke all embeds
- `app/api/webhooks/stripe/route.ts` - Subscription events

### Services
- `lib/services/roofDataProvider.ts` - Provider abstraction (architect for future swap)
- `lib/services/embedToken.ts` - Sign/verify JWT with session nonce
- `lib/services/domainVerification.ts` - DNS TXT / HTML file / meta tag verification
- `lib/services/encryption.ts` - App-level PII encryption/decryption
- `lib/services/consentAudit.ts` - Audit logging with IP/user-agent
- `lib/services/cache.ts` - Address caching by place_id
- `lib/services/quota.ts` - Usage calculation from usage_events
- `lib/services/rateLimit.ts` - IP + roofer rate limiting
- `lib/services/notifications.ts` - Email alerts to roofer on new contact
- `lib/services/monitoring.ts` - Error rate alerts, cost logging, latency tracking
- `lib/services/retention.ts` - Auto-purge old leads, deletion cascade

### Types
- `types/index.ts` - Add Roofer, Lead, UsageEvent, ConsentAuditLog types
- `types/database.ts` - Regenerate from schema

### Static
- `app/privacy/page.tsx` - Privacy policy
- `app/terms/page.tsx` - Terms of service

---

## 10. Decisions Made

| Question | Decision |
|----------|----------|
| **Launch strategy** | Paid from day one with 14-day free trial |
| **Trial controls** | Real domain verification; tighter quota (10); card for QR tokens |
| **Domain verification** | DNS TXT / HTML file / meta tag — not just allowlist |
| **WordPress plugin** | Phase 2 polish — script tag embed is sufficient for MVP |
| **Branding depth** | Full customization: name, logo, color, **customizable CTA wording** |
| **Data gaps** | Show degraded reports with clear "limited data available" warnings |
| **Pitch/Cost estimates** | Optional modules — roofers toggle on; cost uses their $/square |
| **Leads vs Reports** | Separate tables — cleaner data model, easier deletion/compliance |
| **Pipeline status** | Ship in MVP (new/contacted/booked/won/lost) — low effort, high value |
| **PII protection** | Encrypt sensitive columns, auto-retention, end-to-end deletion flow |
| **Quota tracking** | usage_events table, not counter field — auditability + concurrency |
| **Caching** | By place_id (not geohash); place_id indexed but not unique across roofers |
| **Raw API storage** | Store derived metrics only — TOS compliance is a launch blocker |
| **Embed security** | Signed JWT with session nonce (not just Origin header) |
| **postMessage security** | Strict targetOrigin, validate origin, nonce in events |
| **Anti-abuse** | Rate limiting, Turnstile, signed tokens, key rotation, revoke buttons |
| **Email alerts** | MVP-required — roofers won't check dashboard, they live in inbox |
| **Analytics integration** | Secure postMessage events for GA/Meta Pixel — helps roofers prove ROI |
| **Monitoring** | MVP-required — error alerts, blended cost tracking, internal dashboard |
| **Cost tracking** | Don't anchor on "$0.01/call" — log real costs, validate before pricing |
| **Messaging** | Avoid "warm leads" — use "captured contacts," "conversion," "attribution" |

---

## 11. Risk Mitigations Summary

| Risk | Mitigation |
|------|------------|
| **Accuracy/trust** | Confidence indicators, disclaimers, degraded report UI, map confirmation step |
| **Cost estimate backlash** | Optional module, roofer's own $/square, strong "not a quote" language |
| **TCPA/compliance** | Separate consent checkboxes, audit log with timestamp/IP/text, privacy policy |
| **Embed security** | Signed JWT with nonce, strict postMessage targetOrigin, key rotation |
| **Domain spoofing** | Real domain verification (DNS/HTML/meta), not just allowlist |
| **Trial abuse** | Domain verification, tight quota (10), card for QR tokens, stricter bot gating |
| **API abuse** | Rate limiting, Turnstile, signed tokens, campaign tokens ≠ API keys |
| **Quota disputes** | usage_events table with full audit trail (not counter field) |
| **Google costs** | Track geocoding separately, log blended cost, validate before pricing |
| **TOS compliance** | Store only derived metrics, audit before launch (launch blocker) |
| **PII exposure** | Encrypt sensitive columns, auto-retention, end-to-end deletion flow |
| **Data retention** | Auto-purge old leads, documented schema per provider, deletion audit log |
| **Observability** | Error rate alerts, blended cost per report logging, internal dashboard |
| **Provider dependency** | Architect provider abstraction now, implement swap later |
| **Churn** | Email alerts, secure postMessage for analytics, installation test, pipeline status |

---

## 12. Launch Readiness Gates

### Green Light: Start Building Now
You have enough clarity to implement in the order shown. Nothing is fundamentally confused or missing.

### Yellow Light: Launch Gates (Must Be True Before Accepting Money)

| Gate | Requirement | Status |
|------|-------------|--------|
| **1. TOS Audit** | Google Solar API + Maps Platform terms reviewed; storage/caching aligned | ⬜ Not started |
| **2. Domain Verification** | Real verification (DNS/HTML/meta) enforced before widget + QR campaigns | ⬜ Not started |
| **3. Embed Security** | No `'*'` targetOrigin; validate origin + schema + nonce; JWT required | ⬜ Not started |
| **4. PII Protection** | Encryption at rest; deletion flow works E2E; retention job purges | ⬜ Not started |
| **5. Basic Observability** | Error tracking, spike alerts, cost/usage visibility | ⬜ Not started |

**Launch Progression:**
```
Build Phase → Closed Beta (few roofers) → Public Launch
                    │                            │
                    │                            └── All 5 gates ✓
                    └── Gates 2, 3 minimum
```

### Notes for Later Tightening
- **Pricing/overages**: Don't anchor overages ($2/report) until real blended costs + roofer ROI are measured
- **Pipeline status**: Shipped in MVP — key churn reducer, helps roofers see value

---

## 13. Next Steps

1. **Start building** — Phase 1 (multi-tenant database)
2. **Parallel**: TOS audit (Google Solar API, Maps Platform) — document findings
3. **Parallel**: Set up basic monitoring (Vercel analytics, error logging)
4. **Before closed beta**: Implement embed security + domain verification
5. **Before public launch**: Complete all 5 launch gates
