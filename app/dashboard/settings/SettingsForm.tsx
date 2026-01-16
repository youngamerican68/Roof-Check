'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RooferData {
  id: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  notification_email: string;
  notification_emails_additional: string[];
  scheduling_url: string | null;
  allowed_domains: string[];
  cta_headline: string;
  cta_button_text: string;
  show_pitch: boolean;
  show_cost_estimates: boolean;
  cost_per_square: number | null;
}

export function SettingsForm({ roofer }: { roofer: RooferData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    companyName: roofer.company_name,
    primaryColor: roofer.primary_color,
    notificationEmail: roofer.notification_email,
    additionalEmails: roofer.notification_emails_additional.join(', '),
    schedulingUrl: roofer.scheduling_url || '',
    allowedDomains: roofer.allowed_domains.join('\n'),
    ctaHeadline: roofer.cta_headline,
    ctaButtonText: roofer.cta_button_text,
    showPitch: roofer.show_pitch,
    showCostEstimates: roofer.show_cost_estimates,
    costPerSquare: roofer.cost_per_square?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/roofer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          primary_color: formData.primaryColor,
          notification_email: formData.notificationEmail,
          notification_emails_additional: formData.additionalEmails
            .split(',')
            .map(e => e.trim())
            .filter(Boolean),
          scheduling_url: formData.schedulingUrl || null,
          allowed_domains: formData.allowedDomains
            .split('\n')
            .map(d => d.trim())
            .filter(Boolean),
          cta_headline: formData.ctaHeadline,
          cta_button_text: formData.ctaButtonText,
          show_pitch: formData.showPitch,
          show_cost_estimates: formData.showCostEstimates,
          cost_per_square: formData.costPerSquare ? parseFloat(formData.costPerSquare) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      router.refresh();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Company Branding */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Company Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-10 w-14 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                placeholder="#2563eb"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Widget Configuration */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Widget Configuration</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CTA Headline
              </label>
              <input
                type="text"
                value={formData.ctaHeadline}
                onChange={(e) => setFormData({ ...formData, ctaHeadline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Get Your Free Roof Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={formData.ctaButtonText}
                onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Unlock Full Report"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Allowed Domains
            </label>
            <p className="text-sm text-slate-500 mb-2">
              Enter one domain per line. The widget will only work on these domains.
            </p>
            <textarea
              value={formData.allowedDomains}
              onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              placeholder="example.com&#10;www.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheduling URL (Calendly, etc.)
            </label>
            <input
              type="url"
              value={formData.schedulingUrl}
              onChange={(e) => setFormData({ ...formData, schedulingUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://calendly.com/your-company"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showPitch"
                checked={formData.showPitch}
                onChange={(e) => setFormData({ ...formData, showPitch: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="showPitch" className="text-sm text-slate-700">
                Show roof pitch information in reports
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showCostEstimates"
                checked={formData.showCostEstimates}
                onChange={(e) => setFormData({ ...formData, showCostEstimates: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="showCostEstimates" className="text-sm text-slate-700">
                Show cost estimates in reports
              </label>
            </div>

            {formData.showCostEstimates && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cost per Square ($)
                </label>
                <input
                  type="number"
                  value={formData.costPerSquare}
                  onChange={(e) => setFormData({ ...formData, costPerSquare: e.target.value })}
                  className="w-48 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="550"
                  step="0.01"
                  min="0"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Your average cost per roofing square (100 sq ft)
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Notification Email
            </label>
            <input
              type="email"
              value={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notification Emails
            </label>
            <input
              type="text"
              value={formData.additionalEmails}
              onChange={(e) => setFormData({ ...formData, additionalEmails: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="email1@company.com, email2@company.com"
            />
            <p className="text-sm text-slate-500 mt-1">
              Separate multiple emails with commas
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
