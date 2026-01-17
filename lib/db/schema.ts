import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const roofReports = pgTable('roof_reports', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Address
  addressLine1: text('address_line1').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  fullAddress: text('full_address').notNull(),
  lat: numeric('lat').notNull(),
  lng: numeric('lng').notNull(),
  placeId: text('place_id'),

  // Roof metrics
  estimationSource: text('estimation_source'),
  roofAreaSqftLow: numeric('roof_area_sqft_low'),
  roofAreaSqftHigh: numeric('roof_area_sqft_high'),
  roofSquaresLow: numeric('roof_squares_low'),
  roofSquaresHigh: numeric('roof_squares_high'),
  complexity: text('complexity'),
  pitchDegrees: numeric('pitch_degrees'),
  azimuthPrimary: text('azimuth_primary'),
  sunshineHoursAnnual: numeric('sunshine_hours_annual'),

  // Cost estimates
  costEconomyLow: numeric('cost_economy_low'),
  costEconomyHigh: numeric('cost_economy_high'),
  costStandardLow: numeric('cost_standard_low'),
  costStandardHigh: numeric('cost_standard_high'),
  costPremiumLow: numeric('cost_premium_low'),
  costPremiumHigh: numeric('cost_premium_high'),

  // Map & metadata
  staticMapUrl: text('static_map_url'),
  confidenceScore: text('confidence_score'),
  imageryDate: text('imagery_date'),

  // Lead capture
  leadCaptured: boolean('lead_captured').default(false),
  leadName: text('lead_name'),
  leadEmail: text('lead_email'),
  leadPhone: text('lead_phone'),
  leadCapturedAt: timestamp('lead_captured_at', { withTimezone: true }),

  // Lead qualification (Phase 2)
  wantsContractorContact: boolean('wants_contractor_contact').default(false),
  leadTimeline: text('lead_timeline'), // 'within_7_days', 'within_30_days', '1_3_months', '3_6_months', 'just_researching'
  leadIssueType: text('lead_issue_type'), // 'storm_damage', 'age_wear', 'leak', 'getting_quotes', 'other'

  // Consent fields (Phase 2)
  phoneConsent: boolean('phone_consent').default(false),
  phoneConsentAt: timestamp('phone_consent_at', { withTimezone: true }),
  marketingConsent: boolean('marketing_consent').default(false),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type RoofReport = typeof roofReports.$inferSelect;
export type NewRoofReport = typeof roofReports.$inferInsert;
