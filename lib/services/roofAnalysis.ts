import type {
  SolarBuildingInsights,
  RoofMetrics,
  RoofComplexity,
  CostRange,
  RoofInsight,
  CardinalDirection,
} from '@/types';
import {
  PRICING,
  COMPLEXITY_THRESHOLDS,
  UNCERTAINTY_FACTOR,
  SQ_METERS_TO_SQ_FEET,
  SQ_FEET_PER_SQUARE,
  DEFAULT_ROOF_TO_HOME_RATIO,
  COMPLEXITY_DESCRIPTIONS,
} from '@/lib/utils/constants';
import { azimuthToDirection } from '@/lib/utils/formatters';
import {
  hasDetailedSegmentData,
  getWeightedAveragePitch,
  getPrimaryAzimuth,
} from './solarApi';

// Determine roof complexity based on segment count
export function getComplexity(segmentCount: number | undefined): RoofComplexity {
  if (!segmentCount || segmentCount <= 0) return 'moderate'; // Default
  if (segmentCount <= COMPLEXITY_THRESHOLDS.simple) return 'simple';
  if (segmentCount <= COMPLEXITY_THRESHOLDS.moderate) return 'moderate';
  return 'complex';
}

// Apply uncertainty factor to a value (returns low and high)
function applyUncertainty(value: number): { low: number; high: number } {
  return {
    low: Math.round(value * (1 - UNCERTAINTY_FACTOR)),
    high: Math.round(value * (1 + UNCERTAINTY_FACTOR)),
  };
}

// Calculate cost range for a material tier
function calculateCostRange(
  squaresLow: number,
  squaresHigh: number,
  pricePerSquare: number
): CostRange {
  // Apply additional uncertainty to costs
  return {
    low: Math.round(squaresLow * pricePerSquare * (1 - UNCERTAINTY_FACTOR)),
    high: Math.round(squaresHigh * pricePerSquare * (1 + UNCERTAINTY_FACTOR)),
  };
}

// Analyze roof metrics from Solar API data
export function analyzeFromSolarData(
  solarData: SolarBuildingInsights
): RoofMetrics {
  const wholeRoof = solarData.solarPotential?.wholeRoofStats;
  const segments = solarData.solarPotential?.roofSegmentStats;
  const segmentCount = segments?.length ?? 0;

  // Calculate roof area
  const roofAreaSqM = wholeRoof?.areaMeters2 ?? 0;
  const roofAreaSqFt = roofAreaSqM * SQ_METERS_TO_SQ_FEET;
  const areaRange = applyUncertainty(roofAreaSqFt);

  // Calculate squares
  const squaresLow = areaRange.low / SQ_FEET_PER_SQUARE;
  const squaresHigh = areaRange.high / SQ_FEET_PER_SQUARE;

  // Get pitch and azimuth
  const pitchDegrees = getWeightedAveragePitch(solarData);
  const azimuthDegrees = getPrimaryAzimuth(solarData);
  const azimuthPrimary: CardinalDirection | null = azimuthDegrees !== null
    ? azimuthToDirection(azimuthDegrees)
    : null;

  // Get sunshine hours
  const sunshineHours = solarData.solarPotential?.maxSunshineHoursPerYear ?? null;

  // Determine complexity
  const complexity = getComplexity(segmentCount);

  // Calculate costs for each tier
  const costEconomy = calculateCostRange(squaresLow, squaresHigh, PRICING.economy);
  const costStandard = calculateCostRange(squaresLow, squaresHigh, PRICING.standard);
  const costPremium = calculateCostRange(squaresLow, squaresHigh, PRICING.premium);

  return {
    roofAreaSqFtLow: areaRange.low,
    roofAreaSqFtHigh: areaRange.high,
    roofSquaresLow: Math.round(squaresLow * 10) / 10, // One decimal
    roofSquaresHigh: Math.round(squaresHigh * 10) / 10,
    complexity,
    pitchDegrees: pitchDegrees !== null ? Math.round(pitchDegrees * 10) / 10 : null,
    azimuthPrimary,
    sunshineHoursAnnual: sunshineHours !== null ? Math.round(sunshineHours) : null,
    segmentCount,
    costEconomy,
    costStandard,
    costPremium,
    estimationSource: 'solar_api',
  };
}

