import { Resend } from 'resend';
import type { RoofReport } from '@/types';
import { formatCurrency, formatPhone } from '@/lib/utils/formatters';

// Lazy-initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Email sender configuration
const FROM_EMAIL = 'RoofCheck <reports@roofcheck.app>';

interface EmailResult {
  success: boolean;
  error?: string;
}

// Send homeowner confirmation email with report link
export async function sendHomeownerEmail(
  report: RoofReport,
  reportUrl: string
): Promise<EmailResult> {
  try {
    const squaresRange = report.roofSquaresLow && report.roofSquaresHigh
      ? `${report.roofSquaresLow} – ${report.roofSquaresHigh} squares`
      : 'N/A';

    const costRange = report.costStandardLow && report.costStandardHigh
      ? `${formatCurrency(report.costStandardLow)} – ${formatCurrency(report.costStandardHigh)}`
      : 'See report for details';

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: report.leadEmail!,
      subject: `Your Roof Report is Ready — ${report.addressLine1}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Roof Report is Ready</h1>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi ${report.leadName},</p>

            <p>Here's your satellite roof analysis for:</p>

            <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
              <strong style="color: #0f172a;">${report.fullAddress}</strong>
            </div>

            <h2 style="color: #0f172a; font-size: 18px; margin-top: 32px;">Quick Summary</h2>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Estimated Size</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">${squaresRange}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Complexity</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; text-transform: capitalize;">${report.complexity || 'Moderate'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b;">Est. Replacement Cost</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #10b981;">${costRange}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${reportUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
            </div>

            <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
              <strong>Next Step:</strong> Your report includes a detailed breakdown and helpful questions to ask roofing contractors. ${process.env.NEXT_PUBLIC_PARTNER_NAME} will reach out soon to discuss your options.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
              This report is a satellite-based preliminary assessment and does not constitute a professional inspection or binding quote. Actual roof condition and pricing can only be determined through on-site evaluation.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Homeowner email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send homeowner email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }
}

// Send roofer notification email with lead details
export async function sendRooferNotificationEmail(
  report: RoofReport,
  reportUrl: string,
  campaignName?: string
): Promise<EmailResult> {
  const rooferEmail = process.env.ROOFER_NOTIFICATION_EMAIL;

  if (!rooferEmail) {
    console.error('ROOFER_NOTIFICATION_EMAIL is not configured');
    return { success: false, error: 'Roofer email not configured' };
  }

  try {
    const squaresRange = report.roofSquaresLow && report.roofSquaresHigh
      ? `${report.roofSquaresLow} – ${report.roofSquaresHigh}`
      : 'N/A';

    const costRange = report.costStandardLow && report.costStandardHigh
      ? `${formatCurrency(report.costStandardLow)} – ${formatCurrency(report.costStandardHigh)}`
      : 'N/A';

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: rooferEmail,
      subject: `🏠 New Lead: ${report.leadName} — ${report.addressLine1}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 20px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🏠 New Lead from RoofCheck</h1>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">

            <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 24px;">Contact Information</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
              <tr>
                <td style="padding: 10px 0; color: #64748b; width: 100px;">Name</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${report.leadName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b;">Email</td>
                <td style="padding: 10px 0;"><a href="mailto:${report.leadEmail}" style="color: #10b981;">${report.leadEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b;">Phone</td>
                <td style="padding: 10px 0;"><a href="tel:${report.leadPhone}" style="color: #10b981;">${formatPhone(report.leadPhone!)}</a></td>
              </tr>
            </table>

            <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 16px;">Property Details</h2>

            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0;"><strong>${report.fullAddress}</strong></p>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Est. Squares</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${squaresRange}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Complexity</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${report.complexity || 'Moderate'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Est. Cost Range</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">${costRange}</td>
                </tr>
              </table>
            </div>

            ${campaignName ? `
            <p style="font-size: 14px; color: #64748b;">
              <strong>Campaign:</strong> ${campaignName}
            </p>
            ` : ''}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${reportUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
            </div>

            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⏰ This homeowner has requested contractor contact.</strong> Follow up within 24 hours for best results.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Roofer notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send roofer notification email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }
}
