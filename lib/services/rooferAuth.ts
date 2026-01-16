/**
 * Roofer Authentication Service
 * Handles signup, login, and session management using Supabase Auth
 */

import { createServerClient } from '../supabase/server';
import type { Roofer, RooferSignupRequest, AuthResponse } from '@/types';

/**
 * Sign up a new roofer
 */
export async function signUpRoofer(
  data: RooferSignupRequest
): Promise<AuthResponse> {
  const supabase = createServerClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        company_name: data.companyName,
      },
    },
  });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to create user account',
    };
  }

  // 2. Create roofer record
  const { data: roofer, error: rooferError } = await supabase
    .from('roofers')
    .insert({
      auth_user_id: authData.user.id,
      email: data.email,
      company_name: data.companyName,
      notification_email: data.email,
    })
    .select()
    .single();

  if (rooferError) {
    // Rollback: delete auth user if roofer creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return {
      success: false,
      error: 'Failed to create roofer profile: ' + rooferError.message,
    };
  }

  return {
    success: true,
    roofer: mapRooferFromDb(roofer),
  };
}

/**
 * Sign in a roofer
 */
export async function signInRoofer(
  email: string,
  password: string
): Promise<AuthResponse> {
  const supabase = createServerClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to sign in',
    };
  }

  // Get roofer profile
  const { data: roofer, error: rooferError } = await supabase
    .from('roofers')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (rooferError || !roofer) {
    return {
      success: false,
      error: 'Roofer profile not found',
    };
  }

  return {
    success: true,
    roofer: mapRooferFromDb(roofer),
  };
}

/**
 * Sign out current roofer
 */
export async function signOutRoofer(): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get current authenticated roofer
 */
export async function getCurrentRoofer(): Promise<Roofer | null> {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: roofer } = await supabase
    .from('roofers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!roofer) {
    return null;
  }

  return mapRooferFromDb(roofer);
}

/**
 * Get roofer by API key
 */
export async function getRooferByApiKey(apiKey: string): Promise<Roofer | null> {
  const supabase = createServerClient();

  const { data: roofer } = await supabase
    .from('roofers')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (!roofer) {
    return null;
  }

  return mapRooferFromDb(roofer);
}

/**
 * Regenerate API key for a roofer
 */
export async function regenerateApiKey(rooferId: string): Promise<string | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('roofers')
    .update({
      api_key: `rk_${crypto.randomUUID().replace(/-/g, '')}`,
      api_key_created_at: new Date().toISOString(),
    })
    .eq('id', rooferId)
    .select('api_key')
    .single();

  if (error || !data) {
    return null;
  }

  return data.api_key;
}

/**
 * Map database roofer to TypeScript type
 */
function mapRooferFromDb(dbRoofer: Record<string, unknown>): Roofer {
  return {
    id: dbRoofer.id as string,
    authUserId: dbRoofer.auth_user_id as string,
    email: dbRoofer.email as string,
    companyName: dbRoofer.company_name as string,
    logoUrl: dbRoofer.logo_url as string | null,
    primaryColor: dbRoofer.primary_color as string,
    notificationEmail: dbRoofer.notification_email as string,
    notificationEmailsAdditional: (dbRoofer.notification_emails_additional as string[]) || [],
    schedulingUrl: dbRoofer.scheduling_url as string | null,
    allowedDomains: (dbRoofer.allowed_domains as string[]) || [],
    ctaHeadline: dbRoofer.cta_headline as string,
    ctaButtonText: dbRoofer.cta_button_text as string,
    showPitch: dbRoofer.show_pitch as boolean,
    showCostEstimates: dbRoofer.show_cost_estimates as boolean,
    costPerSquare: dbRoofer.cost_per_square as number | null,
    subscriptionStatus: dbRoofer.subscription_status as Roofer['subscriptionStatus'],
    stripeCustomerId: dbRoofer.stripe_customer_id as string | null,
    stripeSubscriptionId: dbRoofer.stripe_subscription_id as string | null,
    currentPeriodStart: dbRoofer.current_period_start as string | null,
    currentPeriodEnd: dbRoofer.current_period_end as string | null,
    monthlyReportQuota: dbRoofer.monthly_report_quota as number,
    apiKey: dbRoofer.api_key as string,
    apiKeyCreatedAt: dbRoofer.api_key_created_at as string,
    domainVerificationToken: dbRoofer.domain_verification_token as string,
    createdAt: dbRoofer.created_at as string,
    updatedAt: dbRoofer.updated_at as string,
  };
}
