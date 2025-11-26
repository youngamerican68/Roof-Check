// Pricing per square (100 sq ft) by material tier
// These values can be overridden by environment variables
export const PRICING = {
  economy: Number(process.env.PRICE_ECONOMY_PER_SQUARE) || 450,
  standard: Number(process.env.PRICE_STANDARD_PER_SQUARE) || 550,
  premium: Number(process.env.PRICE_PREMIUM_PER_SQUARE) || 700,
} as const;

// Complexity thresholds based on roof segment count
export const COMPLEXITY_THRESHOLDS = {
  simple: 4,    // <= 4 segments = simple
  moderate: 8,  // <= 8 segments = moderate
  // > 8 segments = complex
} as const;

// Uncertainty factor for estimates (±10%)
export const UNCERTAINTY_FACTOR = 0.1;

// Conversion factors
export const SQ_METERS_TO_SQ_FEET = 10.7639;
export const SQ_FEET_PER_SQUARE = 100;

// Default roof-to-home ratio for fallback estimates
// Typical range is 1.3x to 1.7x depending on home style
export const DEFAULT_ROOF_TO_HOME_RATIO = 1.5;

// Scanning animation messages
export const SCANNING_MESSAGES = [
  'Locating your property...',
  'Analyzing roof geometry...',
  'Measuring roof segments...',
  'Calculating sun exposure...',
  'Estimating replacement costs...',
  'Generating your report...',
] as const;

// Minimum animation display time in ms
export const MIN_ANIMATION_DURATION = 4000;

// Material tier descriptions
export const MATERIAL_TIERS = {
  economy: {
    name: 'Economy',
    material: '3-Tab Shingles',
    description: 'Basic protection, 15-20 year lifespan',
  },
  standard: {
    name: 'Standard',
    material: 'Architectural Shingles',
    description: 'Enhanced durability, 25-30 year lifespan',
  },
  premium: {
    name: 'Premium',
    material: 'Designer/Metal',
    description: 'Superior protection, 40-50+ year lifespan',
  },
} as const;

// Complexity descriptions
export const COMPLEXITY_DESCRIPTIONS = {
  simple: 'Your roof has a straightforward layout with few intersections — typically easier and less expensive to replace.',
  moderate: 'Your roof has multiple sections and some complexity — expect moderate labor requirements.',
  complex: 'Your roof has many planes, valleys, or dormers — these areas require more time and materials.',
} as const;

// Questions to ask roofer
export const ROOFER_QUESTIONS = [
  'My roof is approximately {squares} squares. What price per square are you quoting?',
  'Does your quote include tear-off of existing layers and disposal?',
  'Will you install ice-and-water shield in valleys and along eaves?',
  'What warranty do you offer on labor vs. materials?',
  'Can I see your proof of insurance and contractor\'s license?',
] as const;
