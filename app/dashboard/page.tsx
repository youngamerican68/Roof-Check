import { getCurrentRooferFromAuth } from '@/lib/supabase/auth-server';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

async function getDashboardStats(rooferId: string) {
  const supabase = createServerClient();

  // Get current billing period (default to current month if no subscription)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Get counts in parallel
  const [reportsResult, leadsResult, usageResult, recentLeadsResult] = await Promise.all([
    supabase
      .from('roof_reports')
      .select('id', { count: 'exact', head: true })
      .eq('roofer_id', rooferId),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('roofer_id', rooferId),
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('roofer_id', rooferId)
      .eq('event_type', 'report')
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString()),
    supabase
      .from('leads')
      .select('*')
      .eq('roofer_id', rooferId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    totalReports: reportsResult.count || 0,
    totalLeads: leadsResult.count || 0,
    quotaUsed: usageResult.count || 0,
    recentLeads: recentLeadsResult.data || [],
  };
}

export default async function DashboardPage() {
  const roofer = await getCurrentRooferFromAuth();

  if (!roofer) {
    return null;
  }

  const stats = await getDashboardStats(roofer.id);
  const quotaLimit = roofer.monthly_report_quota || 50;
  const quotaPercent = Math.min((stats.quotaUsed / quotaLimit) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {roofer.company_name}
        </h1>
        <p className="text-slate-600 mt-1">
          Here&apos;s an overview of your RoofCheck activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Conversion Rate"
          value={stats.totalReports > 0 ? `${Math.round((stats.totalLeads / stats.totalReports) * 100)}%` : '0%'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600">Monthly Quota</p>
                <p className="text-xl font-semibold text-slate-900">
                  {stats.quotaUsed} / {quotaLimit}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  quotaPercent >= 90 ? 'bg-red-500' : quotaPercent >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/settings#embed"
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Get Embed Code</p>
                  <p className="text-sm text-slate-500">Add RoofCheck widget to your website</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/dashboard/campaigns"
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Create Campaign</p>
                  <p className="text-sm text-slate-500">Generate QR codes for door hangers</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/dashboard/leads"
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Export Leads</p>
                  <p className="text-sm text-slate-500">Download your leads as CSV</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Leads</h2>
            <Link
              href="/dashboard/leads"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all
            </Link>
          </div>
          {stats.recentLeads.length > 0 ? (
            <div className="space-y-3">
              {stats.recentLeads.map((lead: Record<string, unknown>) => (
                <div
                  key={lead.id as string}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{lead.name_encrypted as string ? '[Encrypted]' : 'No name'}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(lead.created_at as string).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.pipeline_status === 'new' ? 'bg-blue-100 text-blue-700' :
                    lead.pipeline_status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                    lead.pipeline_status === 'won' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {(lead.pipeline_status as string || 'new').charAt(0).toUpperCase() + (lead.pipeline_status as string || 'new').slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>No leads yet</p>
              <p className="text-sm mt-1">Install the widget to start capturing leads</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
