'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import MapConfirmation from '@/components/MapConfirmation';

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get location data from URL params
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const address = searchParams.get('address') || '';
  const addressLine1 = searchParams.get('addressLine1') || '';
  const city = searchParams.get('city') || '';
  const state = searchParams.get('state') || '';
  const postalCode = searchParams.get('postalCode') || '';
  const accessCode = searchParams.get('code') || '';

  // Validate we have required data
  if (!lat || !lng || !address) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Missing Location Data
          </h1>
          <p className="text-slate-600 mb-6">
            Please go back and enter your address to continue.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800
                     text-white font-medium px-6 py-3 rounded-lg transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = (confirmedLat: number, confirmedLng: number) => {
    // Build params for analyzing page
    const params = new URLSearchParams({
      lat: confirmedLat.toString(),
      lng: confirmedLng.toString(),
      address,
      addressLine1,
      city,
      state,
      postalCode,
    });

    if (accessCode) {
      params.set('code', accessCode);
    }

    router.push(`/analyzing?${params.toString()}`);
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Confirm Your Location
          </h1>
          <p className="text-slate-600">
            Make sure we&apos;ve got the right spot before we analyze your roof.
          </p>
        </div>

        {/* Map */}
        <MapConfirmation
          lat={lat}
          lng={lng}
          address={address}
          onConfirm={handleConfirm}
        />

        {/* Back button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium
                     flex items-center gap-1 mx-auto transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Go back and change address
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 mt-4">Loading...</p>
          </div>
        </div>
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
