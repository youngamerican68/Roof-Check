import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { signEmbedToken } from '@/lib/services/embedToken';
import { rateLimitByIP, getClientIP, rateLimitHeaders } from '@/lib/services/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimitByIP(clientIP, 'embed');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();
    const { rooferKey, domain } = body;

    if (!rooferKey) {
      return NextResponse.json(
        { error: 'Missing roofer key' },
        { status: 400 }
      );
    }

    // Get roofer by API key
    const supabase = createServerClient();
    const { data: roofer, error } = await supabase
      .from('roofers')
      .select('id, company_name, logo_url, primary_color, cta_headline, cta_button_text, show_pitch, show_cost_estimates, allowed_domains, subscription_status')
      .eq('api_key', rooferKey)
      .single();

    if (error || !roofer) {
      return NextResponse.json(
        { error: 'Invalid roofer key' },
        { status: 401 }
      );
    }

    // Check subscription status
    if (roofer.subscription_status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription inactive' },
        { status: 403 }
      );
    }

    // Validate domain if provided and allowed_domains is configured
    const allowedDomains = roofer.allowed_domains || [];
    if (allowedDomains.length > 0 && domain) {
      const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      const isAllowed = allowedDomains.some((allowed: string) => {
        const normalizedAllowed = allowed.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        return normalizedDomain === normalizedAllowed || normalizedDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not allowed' },
          { status: 403 }
        );
      }
    }

    // Sign embed token
    const token = await signEmbedToken({
      rooferId: roofer.id,
      rooferKey,
      domain: domain || '',
    });

    // Return token and config
    return NextResponse.json({
      token,
      config: {
        companyName: roofer.company_name,
        logoUrl: roofer.logo_url,
        primaryColor: roofer.primary_color,
        ctaHeadline: roofer.cta_headline,
        ctaButtonText: roofer.cta_button_text,
        showPitch: roofer.show_pitch,
        showCostEstimates: roofer.show_cost_estimates,
      },
    }, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Embed init error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
