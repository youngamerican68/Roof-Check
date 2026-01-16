import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, roofReports } from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const [report] = await db
      .select()
      .from(roofReports)
      .where(eq(roofReports.id, id))
      .limit(1);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Map database fields to camelCase for frontend
    const mappedReport = {
      id: report.id,
      addressLine1: report.addressLine1,
      city: report.city,
      state: report.state,
      postalCode: report.postalCode,
      fullAddress: report.fullAddress,
      lat: report.lat,
      lng: report.lng,
      estimationSource: report.estimationSource,
      roofAreaSqFtLow: report.roofAreaSqftLow,
      roofAreaSqFtHigh: report.roofAreaSqftHigh,
      roofSquaresLow: report.roofSquaresLow,
      roofSquaresHigh: report.roofSquaresHigh,
      complexity: report.complexity,
      pitchDegrees: report.pitchDegrees,
      azimuthPrimary: report.azimuthPrimary,
      sunshineHoursAnnual: report.sunshineHoursAnnual,
      costEconomyLow: report.costEconomyLow,
      costEconomyHigh: report.costEconomyHigh,
      costStandardLow: report.costStandardLow,
      costStandardHigh: report.costStandardHigh,
      costPremiumLow: report.costPremiumLow,
      costPremiumHigh: report.costPremiumHigh,
      staticMapUrl: report.staticMapUrl,
      confidenceScore: report.confidenceScore,
      imageryDate: report.imageryDate,
      leadCaptured: report.leadCaptured,
      leadName: report.leadName,
      leadEmail: report.leadEmail,
      leadPhone: report.leadPhone,
      leadCapturedAt: report.leadCapturedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    return NextResponse.json(mappedReport);
  } catch (error) {
    console.error('Report fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
