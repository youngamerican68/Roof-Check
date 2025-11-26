# RoofCheck - Satellite Roof Report Lead-Gen MVP

RoofCheck is a web application that generates free satellite-based roof reports for homeowners, capturing leads for roofing contractors. Homeowners enter their address, receive an instant roof analysis including size, complexity, and cost estimates, and can unlock the full report by providing contact information.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (recommended)
- **Email**: Resend
- **Maps/Location**: Google Maps JavaScript API, Places API, Static Maps API
- **Roof Data**: Google Solar API (buildingInsights endpoint only)

## Quick Start

### 1. Clone and Install

```bash
cd roofcheck
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Google APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_SOLAR_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=re_your_key_here
ROOFER_NOTIFICATION_EMAIL=contractor@example.com

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PARTNER_NAME="Your Roofing Partner"
```

### 3. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy the contents of `supabase-schema.sql` and run it
4. Copy your project URL and keys from Project Settings > API

### 4. Enable Google APIs

In [Google Cloud Console](https://console.cloud.google.com):

1. Create a new project (or use existing)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Maps Static API
   - Solar API
3. Create API credentials:
   - For browser (Maps, Places, Static Maps): Create an API key with HTTP referrer restrictions
   - For server (Solar API): Create an API key or use the same one with IP restrictions for production

**Important**: The Solar API buildingInsights endpoint costs $0.01 per request. Do NOT use the dataLayers endpoint ($0.075/request).

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
roofcheck/
├── app/
│   ├── page.tsx                    # Landing page (access code + address input)
│   ├── confirm/page.tsx            # Map confirmation ("Is this your house?")
│   ├── analyzing/page.tsx          # Loading animation with scanning theater
│   ├── report/[id]/page.tsx        # Report preview + lead capture + full report
│   ├── api/
│   │   ├── analyze/route.ts        # Solar API + geocoding + report generation
│   │   ├── capture-lead/route.ts   # Save lead info, send emails, unlock report
│   │   └── validate-code/route.ts  # Optional: validate access code
│   └── layout.tsx
├── components/
│   ├── AddressAutocomplete.tsx     # Google Places autocomplete wrapper
│   ├── MapConfirmation.tsx         # Interactive map for pin adjustment
│   ├── ScanningAnimation.tsx       # Loading theater with progress messages
│   ├── ReportPreview.tsx           # Teaser view (blurred sections)
│   ├── ReportFull.tsx              # Complete report after lead capture
│   ├── LeadCaptureForm.tsx         # Name, email, phone form
│   ├── CostEstimateDisplay.tsx     # Visual cost range display
│   ├── SatelliteImage.tsx          # Static map image with overlay
│   └── ContactForm.tsx             # "Schedule Inspection" form
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client
│   ├── services/
│   │   ├── solarApi.ts             # Solar API buildingInsights client
│   │   ├── staticMaps.ts           # Static Maps URL builder
│   │   ├── roofAnalysis.ts         # Calculations: area, squares, complexity, costs
│   │   └── email.ts                # Resend wrapper for notifications
│   └── utils/
│       ├── formatters.ts           # Currency, ranges, display strings
│       └── constants.ts            # Pricing tiers, complexity thresholds
├── types/
│   ├── index.ts                    # TypeScript interfaces
│   └── database.ts                 # Supabase database types
└── supabase-schema.sql             # Database schema SQL
```

## User Flow

1. **Landing Page** (`/`): User enters optional access code and address
2. **Confirm Location** (`/confirm`): User verifies location on satellite map, can drag marker
3. **Analyzing** (`/analyzing`): Engaging scanning animation while API processes
4. **Report** (`/report/[id]`):
   - **Preview**: Shows partial data, blurred sections, lead capture form
   - **Full**: After providing contact info, shows complete analysis

## Customization

### Pricing

Modify pricing per square in environment variables:

```env
PRICE_ECONOMY_PER_SQUARE=450
PRICE_STANDARD_PER_SQUARE=550
PRICE_PREMIUM_PER_SQUARE=700
```

Or update the defaults in `lib/utils/constants.ts`.

### Partner Branding

Set partner name for display in forms and emails:

```env
NEXT_PUBLIC_PARTNER_NAME="ABC Roofing Co"
NEXT_PUBLIC_PARTNER_SCHEDULING_URL=https://calendly.com/abc-roofing
```

### Access Codes

Create access codes in Supabase to track marketing campaigns:

```sql
INSERT INTO access_code_campaigns (code, name)
VALUES ('SPRING-2025', 'Spring Mailer Campaign');
```

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

**Production Considerations**:
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Configure Google API key restrictions for your domain
- Set up Resend domain verification for email deliverability

## API Endpoints

### POST `/api/analyze`

Analyzes a roof and creates a report.

Request:
```json
{
  "lat": 30.2672,
  "lng": -97.7431,
  "fullAddress": "123 Main St, Austin, TX 78701",
  "addressLine1": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "postalCode": "78701",
  "accessCode": "DEMO-2024"
}
```

Response:
```json
{
  "success": true,
  "reportId": "uuid-here"
}
```

### POST `/api/capture-lead`

Captures lead information and unlocks the full report.

Request:
```json
{
  "reportId": "uuid-here",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "5551234567",
  "consentGiven": true
}
```

### POST `/api/validate-code`

Validates an access code.

Request:
```json
{
  "code": "DEMO-2024"
}
```

Response:
```json
{
  "valid": true,
  "campaignName": "Demo/Testing Campaign"
}
```

## Important Notes

### Accuracy Disclaimers

All estimates include clear messaging that they are:
- Preliminary satellite-based estimates
- NOT binding quotes or damage diagnostics
- Subject to on-site inspection for accurate pricing

### Cost Control

The application ONLY uses the Solar API `buildingInsights` endpoint at $0.01/request. The more expensive `dataLayers` endpoint ($0.075/request) is never called.

### Fallback Handling

When Solar API data is unavailable (rural areas, new construction), the system provides fallback estimates based on typical roof-to-home ratios with appropriate disclaimers.

## License

Private - All rights reserved
