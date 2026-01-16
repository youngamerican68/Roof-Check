import { getCurrentRooferFromAuth } from '@/lib/supabase/auth-server';
import { createServerClient } from '@/lib/supabase/server';

export default async function LeadsPage() {
  const roofer = await getCurrentRooferFromAuth();

  if (!roofer) {
    return null;
  }

  const supabase = createServerClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('*, access_code_campaigns(name)')
    .eq('roofer_id', roofer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600 mt-1">
            View and manage your captured contacts.
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {leads && leads.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.map((lead: Record<string, unknown>) => (
                <tr key={lead.id as string} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {new Date(lead.created_at as string).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">[Encrypted]</div>
                    <div className="text-sm text-slate-500">[View to decrypt]</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {(lead.access_code_campaigns as Record<string, string>)?.name || 'Direct'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lead.pipeline_status === 'new' ? 'bg-blue-100 text-blue-700' :
                      lead.pipeline_status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                      lead.pipeline_status === 'quoted' ? 'bg-purple-100 text-purple-700' :
                      lead.pipeline_status === 'booked' ? 'bg-indigo-100 text-indigo-700' :
                      lead.pipeline_status === 'won' ? 'bg-green-100 text-green-700' :
                      lead.pipeline_status === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {((lead.pipeline_status as string) || 'new').charAt(0).toUpperCase() + ((lead.pipeline_status as string) || 'new').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No leads yet</h3>
            <p className="text-slate-500">
              Install the widget on your website to start capturing leads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
