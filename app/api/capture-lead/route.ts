import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendHomeownerEmail, sendRooferNotificationEmail } from '@/lib/services/email';
import type { CaptureLeadRequest, CaptureLeadResponse, RoofReport } from '@/types';

// Request validation schema
const captureLeadSchema = z.object({
  reportId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'You must agree to be contacted',
  }),
});

export async function POST(request: NextRequest): Promise<NextResponse<CaptureLeadResponse>> {
  try {
    // Parse and validate request body
    const body: CaptureLeadRequest = await request.json();
    const validatedData = captureLeadSchema.parse(body);

    const { reportId, name, email, phone } = validatedData;

    const supabase = getSupabaseServerClient();

    // Check if report exists and lead hasn't already been captured
    const { data: existingReport, error: fetchError } = await supabase
      .from('roof_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.lead_captured) {
      // Lead already captured - just return success
      return NextResponse.json({ success: true });
    }

    // Update report with lead information
    const { error: updateError } = await supabase
      .from('roof_reports')
      .update({
        lead_captured: true,
        lead_name: name.trim(),
        lead_email: email.toLowerCase().trim(),
        lead_phone: phone.replace(/\D/g, ''), // Store just digits
        lead_captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Failed to update report with lead:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save contact information' },
        { status: 500 }
      );
    }

    // Build report URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reportUrl = `${appUrl}/report/${reportId}`;

    // Transform database record to RoofReport type for email functions
    const report: RoofReport = {
      id: existingReport.id,
      addressLine1: existingReport.address_line1,
      city: existingReport.city,
      state: existingReport.state,
      postalCode: existingReport.postal_code,
      fullAddress: existingReport.full_address,
      lat: Number(existingReport.lat),
      lng: Number(existingReport.lng),
      estimationSource: existingReport.estimation_source,
      roofAreaSqFtLow: existingReport.roof_area_sqft_low,
      roofAreaSqFtHigh: existingReport.roof_area_sqft_high,
      roofSquaresLow: existingReport.roof_squares_low,
      roofSquaresHigh: existingReport.roof_squares_high,
      complexity: existingReport.complexity,
      pitchDegrees: existingReport.pitch_degrees,
      azimuthPrimary: existingReport.azimuth_primary,
      sunshineHoursAnnual: existingReport.sunshine_hours_annual,
      costEconomyLow: existingReport.cost_economy_low,
      costEconomyHigh: existingReport.cost_economy_high,
      costStandardLow: existingReport.cost_standard_low,
      costStandardHigh: existingReport.cost_standard_high,
      costPremiumLow: existingReport.cost_premium_low,
      costPremiumHigh: existingReport.cost_premium_high,
      staticMapUrl: existingReport.static_map_url,
      leadCaptured: true,
      leadName: name.trim(),
      leadEmail: email.toLowerCase().trim(),
      leadPhone: phone.replace(/\D/g, ''),
      leadCapturedAt: new Date().toISOString(),
      createdAt: existingReport.created_at,
      updatedAt: new Date().toISOString(),
    };

    // Get campaign name if linked
    let campaignName: string | undefined;
    if (existingReport.access_code_id) {
      const { data: campaign } = await supabase
        .from('access_code_campaigns')
        .select('name')
        .eq('id', existingReport.access_code_id)
        .single();

      if (campaign) {
        campaignName = campaign.name;
      }
    }

    // Send emails (don't block on failures)
    const [homeownerResult, rooferResult] = await Promise.all([
      sendHomeownerEmail(report, reportUrl),
      sendRooferNotificationEmail(report, reportUrl, campaignName),
    ]);

    // Log email failures but don't fail the request
    if (!homeownerResult.success) {
      console.error('Failed to send homeowner email:', homeownerResult.error);
    }
    if (!rooferResult.success) {
      console.error('Failed to send roofer notification:', rooferResult.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Capture lead API error:', error);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
