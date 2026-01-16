import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { encryptLeadPII } from '@/lib/services/encryption';
import { rateLimitByIP, getClientIP, rateLimitHeaders } from '@/lib/services/rateLimit';
import { verifyTurnstileToken, isTurnstileConfigured } from '@/lib/services/turnstile';
import { Resend } from 'resend';

// Lazy initialization to avoid build errors when API key is not set
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimitByIP(clientIP, 'default');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const { reportId, rooferId, campaignId, name, email, phone, turnstileToken, consents } = body;

    if (!reportId || !rooferId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Turnstile token if configured
    if (isTurnstileConfigured()) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'Security verification required' },
          { status: 400 }
        );
      }

      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIP);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: turnstileResult.error || 'Security verification failed' },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Verify report exists and belongs to roofer
    const { data: report } = await supabase
      .from('roof_reports')
      .select('id, roofer_id, full_address')
      .eq('id', reportId)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Encrypt PII
    const encryptedPII = encryptLeadPII({ name, email, phone });

    // Create lead record
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        roofer_id: rooferId,
        report_id: reportId,
        campaign_id: campaignId || null,
        name_encrypted: encryptedPII.name_encrypted,
        email_encrypted: encryptedPII.email_encrypted,
        phone_encrypted: encryptedPII.phone_encrypted,
        pipeline_status: 'new',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to save contact' },
        { status: 500 }
      );
    }

    // Log consents
    if (consents && Array.isArray(consents)) {
      const consentRecords = consents.map((consent: { type: string; text: string; given: boolean }) => ({
        lead_id: lead.id,
        consent_type: consent.type,
        consent_text: consent.text,
        consent_given: consent.given,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || null,
        form_version: 'v1.0',
      }));

      await supabase.from('consent_audit_log').insert(consentRecords);
    }

    // Get roofer for notification
    const { data: roofer } = await supabase
      .from('roofers')
      .select('company_name, notification_email, notification_emails_additional')
      .eq('id', rooferId)
      .single();

    // Send email notification to roofer
    const resend = getResendClient();
    if (roofer && resend) {
      const recipients = [
        roofer.notification_email,
        ...(roofer.notification_emails_additional || []),
      ].filter(Boolean);

      try {
        await resend.emails.send({
          from: 'RoofCheck <notifications@roofcheck.com>',
          to: recipients,
          subject: `New Lead: ${report.full_address}`,
          html: `
            <h2>New Lead Captured!</h2>
            <p>A new contact has requested their roof report.</p>

            <h3>Contact Details</h3>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${phone}</li>
            </ul>

            <h3>Property</h3>
            <p>${report.full_address}</p>

            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads">View in Dashboard</a></p>

            <p style="color: #666; font-size: 12px;">
              This lead was captured via RoofCheck.
              Contact has consented to be reached.
            </p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
    });
  } catch (error) {
    console.error('Capture contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
