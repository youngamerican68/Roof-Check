'use client';

import { useState } from 'react';
import type { LeadCaptureFormProps } from '@/types';
import { isValidEmail, isValidPhone } from '@/lib/utils/formatters';

export default function LeadCaptureForm({
  reportId,
  onSuccess,
  onError,
}: LeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const partnerName = process.env.NEXT_PUBLIC_PARTNER_NAME || 'our roofing partner';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!consent) {
      newErrors.consent = 'You must agree to be contacted';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consentGiven: consent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      if (onError) {
        onError(message);
      }
      setErrors({ form: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      setPhone(digits);
    } else if (digits.length <= 6) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
    } else {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Unlock Your Full Report
        </h3>
        <p className="text-slate-300">
          Get the complete analysis plus a free contractor review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                       placeholder:text-slate-500 focus:outline-none focus:ring-2
                       focus:ring-emerald-500 transition-all
                       ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
            placeholder="John Smith"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                       placeholder:text-slate-500 focus:outline-none focus:ring-2
                       focus:ring-emerald-500 transition-all
                       ${errors.email ? 'border-red-500' : 'border-slate-700'}`}
            placeholder="john@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                       placeholder:text-slate-500 focus:outline-none focus:ring-2
                       focus:ring-emerald-500 transition-all
                       ${errors.phone ? 'border-red-500' : 'border-slate-700'}`}
            placeholder="(555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Consent checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800
                       text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
            disabled={isSubmitting}
          />
          <label htmlFor="consent" className="text-sm text-slate-300">
            I agree to be contacted by {partnerName} regarding my roof.
          </label>
        </div>
        {errors.consent && (
          <p className="text-red-400 text-sm">{errors.consent}</p>
        )}

        {/* Form error */}
        {errors.form && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{errors.form}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600
                     text-white font-semibold rounded-lg shadow-lg
                     shadow-emerald-500/25 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Send My Full Report
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Your information is secure and will only be used to provide your report.
        </p>
      </form>
    </div>
  );
}
