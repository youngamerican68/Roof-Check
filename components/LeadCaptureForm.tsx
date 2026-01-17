'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LeadCaptureFormProps } from '@/types';
import { isValidEmail, isValidPhone } from '@/lib/utils/formatters';
import {
  trackLeadFormViewed,
  trackContractorOptInChecked,
  trackLeadSubmitted,
} from '@/lib/utils/analytics';

// Progress step type
interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

export default function LeadCaptureForm({
  reportId,
  onSuccess,
  onError,
}: LeadCaptureFormProps) {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Waitlist opt-in (replaces contractor opt-in)
  const [wantsInspectionNotify, setWantsInspectionNotify] = useState(false);

  // Marketing consent
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Progress bar state
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 'geometry', label: 'Analyzing geometry', status: 'pending' },
    { id: 'squares', label: 'Estimating squares', status: 'pending' },
    { id: 'costs', label: 'Building cost ranges', status: 'pending' },
  ]);
  const [isReportReady, setIsReportReady] = useState(false);

  // Poll for report progress
  const checkReportProgress = useCallback(async () => {
    if (!reportId || isReportReady) return;

    try {
      const response = await fetch(`/api/start-report?reportId=${reportId}`);
      const data = await response.json();

      if (data.success && data.progress) {
        setProgressSteps((prev) =>
          prev.map((step) => {
            if (step.id === 'geometry' && data.progress.geometry) {
              return { ...step, status: 'complete' };
            }
            if (step.id === 'squares' && data.progress.squares) {
              return { ...step, status: 'complete' };
            }
            if (step.id === 'costs' && data.progress.costs) {
              return { ...step, status: 'complete' };
            }
            return step;
          })
        );

        if (data.isComplete) {
          setIsReportReady(true);
        }
      }
    } catch (err) {
      console.error('Error checking report progress:', err);
    }
  }, [reportId, isReportReady]);

  // Poll for progress on mount
  useEffect(() => {
    // Simulate progress animation for better UX
    const simulateProgress = () => {
      setProgressSteps((prev) => {
        const firstPending = prev.findIndex((s) => s.status === 'pending');
        if (firstPending === -1) return prev;

        return prev.map((step, i) => {
          if (i === firstPending) return { ...step, status: 'active' };
          return step;
        });
      });
    };

    // Start with first step active
    simulateProgress();

    // Check actual progress and animate
    const progressInterval = setInterval(() => {
      checkReportProgress();

      // Simulate completing steps over time
      setProgressSteps((prev) => {
        const activeIndex = prev.findIndex((s) => s.status === 'active');
        if (activeIndex === -1) return prev;

        // Complete active step and activate next
        return prev.map((step, i) => {
          if (i === activeIndex) return { ...step, status: 'complete' };
          if (i === activeIndex + 1 && step.status === 'pending') {
            return { ...step, status: 'active' };
          }
          return step;
        });
      });
    }, 1500);

    return () => clearInterval(progressInterval);
  }, [checkReportProgress]);

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

    // Phone is always optional now
    if (phone.trim() && !isValidPhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
          phone: phone.trim() || null,
          consentGiven: true,
          // Waitlist replaces contractor contact
          wantsContractorContact: wantsInspectionNotify,
          leadTimeline: null,
          leadIssueType: null,
          phoneConsent: false,
          marketingConsent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      // Track successful submission
      trackLeadSubmitted(reportId, wantsInspectionNotify);

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
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 3) {
      setPhone(digits);
    } else if (digits.length <= 6) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
    } else {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
    }
  };

  // Track form view
  useEffect(() => {
    trackLeadFormViewed(reportId);
  }, [reportId]);

  // Track waitlist opt-in
  useEffect(() => {
    if (wantsInspectionNotify) {
      trackContractorOptInChecked(reportId);
    }
  }, [wantsInspectionNotify, reportId]);

  const allStepsComplete = progressSteps.every((s) => s.status === 'complete');

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
      {/* Progress Bar */}
      {!allStepsComplete && (
        <div className="mb-6 pb-6 border-b border-slate-700">
          <p className="text-sm font-medium text-slate-400 mb-3">Preparing your report...</p>
          <div className="space-y-2">
            {progressSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {step.status === 'complete' ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'active' ? (
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${
                  step.status === 'complete' ? 'text-emerald-400' :
                  step.status === 'active' ? 'text-white' :
                  'text-slate-500'
                }`}>
                  {step.label}
                  {step.status === 'active' && '...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Step Process (Variant A: Minimalist) */}
      <div className="mb-6 pb-6 border-b border-slate-700">
        <p className="text-sm font-medium text-slate-400 mb-3">What happens next</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              1
            </div>
            <div>
              <p className="text-white text-sm font-medium">Confirm Address</p>
              <p className="text-slate-400 text-xs">We locate your roof from satellite imagery</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              2
            </div>
            <div>
              <p className="text-white text-sm font-medium">Get Your Report</p>
              <p className="text-slate-400 text-xs">Enter your email to receive your measurements and cost ranges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Get your free roof report
        </h3>
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

        {/* Phone field - always optional */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
            Phone <span className="text-slate-500 font-normal">(optional)</span>
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
          <p className="text-slate-500 text-xs mt-1">For future scheduling availability</p>
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-4 space-y-3">
          {/* Waitlist Opt-in (replaces contractor checkbox) */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="wantsInspectionNotify"
              checked={wantsInspectionNotify}
              onChange={(e) => setWantsInspectionNotify(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-slate-800
                         text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              disabled={isSubmitting}
            />
            <label htmlFor="wantsInspectionNotify" className="text-sm text-slate-300">
              Notify me when on-site inspections launch in my area
            </label>
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="marketingConsent"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-slate-800
                         text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              disabled={isSubmitting}
            />
            <label htmlFor="marketingConsent" className="text-sm text-slate-300">
              Send me RoofCheck tips and updates <span className="text-slate-500">(optional)</span>
            </label>
          </div>
        </div>

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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email My Full Report
            </>
          )}
        </button>

        {/* Privacy line */}
        <p className="text-center text-xs text-slate-500">
          We only use your info to deliver your report and features you request.
        </p>
      </form>
    </div>
  );
}
