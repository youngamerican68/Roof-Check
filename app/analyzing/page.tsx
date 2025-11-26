'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import ScanningAnimation from '@/components/ScanningAnimation';

function AnalyzingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isApiReady, setIsApiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  // Get location data from URL params
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const fullAddress = searchParams.get('address') || '';
  const addressLine1 = searchParams.get('addressLine1') || '';
  const city = searchParams.get('city') || '';
  const state = searchParams.get('state') || '';
  const postalCode = searchParams.get('postalCode') || '';
  const accessCode = searchParams.get('code') || '';

  // Call analyze API
  const analyzeRoof = useCallback(async () => {
    if (!lat || !lng || !fullAddress) {
      setError('Missing location data');
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          fullAddress,
          addressLine1,
          city,
          state,
          postalCode,
          accessCode: accessCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setReportId(data.reportId);
      setIsApiReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }, [lat, lng, fullAddress, addressLine1, city, state, postalCode, accessCode]);

  useEffect(() => {
    analyzeRoof();
  }, [analyzeRoof]);

  // Handle animation completion - navigate to report
  const handleAnimationComplete = useCallback(() => {
    if (reportId) {
      router.push(`/report/${reportId}`);
    }
  }, [reportId, router]);

  // Error state
  if (error) {
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
            Analysis Failed
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                analyzeRoof();
              }}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500
                       hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-lg
                       transition-colors"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-2 bg-slate-200
                       hover:bg-slate-300 text-slate-700 font-medium px-6 py-3 rounded-lg
                       transition-colors"
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
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <ScanningAnimation
        isReady={isApiReady}
        onComplete={handleAnimationComplete}
      />
    </div>
  );
}

export default function AnalyzingPage() {
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
      <AnalyzingPageContent />
    </Suspense>
  );
}
