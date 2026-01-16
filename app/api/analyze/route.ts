import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, roofReports } from '@/lib/db';
import { fetchBuildingInsights, hasDetailedSegmentData } from '@/lib/services/solarApi';
import { analyzeFromSolarData, generateFallbackMetrics } from '@/lib/services/roofAnalysis';
import { buildReportMapUrl } from '@/lib/services/staticMaps';
import type { AnalyzeResponse } from '@/types';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Request validation schema
const analyzeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fullAddress: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  placeId: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = analyzeSchema.parse(body);

    const {
      lat,
      lng,
      fullAddress,
      addressLine1,
      city,
      state,
      postalCode,
      placeId,
    } = validatedData;

    // Fetch roof data from Solar API
    const solarResult = await fetchBuildingInsights(lat, lng);

    let metrics;
    let confidenceScore: 'high' | 'medium' | 'low' = 'low';
    let imageryDate: string | null = null;

    if (solarResult.success && solarResult.data) {
      // Use Solar API data
      metrics = analyzeFromSolarData(solarResult.data);

      // Determine confidence based on data quality
      if (hasDetailedSegmentData(solarResult.data)) {
        confidenceScore = 'high';
      } else if (solarResult.data.solarPotential?.wholeRoofStats) {
        confidenceScore = 'medium';
      }

      // Extract imagery date
      if (solarResult.data.imageryDate) {
        const { year, month, day } = solarResult.data.imageryDate;
        imageryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    } else {
      // Fall back to heuristic estimation
      console.log('Solar API unavailable, using fallback:', solarResult.error);
      metrics = generateFallbackMetrics();
      confidenceScore = 'low';
    }

    // Generate static map URL
    const staticMapUrl = buildReportMapUrl(lat, lng);

    // Create report record in database using Drizzle
    const [report] = await db
      .insert(roofReports)
      .values({
        placeId: placeId || null,
        addressLine1,
        city,
        state,
        postalCode,
        fullAddress,
        lat: String(lat),
        lng: String(lng),
        estimationSource: metrics.estimationSource,
        roofAreaSqftLow: String(metrics.roofAreaSqFtLow),
        roofAreaSqftHigh: String(metrics.roofAreaSqFtHigh),
        roofSquaresLow: String(metrics.roofSquaresLow),
        roofSquaresHigh: String(metrics.roofSquaresHigh),
        complexity: metrics.complexity,
        pitchDegrees: metrics.pitchDegrees != null && !isNaN(metrics.pitchDegrees) ? String(metrics.pitchDegrees) : null,
        azimuthPrimary: metrics.azimuthPrimary || null,
        sunshineHoursAnnual: metrics.sunshineHoursAnnual ? String(metrics.sunshineHoursAnnual) : null,
        costEconomyLow: String(metrics.costEconomy.low),
        costEconomyHigh: String(metrics.costEconomy.high),
        costStandardLow: String(metrics.costStandard.low),
        costStandardHigh: String(metrics.costStandard.high),
        costPremiumLow: String(metrics.costPremium.low),
        costPremiumHigh: String(metrics.costPremium.high),
        staticMapUrl,
        confidenceScore,
        imageryDate,
      })
      .returning({ id: roofReports.id });

    if (!report) {
      console.error('Failed to create report');
      return NextResponse.json(
        { success: false, error: 'Failed to create report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
    });
  } catch (error) {
    console.error('Analyze API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
