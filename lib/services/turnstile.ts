/**
 * Cloudflare Turnstile Service
 * Bot protection for form submissions
 *
 * Setup:
 * 1. Create a Turnstile widget at https://dash.cloudflare.com/
 * 2. Add TURNSTILE_SECRET_KEY to environment
 * 3. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY for client-side widget
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token server-side
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIP?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured, allow the request (for development)
  if (!secretKey) {
    console.warn('Turnstile not configured - skipping verification');
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIP) {
      formData.append('remoteip', remoteIP);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result: TurnstileVerifyResponse = await response.json();

    if (result.success) {
      return { success: true };
    }

    const errorCodes = result['error-codes'] || ['unknown-error'];
    return {
      success: false,
      error: `Verification failed: ${errorCodes.join(', ')}`,
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      error: 'Failed to verify challenge',
    };
  }
}

/**
 * Get Turnstile site key for client-side widget
 */
export function getTurnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
}

/**
 * Check if Turnstile is configured
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
