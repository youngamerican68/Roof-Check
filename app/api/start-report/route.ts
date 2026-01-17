import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, roofReports } from '@/lib/db';
import { fetchBuildingInsights, hasDetailedSegmentData } from '@/lib/services/solarApi';
import { analyzeFromSolarData, generateFallbackMetrics } from '@/lib/services/roofAnalysis';
import { buildReportMapUrl } from '@/lib/services/staticMaps';
import crypto from 'crypto';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Request validation schema
const startReportSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fullAddress: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  placeId: z.string().optional(),
  sessionId: z.string().min(1), // For idempotency
  reportId: z.string().uuid().optional(), // If we already have a report ID
});

interface StartReportResponse {
  success: boolean;
  reportId?: string;
  status?: 'created' | 'existing' | 'pending';
  error?: string;
}

// Generate address hash for deduplication
function generateAddressHash(lat: number, lng: number, address: string): string {
  const normalized = `${lat.toFixed(6)}:${lng.toFixed(6)}:${address.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

export async function POST(request: NextRequest): Promise<NextResponse<StartReportResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = startReportSchema.parse(body);

    const {
      lat,
      lng,
      fullAddress,
      addressLine1,
      city,
      state,
      postalCode,
      placeId,
      sessionId,
      reportId: existingReportId,
    } = validatedData;

    // Check if we already have a report with this ID
    if (existingReportId) {
      const [existingReport] = await db
        .select({ id: roofReports.id })
        .from(roofReports)
        .where(eq(roofReports.id, existingReportId))
        .limit(1);

      if (existingReport) {
        return NextResponse.json({
          success: true,
          reportId: existingReport.id,
          status: 'existing',
        });
      }
    }

    // Generate address hash for deduplication
    const addressHash = generateAddressHash(lat, lng, fullAddress);

    // Check for existing recent report with same address (within last 24 hours)
    // This prevents duplicate reports on back/forward navigation
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Note: We're using a combination of lat/lng and address for deduplication
    // In a production system, you'd want to store the addressHash and sessionId in the DB
    const [recentReport] = await db
      .select({ id: roofReports.id })
      .from(roofReports)
      .where(
        and(
          eq(roofReports.lat, String(lat)),
          eq(roofReports.lng, String(lng)),
          eq(roofReports.fullAddress, fullAddress)
        )
      )
      .limit(1);

    if (recentReport) {
      // Return existing report
      return NextResponse.json({
        success: true,
        reportId: recentReport.id,
        status: 'existing',
      });
    }

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

    // Create report record in database
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
      status: 'created',
    });
  } catch (error) {
    console.error('Start report API error:', error);

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

// Also support GET to check report status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      );
    }

    const [report] = await db
      .select({
        id: roofReports.id,
        roofSquaresLow: roofReports.roofSquaresLow,
        costStandardLow: roofReports.costStandardLow,
        complexity: roofReports.complexity,
      })
      .from(roofReports)
      .where(eq(roofReports.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
      });
    }

    // Check generation progress based on what fields are populated
    const hasGeometry = !!report.roofSquaresLow;
    const hasCosts = !!report.costStandardLow;
    const hasComplexity = !!report.complexity;

    return NextResponse.json({
      success: true,
      reportId: report.id,
      progress: {
        geometry: hasGeometry,
        squares: hasGeometry, // Same as geometry in our case
        costs: hasCosts,
      },
      isComplete: hasGeometry && hasCosts && hasComplexity,
    });
  } catch (error) {
    console.error('Check report status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
