'use client';

import { useState } from 'react';
import TurnstileWidget from '@/components/TurnstileWidget';

interface EmbedLeadCaptureFormProps {
  reportId: string;
  rooferId: string;
  campaignId: string | null;
  companyName: string;
  primaryColor: string;
  turnstileSiteKey: string | null;
  onSuccess: () => void;
  onBack: () => void;
}

export function EmbedLeadCaptureForm({
  reportId,
  rooferId,
  campaignId,
  companyName,
  primaryColor,
  turnstileSiteKey,
  onSuccess,
  onBack,
}: EmbedLeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentContact, setConsentContact] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consentContact) {
      setError('Please agree to be contacted to unlock your report');
      return;
    }

    // Require Turnstile verification if configured
    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the security verification');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/capture-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          rooferId,
          campaignId,
          name,
          email,
          phone,
          turnstileToken,
          consents: [
            {
              type: 'contact',
              text: `I consent to be contacted by ${companyName} regarding my roof assessment. I understand I may receive calls at the number provided.`,
              given: consentContact,
            },
            {
              type: 'sms',
              text: `I also agree to receive text messages from ${companyName}. Message and data rates may apply. Reply STOP to opt out.`,
              given: consentSms,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-4 text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to preview
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Unlock Your Full Report
        </h2>
        <p className="text-slate-600 text-sm mb-6">
          Enter your contact information to receive your complete roof analysis.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentContact}
                onChange={(e) => setConsentContact(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-xs text-slate-600">
                I consent to be contacted by {companyName} regarding my roof assessment.
                I understand I may receive calls at the number provided.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentSms}
                onChange={(e) => setConsentSms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-xs text-slate-600">
                I also agree to receive text messages from {companyName}.
                Message and data rates may apply. Reply STOP to opt out.
              </span>
            </label>
          </div>

          {/* Turnstile bot protection */}
          {turnstileSiteKey && (
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setError('Security verification failed. Please refresh and try again.')}
            />
          )}

          <button
            type="submit"
            disabled={loading || !consentContact}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              'Get My Full Report'
            )}
          </button>

          <p className="text-xs text-center text-slate-500">
            Your information is secure and will only be shared with {companyName}.
          </p>
        </form>
      </div>
    </div>
  );
}
