'use client';

import type { SolarBuildingInsights } from '@/types';

// Extended roof segment (from raw Solar API response)
interface RoofSegmentData {
  stats?: {
    areaMeters2: number;
    sunshineQuantiles?: number[];
  };
  // Direct properties (from raw API)
  areaMeters2?: number;
  sunshineQuantiles?: number[];
  pitchDegrees: number;
  azimuthDegrees: number;
}

interface RoofSegmentSummaryProps {
  solarData: SolarBuildingInsights | null;
}

// Helper to get area from segment (handles both formats)
function getSegmentArea(segment: RoofSegmentData): number {
  return segment.stats?.areaMeters2 || segment.areaMeters2 || 0;
}

// Helper to get sunshine quantiles from segment (handles both formats)
function getSegmentSunshine(segment: RoofSegmentData): number[] | undefined {
  return segment.stats?.sunshineQuantiles || segment.sunshineQuantiles;
}

// Get sun exposure level
function getSunExposureLevel(segment: RoofSegmentData): { level: string; color: string; bgColor: string } {
  const sunshineQuantiles = getSegmentSunshine(segment);
  const avgSunshine = sunshineQuantiles?.[5] || 1000;

  if (avgSunshine > 1200) return { level: 'Excellent', color: 'text-amber-700', bgColor: 'bg-amber-100' };
  if (avgSunshine > 1000) return { level: 'Good', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  if (avgSunshine > 800) return { level: 'Moderate', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
  return { level: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-100' };
}

// Get direction label from azimuth
function getDirectionLabel(azimuth: number): string {
  if (azimuth >= 337.5 || azimuth < 22.5) return 'North';
  if (azimuth >= 22.5 && azimuth < 67.5) return 'Northeast';
  if (azimuth >= 67.5 && azimuth < 112.5) return 'East';
  if (azimuth >= 112.5 && azimuth < 157.5) return 'Southeast';
  if (azimuth >= 157.5 && azimuth < 202.5) return 'South';
  if (azimuth >= 202.5 && azimuth < 247.5) return 'Southwest';
  if (azimuth >= 247.5 && azimuth < 292.5) return 'West';
  return 'Northwest';
}

// Get short direction label
function getShortDirection(azimuth: number): string {
  if (azimuth >= 337.5 || azimuth < 22.5) return 'N';
  if (azimuth >= 22.5 && azimuth < 67.5) return 'NE';
  if (azimuth >= 67.5 && azimuth < 112.5) return 'E';
  if (azimuth >= 112.5 && azimuth < 157.5) return 'SE';
  if (azimuth >= 157.5 && azimuth < 202.5) return 'S';
  if (azimuth >= 202.5 && azimuth < 247.5) return 'SW';
  if (azimuth >= 247.5 && azimuth < 292.5) return 'W';
  return 'NW';
}

// Direction icon component
function DirectionIcon({ azimuth }: { azimuth: number }) {
  // Rotate arrow to point in the direction the roof faces
  const rotation = azimuth;

  return (
    <div
      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
      title={`Facing ${getDirectionLabel(azimuth)}`}
    >
      <svg
        className="w-4 h-4 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </div>
  );
}

export default function RoofSegmentSummary({ solarData }: RoofSegmentSummaryProps) {
  const segments = (solarData?.solarPotential?.roofSegmentStats as unknown as RoofSegmentData[]) || [];

  if (segments.length === 0) return null;

  // Sort segments by area (largest first)
  const sortedSegments = [...segments].sort((a, b) => getSegmentArea(b) - getSegmentArea(a));

  // Calculate totals
  const totalAreaSqFt = segments.reduce((sum, s) => sum + getSegmentArea(s) * 10.764, 0);
  const avgSunshine = segments.reduce((sum, s) => {
    const sunshine = getSegmentSunshine(s);
    return sum + (sunshine?.[5] || 0);
  }, 0) / segments.length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{segments.length}</div>
          <div className="text-sm text-slate-500">Roof Sections</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{Math.round(totalAreaSqFt).toLocaleString()}</div>
          <div className="text-sm text-slate-500">Total Sq Ft</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{Math.round(avgSunshine)}</div>
          <div className="text-sm text-slate-500">Avg Sun Hrs/Yr</div>
        </div>
      </div>

      {/* Segment details */}
      <div className="space-y-3">
        {sortedSegments.slice(0, 6).map((segment, index) => {
          const sqft = Math.round(getSegmentArea(segment) * 10.764);
          const direction = getDirectionLabel(segment.azimuthDegrees);
          const shortDir = getShortDirection(segment.azimuthDegrees);
          const pitch = Math.round(segment.pitchDegrees);
          const sunExposure = getSunExposureLevel(segment);
          const sunshineHrs = Math.round(getSegmentSunshine(segment)?.[5] || 0);
          const percentOfTotal = Math.round((sqft / totalAreaSqFt) * 100);

          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <DirectionIcon azimuth={segment.azimuthDegrees} />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {direction}-Facing Section
                    </div>
                    <div className="text-sm text-slate-500">
                      {sqft.toLocaleString()} sq ft ({percentOfTotal}% of roof)
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${sunExposure.bgColor} ${sunExposure.color}`}>
                  {sunExposure.level} Sun
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Pitch</span>
                  <div className="font-medium text-slate-700">{pitch}°</div>
                </div>
                <div>
                  <span className="text-slate-500">Direction</span>
                  <div className="font-medium text-slate-700">{shortDir}</div>
                </div>
                <div>
                  <span className="text-slate-500">Sun Hours</span>
                  <div className="font-medium text-slate-700">{sunshineHrs}/yr</div>
                </div>
              </div>
            </div>
          );
        })}

        {segments.length > 6 && (
          <p className="text-sm text-slate-500 text-center">
            + {segments.length - 6} more smaller sections
          </p>
        )}
      </div>
    </div>
  );
}
