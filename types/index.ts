// ============================================
// Address & Location Types
// ============================================

export interface AddressComponents {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
}

export interface LocationData extends AddressComponents {
  lat: number;
  lng: number;
  placeId?: string;
}

// ============================================
// Google Solar API Types
// ============================================

export interface SolarRoofSegmentStats {
  areaMeters2: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  sunshineQuantiles?: number[];
}

export interface SolarWholeRoofStats {
  areaMeters2: number;
  sunshineQuantiles?: number[];
  groundAreaMeters2?: number;
}

export interface SolarPotential {
  maxArrayPanelsCount?: number;
  maxArrayAreaMeters2?: number;
  maxSunshineHoursPerYear?: number;
  carbonOffsetFactorKgPerMwh?: number;
  wholeRoofStats?: SolarWholeRoofStats;
  roofSegmentStats?: SolarRoofSegmentStats[];
  financialAnalyses?: unknown[];
}

export interface SolarBuildingInsights {
  name?: string;
  center?: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryDate?: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate?: {
    year: number;
    month: number;
    day: number;
  };
  postalCode?: string;
  administrativeArea?: string;
  statisticalArea?: string;
  regionCode?: string;
  solarPotential?: SolarPotential;
  imageryQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================
// Roof Analysis Types
// ============================================

export type RoofComplexity = 'simple' | 'moderate' | 'complex';
export type EstimationSource = 'solar_api' | 'heuristic' | 'fallback';
export type CardinalDirection =
  | 'North' | 'Northeast' | 'East' | 'Southeast'
  | 'South' | 'Southwest' | 'West' | 'Northwest';

export interface CostRange {
  low: number;
  high: number;
}

export interface RoofMetrics {
  // Area measurements
  roofAreaSqFtLow: number;
  roofAreaSqFtHigh: number;
  roofSquaresLow: number;
  roofSquaresHigh: number;

  // Roof characteristics
  complexity: RoofComplexity;
  pitchDegrees: number | null;
  azimuthPrimary: CardinalDirection | null;
  sunshineHoursAnnual: number | null;
  segmentCount: number;

  // Cost estimates
  costEconomy: CostRange;
  costStandard: CostRange;
  costPremium: CostRange;

  // Metadata
  estimationSource: EstimationSource;
}

export interface RoofInsight {
  title: string;
  content: string;
  type: 'sun' | 'complexity' | 'pitch' | 'general';
}

// ============================================
// Report Types
// ============================================

export interface RoofReport {
  id: string;

  // Location
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
  lat: number;
  lng: number;

  // Metrics
  estimationSource: EstimationSource;
  roofAreaSqFtLow: number | null;
  roofAreaSqFtHigh: number | null;
  roofSquaresLow: number | null;
  roofSquaresHigh: number | null;
  complexity: RoofComplexity | null;
  pitchDegrees: number | null;
  azimuthPrimary: string | null;
  sunshineHoursAnnual: number | null;

  // Costs
  costEconomyLow: number | null;
  costEconomyHigh: number | null;
  costStandardLow: number | null;
  costStandardHigh: number | null;
  costPremiumLow: number | null;
  costPremiumHigh: number | null;

  // Assets
  staticMapUrl: string | null;
  solarRawJson: SolarBuildingInsights | null;

  // Lead info
  leadCaptured: boolean;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  leadCapturedAt: string | null;

  // Lead qualification (Phase 2)
  wantsContractorContact: boolean;
  leadTimeline: string | null;
  leadIssueType: string | null;

  // Consent fields (Phase 2)
  phoneConsent: boolean;
  phoneConsentAt: string | null;
  marketingConsent: boolean;

