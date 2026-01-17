import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, roofReports } from '@/lib/db';
import type { CaptureLeadResponse } from '@/types';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Request validation schema - updated for Phase 2
const captureLeadSchema = z.object({
  reportId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'Consent is required',
  }),
  // Phase 2 fields
  wantsContractorContact: z.boolean().optional().default(false),
  leadTimeline: z.string().nullable().optional(),
  leadIssueType: z.string().nullable().optional(),
  phoneConsent: z.boolean().optional().default(false),
  marketingConsent: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest): Promise<NextResponse<CaptureLeadResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = captureLeadSchema.parse(body);

    const {
      reportId,
      name,
      email,
      phone,
      wantsContractorContact,
      leadTimeline,
      leadIssueType,
      phoneConsent,
      marketingConsent,
    } = validatedData;

    // Check if report exists
    const [existingReport] = await db
      .select()
      .from(roofReports)
      .where(eq(roofReports.id, reportId))
      .limit(1);

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.leadCaptured) {
      // Lead already captured - just return success
      return NextResponse.json({ success: true });
    }

    // Update report with lead information
    const now = new Date();
    await db
      .update(roofReports)
      .set({
        leadCaptured: true,
        leadName: name.trim(),
        leadEmail: email.toLowerCase().trim(),
        leadPhone: phone ? phone.replace(/\D/g, '') : null, // Store just digits
        leadCapturedAt: now,
        // Phase 2 fields
        wantsContractorContact: wantsContractorContact || false,
        leadTimeline: leadTimeline || null,
        leadIssueType: leadIssueType || null,
        phoneConsent: phoneConsent || false,
        phoneConsentAt: phoneConsent ? now : null,
        marketingConsent: marketingConsent || false,
        updatedAt: now,
      })
      .where(eq(roofReports.id, reportId));

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
