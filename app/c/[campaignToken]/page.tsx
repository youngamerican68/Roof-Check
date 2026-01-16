import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { signCampaignToken } from '@/lib/services/embedToken';

interface PageProps {
  params: { campaignToken: string };
}

export default async function CampaignLandingPage({ params }: PageProps) {
  const { campaignToken } = params;

  // Get campaign by token
  const supabase = createServerClient();
  const { data: campaign } = await supabase
    .from('access_code_campaigns')
    .select('id, roofer_id, code, name, is_active, roofers(api_key)')
    .eq('campaign_token', campaignToken)
    .single();

  if (!campaign || !campaign.is_active) {
    notFound();
  }

  // Get roofer API key (join returns single object for many-to-one)
  const rooferData = campaign.roofers as unknown as { api_key: string } | null;
  const rooferKey = rooferData?.api_key;

  if (!rooferKey) {
    notFound();
  }

  // Generate a session token for this campaign visit
  const sessionToken = await signCampaignToken({
    rooferId: campaign.roofer_id,
    campaignId: campaign.id,
    campaignCode: campaign.code,
  });

  // Redirect to the widget with campaign info
  redirect(`/embed/${rooferKey}?campaign=${campaignToken}&token=${sessionToken}`);
}