// Generate fallback metrics when Solar API data is unavailable
export function generateFallbackMetrics(
  estimatedHomeSqFt?: number
): RoofMetrics {
  // Use a reasonable default if no home size provided
  const homeSqFt = estimatedHomeSqFt || 2000;
  const roofAreaSqFt = homeSqFt * DEFAULT_ROOF_TO_HOME_RATIO;
  const areaRange = applyUncertainty(roofAreaSqFt);

  const squaresLow = areaRange.low / SQ_FEET_PER_SQUARE;
  const squaresHigh = areaRange.high / SQ_FEET_PER_SQUARE;

  const costEconomy = calculateCostRange(squaresLow, squaresHigh, PRICING.economy);
  const costStandard = calculateCostRange(squaresLow, squaresHigh, PRICING.standard);
  const costPremium = calculateCostRange(squaresLow, squaresHigh, PRICING.premium);

  return {
    roofAreaSqFtLow: areaRange.low,
    roofAreaSqFtHigh: areaRange.high,
    roofSquaresLow: Math.round(squaresLow * 10) / 10,
    roofSquaresHigh: Math.round(squaresHigh * 10) / 10,
    complexity: 'moderate', // Default assumption
    pitchDegrees: null,
    azimuthPrimary: null,
    sunshineHoursAnnual: null,
    segmentCount: 0,
    costEconomy,
    costStandard,
    costPremium,
    estimationSource: 'fallback',
  };
}

// Generate narrative insights based on roof metrics
export function generateInsights(
  metrics: RoofMetrics,
  hasSolarData: boolean
): RoofInsight[] {
  const insights: RoofInsight[] = [];

  // Sun exposure insight
  if (metrics.azimuthPrimary && metrics.sunshineHoursAnnual) {
    const exposure = metrics.sunshineHoursAnnual > 1500 ? 'high' :
                     metrics.sunshineHoursAnnual > 1200 ? 'moderate' : 'lower';

    let sunContent = `Your roof's primary face is ${metrics.azimuthPrimary.toLowerCase()}-facing`;

    if (metrics.azimuthPrimary === 'South' || metrics.azimuthPrimary === 'Southwest' || metrics.azimuthPrimary === 'West') {
      sunContent += ` with ${exposure} annual sun exposure (~${metrics.sunshineHoursAnnual.toLocaleString()} hours/year). `;
      sunContent += 'South and west sections typically experience faster shingle degradation due to UV exposure.';
    } else {
      sunContent += `. With ~${metrics.sunshineHoursAnnual.toLocaleString()} hours of annual sun exposure, `;
      sunContent += 'your roof experiences moderate UV stress.';
    }

    insights.push({
      title: 'Sun Exposure',
      content: sunContent,
      type: 'sun',
    });
  }

  // Complexity insight
  if (metrics.complexity && metrics.segmentCount > 0) {
    let complexityContent = `With ${metrics.segmentCount} distinct roof planes, `;

    if (metrics.complexity === 'complex') {
      complexityContent += 'your roof has multiple valleys and intersections. These areas are common leak points and should be carefully inspected.';
    } else if (metrics.complexity === 'moderate') {
      complexityContent += 'your roof has a typical residential layout with some complexity in the valleys and transitions.';
    } else {
      complexityContent += 'your roof has a straightforward layout that\'s generally easier to work on.';
    }

    insights.push({
      title: 'Roof Complexity',
      content: complexityContent,
      type: 'complexity',
    });
  }

  // Pitch insight
  if (metrics.pitchDegrees !== null) {
    const pitchCategory = metrics.pitchDegrees > 30 ? 'steep' :
                          metrics.pitchDegrees > 18 ? 'moderate' : 'low';

    let pitchContent = `Your roof pitch of ${metrics.pitchDegrees}° is considered ${pitchCategory}. `;

    if (pitchCategory === 'steep') {
      pitchContent += 'Steeper roofs shed water and debris effectively but can be more challenging (and costly) to work on.';
    } else if (pitchCategory === 'moderate') {
      pitchContent += 'This is a common pitch that provides good water runoff while remaining accessible for maintenance.';
    } else {
      pitchContent += 'Lower pitch roofs require proper drainage and may need more attention to prevent ponding.';
    }

    insights.push({
      title: 'Roof Pitch',
      content: pitchContent,
      type: 'pitch',
    });
  }

  // Add fallback insight if Solar API data was limited
  if (!hasSolarData || metrics.estimationSource === 'fallback') {
    insights.push({
      title: 'Data Availability',
      content: 'Detailed satellite data was limited for your location. The estimates above are based on typical roof-to-home ratios. An on-site measurement will provide exact figures.',
      type: 'general',
    });
  }

  return insights;
}

// Get the complexity description text
export function getComplexityDescription(complexity: RoofComplexity): string {
  return COMPLEXITY_DESCRIPTIONS[complexity];
}
