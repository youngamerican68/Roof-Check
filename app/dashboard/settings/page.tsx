import { getCurrentRooferFromAuth } from '@/lib/supabase/auth-server';
import { SettingsForm } from './SettingsForm';
import { EmbedCodeSection } from './EmbedCodeSection';
import { ApiKeySection } from './ApiKeySection';

export default async function SettingsPage() {
  const roofer = await getCurrentRooferFromAuth();

  if (!roofer) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your company branding, widget configuration, and notifications.
        </p>
      </div>

      {/* Embed Code Section */}
      <section id="embed" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Embed Code</h2>
        <EmbedCodeSection apiKey={roofer.api_key} />
      </section>

      {/* Settings Form */}
      <SettingsForm roofer={roofer} />

      {/* API Key Section */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">API Access</h2>
        <ApiKeySection rooferId={roofer.id} apiKey={roofer.api_key} />
      </section>

      {/* Subscription Status */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-900">
              Status:{' '}
              <span className={`font-medium ${
                roofer.subscription_status === 'active' ? 'text-emerald-600' :
                roofer.subscription_status === 'trialing' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {roofer.subscription_status.charAt(0).toUpperCase() + roofer.subscription_status.slice(1)}
              </span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Monthly quota: {roofer.monthly_report_quota} reports
            </p>
          </div>
          {roofer.subscription_status === 'trialing' && (
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Upgrade to Pro
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
