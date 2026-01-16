import { getCurrentRooferFromAuth } from '@/lib/supabase/auth-server';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CampaignsPage() {
  const roofer = await getCurrentRooferFromAuth();

  if (!roofer) {
    return null;
  }

  const supabase = createServerClient();
  const { data: campaigns } = await supabase
    .from('access_code_campaigns')
    .select('*')
    .eq('roofer_id', roofer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-600 mt-1">
            Create QR codes and tracking links for your marketing materials.
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign: Record<string, unknown>) => (
            <div
              key={campaign.id as string}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{campaign.name as string}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Code: <span className="font-mono">{campaign.code as string}</span>
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {campaign.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Created {new Date(campaign.created_at as string).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  View QR
                </button>
                <button className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No campaigns yet</h3>
            <p className="text-slate-500 mb-4">
              Create a campaign to track leads from door hangers and mailers.
            </p>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