  // Confidence/quality
  confidenceScore: ConfidenceScore | null;
  imageryDate: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface AnalyzeRequest {
  lat: number;
  lng: number;
  fullAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  accessCode?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface CaptureLeadRequest {
  reportId: string;
  name: string;
  email: string;
  phone: string;
  consentGiven: boolean;
  // Phase 2 fields
  wantsContractorContact?: boolean;
  leadTimeline?: string;
  leadIssueType?: string;
  phoneConsent?: boolean;
  marketingConsent?: boolean;
}

export interface CaptureLeadResponse {
  success: boolean;
  error?: string;
}

export interface ValidateCodeRequest {
  code: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  campaignName?: string;
}

// ============================================
// Component Props Types
// ============================================

export interface AddressAutocompleteProps {
  onSelect: (location: LocationData) => void;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface MapConfirmationProps {
  lat: number;
  lng: number;
  address: string;
  onConfirm: (lat: number, lng: number) => void;
  onAdjust?: () => void;
}

export interface ScanningAnimationProps {
  onComplete?: () => void;
  messages?: string[];
}

export interface LeadCaptureFormProps {
  reportId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export interface CostEstimateDisplayProps {
  economy: CostRange;
  standard: CostRange;
  premium: CostRange;
  isBlurred?: boolean;
}

// ============================================
// Multi-Tenant Types (SaaS)
// ============================================

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type PipelineStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'won' | 'lost';
export type ConsentType = 'contact' | 'sms' | 'email' | 'marketing';
export type ConfidenceScore = 'high' | 'medium' | 'low';
export type UsageEventType = 'report' | 'geocode' | 'map_tile';

export interface Roofer {
  id: string;
  authUserId: string;
  email: string;

  // Branding
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;

  // Contact & notifications
  notificationEmail: string;
  notificationEmailsAdditional: string[];
  schedulingUrl: string | null;

  // Widget configuration
  allowedDomains: string[];
  ctaHeadline: string;
  ctaButtonText: string;

  // Optional modules
  showPitch: boolean;
  showCostEstimates: boolean;
  costPerSquare: number | null;

  // Subscription
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  monthlyReportQuota: number;

  // API access
  apiKey: string;
  apiKeyCreatedAt: string;

  // Domain verification
  domainVerificationToken: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  rooferId: string;
  reportId: string;
  campaignId: string | null;

  // Contact info (encrypted at rest, decrypted in app)
  name: string;
  email: string;
  phone: string;

  // Pipeline
  pipelineStatus: PipelineStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UsageEvent {
  id: string;
  rooferId: string;
  reportId: string | null;
  eventType: UsageEventType;
  costCents: number;
  provider: string | null;
  createdAt: string;
}

export interface ConsentAuditLog {
  id: string;
  leadId: string;
  consentType: ConsentType;
  consentText: string;
  consentGiven: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  formVersion: string;
  createdAt: string;
}

export interface AddressCache {
  id: string;
  placeId: string;
  normalizedAddress: string | null;
  providerSource: string;
  derivedMetrics: Record<string, unknown>;
  confidenceScore: ConfidenceScore | null;
  imageryDate: string | null;
  cachedAt: string;
  expiresAt: string;
  hitCount: number;
}

export interface Campaign {
  id: string;
  rooferId: string | null;
  code: string;
  campaignToken: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dashboard API Types
// ============================================

export interface RooferDashboardStats {
  totalReports: number;
  totalLeads: number;
  conversionRate: number;
  quotaUsed: number;
  quotaLimit: number;
  recentLeads: Lead[];
  campaignPerformance: CampaignPerformance[];
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  reportCount: number;
  leadCount: number;
  conversionRate: number;
}

export interface RooferSettings {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  notificationEmail: string;
  notificationEmailsAdditional: string[];
  schedulingUrl: string | null;
  allowedDomains: string[];
  ctaHeadline: string;
  ctaButtonText: string;
  showPitch: boolean;
  showCostEstimates: boolean;
  costPerSquare: number | null;
}

// ============================================
// Auth Types
// ============================================

export interface RooferSignupRequest {
  email: string;
  password: string;
  companyName: string;
}

export interface RooferLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  roofer?: Roofer;
}

// ============================================
// Widget/Embed Types
// ============================================

export interface EmbedConfig {
  rooferKey: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  ctaHeadline: string;
  ctaButtonText: string;
  showPitch: boolean;
  showCostEstimates: boolean;
}

export interface EmbedTokenPayload {
  rooferId: string;
  domain: string;
  nonce: string;
  exp: number;
}

export interface CampaignTokenPayload {
  rooferId: string;
  campaignId: string;
  nonce: string;
  exp: number;
}
