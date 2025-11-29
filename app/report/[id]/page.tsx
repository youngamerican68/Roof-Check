'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ReportPreview from '@/components/ReportPreview';
import ReportFull from '@/components/ReportFull';
import type { RoofReport } from '@/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<RoofReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!reportId) {
      setError('No report ID provided');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from('roof_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Report not found');
        } else {
          throw fetchError;
        }
        return;
      }

      // Transform database record to RoofReport type
      const transformedReport: RoofReport = {
        id: data.id,
        addressLine1: data.address_line1,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        fullAddress: data.full_address,
        lat: Number(data.lat),
        lng: Number(data.lng),
        estimationSource: data.estimation_source,
        roofAreaSqFtLow: data.roof_area_sqft_low,
        roofAreaSqFtHigh: data.roof_area_sqft_high,
        roofSquaresLow: data.roof_squares_low,
        roofSquaresHigh: data.roof_squares_high,
        complexity: data.complexity,
        pitchDegrees: data.pitch_degrees,
        azimuthPrimary: data.azimuth_primary,
        sunshineHoursAnnual: data.sunshine_hours_annual,
        costEconomyLow: data.cost_economy_low,
        costEconomyHigh: data.cost_economy_high,
        costStandardLow: data.cost_standard_low,
        costStandardHigh: data.cost_standard_high,
        costPremiumLow: data.cost_premium_low,
        costPremiumHigh: data.cost_premium_high,
        staticMapUrl: data.static_map_url,
        solarRawJson: data.solar_raw_json,
        leadCaptured: data.lead_captured,
        leadName: data.lead_name,
        leadEmail: data.lead_email,
        leadPhone: data.lead_phone,
        leadCapturedAt: data.lead_captured_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setReport(transformedReport);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle lead capture success
  const handleLeadCaptured = () => {
    // Refresh the report to show the full version
    fetchReport();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Skeleton loading */}
          <div className="animate-pulse">
            <div className="text-center mb-8">
              <div className="h-6 w-48 bg-slate-200 rounded mx-auto mb-4" />
              <div className="h-10 w-96 bg-slate-200 rounded mx-auto mb-2" />
              <div className="h-5 w-64 bg-slate-200 rounded mx-auto" />
            </div>

            <div className="h-80 bg-slate-200 rounded-xl mb-8" />

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="h-32 bg-slate-200 rounded-xl" />
              <div className="h-32 bg-slate-200 rounded-xl" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>

            <div className="h-40 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {error === 'Report not found' ? 'Report Not Found' : 'Error Loading Report'}
          </h1>
          <p className="text-slate-600 mb-6">
            {error === 'Report not found'
              ? 'This report doesn\'t exist or may have expired.'
              : 'We had trouble loading your report. Please try again.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Get a New Report
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate view based on lead capture status
  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {report.leadCaptured ? (
          <ReportFull report={report} />
        ) : (
          <ReportPreview report={report} onLeadCaptured={handleLeadCaptured} />
        )}
      </div>
    </div>
  );
}
