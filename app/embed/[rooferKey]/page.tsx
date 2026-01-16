import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WidgetContainer } from './WidgetContainer';

interface PageProps {
  params: { rooferKey: string };
  searchParams: { token?: string; campaign?: string };
}

export default async function EmbedWidgetPage({ params, searchParams }: PageProps) {
  const { rooferKey } = params;
  const { token, campaign } = searchParams;

  // Get roofer by API key
  const supabase = createServerClient();
  const { data: roofer } = await supabase
    .from('roofers')
    .select('id, company_name, logo_url, primary_color, cta_headline, cta_button_text, show_pitch, show_cost_estimates, scheduling_url, subscription_status')
    .eq('api_key', rooferKey)
    .single();

  if (!roofer) {
    notFound();
  }

  // Check subscription
  if (roofer.subscription_status === 'canceled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center text-slate-500">
          <p>This widget is currently unavailable.</p>
        </div>
      </div>
    );
  }

  // Get campaign info if provided
  let campaignData = null;
  if (campaign) {
    const { data } = await supabase
      .from('access_code_campaigns')
      .select('id, name, code')
      .eq('campaign_token', campaign)
      .eq('roofer_id', roofer.id)
      .eq('is_active', true)
      .single();
    campaignData = data;
  }

  const config = {
    rooferId: roofer.id,
    rooferKey,
    companyName: roofer.company_name,
    logoUrl: roofer.logo_url,
    primaryColor: roofer.primary_color,
    ctaHeadline: roofer.cta_headline,
    ctaButtonText: roofer.cta_button_text,
    showPitch: roofer.show_pitch,
    showCostEstimates: roofer.show_cost_estimates,
    schedulingUrl: roofer.scheduling_url,
    campaignId: campaignData?.id || null,
    campaignCode: campaignData?.code || null,
    token: token || null,
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
  };

  return <WidgetContainer config={config} />;
}

// Minimal layout for embed - no header/footer
export const metadata = {
  title: 'Roof Report',
};
