import type { SolarBuildingInsights } from '@/types';

// Google Solar API client
// Uses ONLY the buildingInsights endpoint ($0.01/request)
// DO NOT use dataLayers endpoint ($0.075/request)

const SOLAR_API_BASE = 'https://solar.googleapis.com/v1';

interface SolarApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

export interface SolarApiResult {
  success: boolean;
  data?: SolarBuildingInsights;
  error?: string;
  errorCode?: number;
}

// Fetch building insights from the Solar API
export async function fetchBuildingInsights(
  lat: number,
  lng: number
): Promise<SolarApiResult> {
  const apiKey = process.env.GOOGLE_SOLAR_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_SOLAR_API_KEY is not configured');
    return {
      success: false,
      error: 'Solar API not configured',
    };
  }

  const url = `${SOLAR_API_BASE}/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        // No building data found for this location
        return {
          success: false,
          error: 'No building data available for this location',
          errorCode: 404,
        };
      }

      if (response.status === 429) {
        // Rate limited
        return {
          success: false,
          error: 'API rate limit exceeded. Please try again later.',
          errorCode: 429,
        };
      }

      // Try to parse error response
      try {
        const errorData: SolarApiError = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `API error: ${response.status}`,
          errorCode: response.status,
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status}`,
          errorCode: response.status,
        };
      }
    }

    const data: SolarBuildingInsights = await response.json();

    // Validate that we have useful roof data
    if (!data.solarPotential?.wholeRoofStats?.areaMeters2) {
      return {
        success: false,
        error: 'Incomplete roof data returned from API',
        errorCode: 200, // API returned OK but data is incomplete
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Solar API fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch solar data',
    };
  }
}

// Check if the Solar API response has detailed segment data
export function hasDetailedSegmentData(data: SolarBuildingInsights): boolean {
  return (
    !!data.solarPotential?.roofSegmentStats &&
    data.solarPotential.roofSegmentStats.length > 0
  );
}

// Get the primary roof segment (largest area) from the response
export function getPrimaryRoofSegment(data: SolarBuildingInsights) {
  const segments = data.solarPotential?.roofSegmentStats;
  if (!segments || segments.length === 0) return null;

  return segments.reduce((largest, current) =>
    current.areaMeters2 > largest.areaMeters2 ? current : largest
  );
}

// Calculate weighted average pitch from all segments
export function getWeightedAveragePitch(data: SolarBuildingInsights): number | null {
  const segments = data.solarPotential?.roofSegmentStats;
  if (!segments || segments.length === 0) return null;

  const totalArea = segments.reduce((sum, seg) => sum + seg.areaMeters2, 0);
  if (totalArea === 0) return null;

  const weightedSum = segments.reduce(
    (sum, seg) => sum + seg.pitchDegrees * seg.areaMeters2,
    0
  );

  return weightedSum / totalArea;
}

// Get primary azimuth (from largest segment)
export function getPrimaryAzimuth(data: SolarBuildingInsights): number | null {
  const primarySegment = getPrimaryRoofSegment(data);
  return primarySegment?.azimuthDegrees ?? null;
}
