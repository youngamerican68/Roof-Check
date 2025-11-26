import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fetchBuildingInsights, hasDetailedSegmentData } from '@/lib/services/solarApi';
import { analyzeFromSolarData, generateFallbackMetrics } from '@/lib/services/roofAnalysis';
import { buildReportMapUrl } from '@/lib/services/staticMaps';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types';

// Request validation schema
const analyzeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fullAddress: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  accessCode: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // Parse and validate request body
    const body: AnalyzeRequest = await request.json();
    const validatedData = analyzeSchema.parse(body);

    const {
      lat,
      lng,
      fullAddress,
      addressLine1,
      city,
      state,
      postalCode,
      accessCode,
    } = validatedData;

    const supabase = getSupabaseServerClient();

    // Look up access code campaign if provided
    let accessCodeId: string | null = null;
    if (accessCode) {
      const { data: campaign } = await supabase
        .from('access_code_campaigns')
        .select('id')
        .eq('code', accessCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (campaign) {
        accessCodeId = campaign.id;
      }
      // If code is invalid, we still proceed - just don't link to a campaign
    }

    // Fetch roof data from Solar API
    const solarResult = await fetchBuildingInsights(lat, lng);

    let metrics;
    let solarRawJson = null;
    let hasSolarData = false;

    if (solarResult.success && solarResult.data) {
      // Use Solar API data
      metrics = analyzeFromSolarData(solarResult.data);
      solarRawJson = solarResult.data;
      hasSolarData = hasDetailedSegmentData(solarResult.data);
    } else {
      // Fall back to heuristic estimation
      console.log('Solar API unavailable, using fallback:', solarResult.error);
      metrics = generateFallbackMetrics();
    }

    // Generate static map URL
    const staticMapUrl = buildReportMapUrl(lat, lng);

    // Create report record in database
    const { data: report, error: insertError } = await supabase
      .from('roof_reports')
      .insert({
        access_code_id: accessCodeId,
        address_line1: addressLine1,
        city,
        state,
        postal_code: postalCode,
        full_address: fullAddress,
        lat,
        lng,
        estimation_source: metrics.estimationSource,
        roof_area_sqft_low: metrics.roofAreaSqFtLow,
        roof_area_sqft_high: metrics.roofAreaSqFtHigh,
        roof_squares_low: metrics.roofSquaresLow,
        roof_squares_high: metrics.roofSquaresHigh,
        complexity: metrics.complexity,
        pitch_degrees: metrics.pitchDegrees,
        azimuth_primary: metrics.azimuthPrimary,
        sunshine_hours_annual: metrics.sunshineHoursAnnual,
        cost_economy_low: metrics.costEconomy.low,
        cost_economy_high: metrics.costEconomy.high,
        cost_standard_low: metrics.costStandard.low,
        cost_standard_high: metrics.costStandard.high,
        cost_premium_low: metrics.costPremium.low,
        cost_premium_high: metrics.costPremium.high,
        static_map_url: staticMapUrl,
        solar_raw_json: solarRawJson,
      })
      .select('id')
      .single();

    if (insertError || !report) {
      console.error('Failed to create report:', insertError);
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
