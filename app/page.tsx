'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import type { LocationData } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);

  const handleAddressSelect = useCallback((loc: LocationData) => {
    setLocation(loc);
  }, []);

  const handleCodeBlur = async () => {
    if (!accessCode.trim()) {
      setCodeValidation(null);
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await response.json();

      if (data.valid) {
        setCodeValidation({
          valid: true,
          message: data.campaignName ? `Valid code: ${data.campaignName}` : 'Valid code',
        });
      } else {
        setCodeValidation({
          valid: false,
          message: 'Code not recognized, but you can still continue',
        });
      }
    } catch {
      // Don't block on validation errors
      setCodeValidation(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) return;

    // Build query params for the confirm page
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      address: location.fullAddress,
      addressLine1: location.addressLine1,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
    });

    if (accessCode.trim()) {
      params.set('code', accessCode.trim().toUpperCase());
    }

    router.push(`/confirm?${params.toString()}`);
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Get Your Free Satellite
            <br />
            <span className="text-emerald-600">Roof Report</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-lg mx-auto">
            See your roof size, estimated replacement cost, and what to ask
            contractors — in 60 seconds.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code (Optional) */}
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Access Code{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setCodeValidation(null);
                  }}
                  onBlur={handleCodeBlur}
                  placeholder="e.g., RPT-294-XQ"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg
                           focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                           focus:outline-none transition-all duration-200
                           placeholder:text-slate-400 uppercase tracking-wider"
                />
                {isValidatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {codeValidation && (
                <p
                  className={`text-sm mt-1 ${
                    codeValidation.valid ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {codeValidation.message}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                Don&apos;t have a code? That&apos;s okay — just enter your address below.
              </p>
            </div>

            {/* Address Input */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Your Address
              </label>
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                placeholder="Start typing your address..."
              />
              {location && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Address selected
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!location}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600
                       text-white font-semibold text-lg rounded-xl shadow-lg
                       shadow-emerald-500/25 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:shadow-none flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Analyze My Roof
            </button>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">60 Seconds</p>
            <p className="text-xs text-slate-500">Quick analysis</p>
          </div>

          <div className="p-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-emerald-600"
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
            <p className="text-sm font-medium text-slate-700">100% Free</p>
            <p className="text-xs text-slate-500">No cost, no obligation</p>
          </div>

          <div className="p-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Satellite Data</p>
            <p className="text-xs text-slate-500">Powered by Google</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-slate-100 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Enter Address</h3>
              <p className="text-sm text-slate-600">
                Type your home address and confirm the location on the map
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                We Analyze Your Roof
              </h3>
              <p className="text-sm text-slate-600">
                Our system uses satellite data to measure your roof
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Get Your Report</h3>
              <p className="text-sm text-slate-600">
                See size, cost estimates, and helpful insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
