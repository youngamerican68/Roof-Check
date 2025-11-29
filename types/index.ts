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
