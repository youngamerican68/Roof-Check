'use client';

import { useState, useEffect } from 'react';
import type { RoofReport, RoofInsight } from '@/types';
import SatelliteImage from './SatelliteImage';
import RoofSegmentSummary from './RoofSegmentSummary';
import CostEstimateDisplay from './CostEstimateDisplay';
import ContactForm from './ContactForm';
import {
  formatArea,
  formatSquares,
} from '@/lib/utils/formatters';
import {
  generateInsights,
  getComplexityDescription,
} from '@/lib/services/roofAnalysis';
import { ROOFER_QUESTIONS } from '@/lib/utils/constants';
import { trackReportUnlocked } from '@/lib/utils/analytics';

interface ReportFullProps {
  report: RoofReport;
}

// Feature flag - set to true when contractor scheduling goes live
const SCHEDULING_LIVE = false;

// Check if address is in Bucks County, PA (pilot area)
function isInBucksCounty(report: RoofReport): boolean {
  const state = report.state?.toUpperCase();
  const fullAddress = report.fullAddress?.toLowerCase() || '';

  // Check if PA and address contains "bucks" (for Bucks County)
  // This is a simple heuristic - in production you'd use proper geocoding
  if (state === 'PA' && fullAddress.includes('bucks')) {
    return true;
  }

  // Also check common Bucks County cities/towns
  const bucksCountyTowns = [
    'doylestown', 'newtown', 'yardley', 'morrisville', 'langhorne',
    'levittown', 'bensalem', 'bristol', 'quakertown', 'perkasie',
    'sellersville', 'chalfont', 'warrington', 'warminster', 'ivyland',
    'new hope', 'lambertville', 'richboro', 'southampton', 'feasterville'
  ];

  if (state === 'PA') {
    return bucksCountyTowns.some(town => fullAddress.includes(town));
  }

  return false;
}

// Confidence messaging
function getConfidenceInfo(score: string | null): {
  label: string;
  color: string;
  bgColor: string;
  detail?: string;
} {
  switch (score) {
    case 'high':
      return {
        label: 'Data Confidence: Good',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      };
    case 'medium':
      return {
        label: 'Data Confidence: Moderate',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        detail: 'Some roof edges were partially obscured in aerial imagery. Measurements may vary slightly from actual dimensions.',
      };
    case 'low':
    default:
      return {
        label: 'Data Confidence: Limited',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        detail: 'We couldn\'t extract full roof edges from current aerial imagery at this address. Your roof area range is estimated using your home footprint and typical roof-to-home ratios for similar properties. For exact measurements, a roofer\'s on-site measurement is recommended.',
      };
  }
}

export default function ReportFull({ report }: ReportFullProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const hasMetrics = report.roofSquaresLow && report.roofSquaresHigh;
  const confidenceInfo = getConfidenceInfo(report.confidenceScore);
  const inBucks = isInBucksCounty(report);
  const schedulingLive = SCHEDULING_LIVE;

  // Generate insights from metrics (filter out "Data Availability" since it's shown in confidence block)
  const allInsights: RoofInsight[] = hasMetrics ? generateInsights(
    {
      roofAreaSqFtLow: report.roofAreaSqFtLow!,
      roofAreaSqFtHigh: report.roofAreaSqFtHigh!,
      roofSquaresLow: report.roofSquaresLow!,
      roofSquaresHigh: report.roofSquaresHigh!,
      complexity: report.complexity || 'moderate',
      pitchDegrees: report.pitchDegrees,
      azimuthPrimary: report.azimuthPrimary as any,
      sunshineHoursAnnual: report.sunshineHoursAnnual,
      segmentCount: 0,
      costEconomy: { low: report.costEconomyLow!, high: report.costEconomyHigh! },
      costStandard: { low: report.costStandardLow!, high: report.costStandardHigh! },
      costPremium: { low: report.costPremiumLow!, high: report.costPremiumHigh! },
      estimationSource: report.estimationSource,
    },
    report.estimationSource === 'solar_api'
  ) : [];

  // Filter out Data Availability insight - we show that in the dedicated confidence block
  const insights = allInsights.filter(insight => insight.title !== 'Data Availability');

  // Replace placeholder in questions
  const squaresRange = hasMetrics
    ? `${report.roofSquaresLow}–${report.roofSquaresHigh}`
    : 'X–Y';

  const questions = ROOFER_QUESTIONS.map((q) =>
    q.replace('{squares}', squaresRange)
  );

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Track report unlocked event
  useEffect(() => {
    trackReportUnlocked(report.id);
  }, [report.id]);

  // CTA content based on location and scheduling status
  const getCTAContent = () => {
    if (inBucks && schedulingLive) {
      // Variant 1: In Bucks County AND scheduling is live
      return {
        title: 'Ready for an On-Site Inspection?',
        description: 'This satellite estimate is a starting point. A professional inspection will assess shingles, flashing, ventilation, and decking condition.',
        buttonText: 'Request a Free On-Site Inspection',
        buttonIcon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        footerText: 'We\'ll follow up within 2 business days to confirm availability.',
      };
    } else if (inBucks && !schedulingLive) {
      // Variant 2: In Bucks County BUT scheduling not live yet
      return {
        title: 'Want an On-Site Inspection?',
        description: 'We\'re launching on-site inspections in Bucks County soon. Be the first to know when scheduling opens.',
        buttonText: 'Get Notified When Inspections Launch',
        buttonIcon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        footerText: 'No spam. We\'ll only email when scheduling is available in your area.',
      };
    } else {
      // Variant 3: Outside Bucks County
      return {
        title: 'On-Site Inspections Coming Soon',
        description: 'We\'re launching scheduling in Bucks County, PA first and expanding across Pennsylvania. Join the waitlist and we\'ll email you when scheduling is available in your area.',
        buttonText: 'Join the Waitlist',
        buttonIcon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        footerText: 'No spam—only an email when scheduling is available in your area.',
      };
    }
  };

  const ctaContent = getCTAContent();

  return (
    <div className="space-y-8">
      {/* Success banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#fbbf24', '#f472b6', '#60a5fa', '#a78bfa'][i % 4],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Your Roof Report Is Ready</h2>
            <p className="text-emerald-100">
              A satellite-based estimate to help you plan ahead and compare quotes.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Satellite-based Roof Estimate
        </h1>
        <p className="text-lg text-slate-600">{report.fullAddress}</p>
      </div>

      {/* Data Confidence Block */}
      <div className={`rounded-xl p-4 ${confidenceInfo.bgColor} border ${
        confidenceInfo.color === 'text-emerald-600' ? 'border-emerald-200' : 'border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${confidenceInfo.color}`}>
            {report.confidenceScore === 'high' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className={`font-semibold ${confidenceInfo.color}`}>
              {confidenceInfo.label}
            </p>
            {confidenceInfo.detail && (
              <p className="text-sm text-slate-600 mt-1">
                {confidenceInfo.detail}
              </p>
            )}
            {report.imageryDate && (
              <p className="text-xs text-slate-500 mt-2">
                Imagery date: {report.imageryDate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Satellite Image */}
      {report.staticMapUrl && (
        <SatelliteImage
          src={report.staticMapUrl}
          alt={`Satellite view of ${report.fullAddress}`}
          address={report.addressLine1}
        />
      )}

      {/* Roof Section Breakdown */}
      {report.solarRawJson?.solarPotential?.roofSegmentStats && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Roof Section Breakdown
          </h2>
          <RoofSegmentSummary solarData={report.solarRawJson} />
        </section>
      )}

      {/* Roof Size & Geometry */}
      {hasMetrics && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Roof Size &amp; Geometry
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Roof Area */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-500">Estimated Roof Area</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatArea(report.roofAreaSqFtLow!, report.roofAreaSqFtHigh!)}
              </p>
            </div>

            {/* Squares */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-500">Roof Squares</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatSquares(report.roofSquaresLow!, report.roofSquaresHigh!)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                1 square = 100 sq ft. Roofers price by the square.
              </p>
            </div>

            {/* Complexity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-500">Complexity</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 capitalize">
                {report.complexity}
              </p>
              {report.complexity && (
                <p className="text-xs text-slate-500 mt-1">
                  {getComplexityDescription(report.complexity)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cost Estimates */}
      {report.costEconomyLow && report.costEconomyHigh &&
       report.costStandardLow && report.costStandardHigh &&
       report.costPremiumLow && report.costPremiumHigh && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            What Replacement Might Cost
          </h2>
          <CostEstimateDisplay
            economy={{ low: report.costEconomyLow, high: report.costEconomyHigh }}
            standard={{ low: report.costStandardLow, high: report.costStandardHigh }}
            premium={{ low: report.costPremiumLow, high: report.costPremiumHigh }}
            isBlurred={false}
          />
        </section>
      )}

      {/* Roof Insights */}
      {insights.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Roof Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    insight.type === 'sun' ? 'bg-amber-100' :
                    insight.type === 'complexity' ? 'bg-purple-100' :
                    insight.type === 'pitch' ? 'bg-blue-100' :
                    'bg-slate-100'
                  }`}>
                    {insight.type === 'sun' && (
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {insight.type === 'complexity' && (
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {insight.type === 'pitch' && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    {insight.type === 'general' && (
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-slate-600">
                      {insight.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Questions to Ask */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Next Steps: Compare Quotes
        </h2>
        <p className="text-slate-600 mb-4">
          When speaking with roofers, ask these questions:
        </p>
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <ul className="space-y-3">
            {questions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-slate-700">&quot;{question}&quot;</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA - Conditional based on location and scheduling status */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {ctaContent.title}
        </h2>
        <p className="text-slate-300 mb-6 max-w-xl mx-auto">
          {ctaContent.description}
        </p>

        {!showContactForm ? (
          <button
            onClick={() => setShowContactForm(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
                       text-white font-semibold px-8 py-4 rounded-xl shadow-lg
                       shadow-emerald-500/25 transition-all"
          >
            {ctaContent.buttonIcon}
            {ctaContent.buttonText}
          </button>
        ) : (
          <div className="max-w-md mx-auto">
            <ContactForm
              reportId={report.id}
              defaultName={report.leadName || ''}
              defaultEmail={report.leadEmail || ''}
              defaultPhone={report.leadPhone || ''}
              onSuccess={() => setShowContactForm(false)}
            />
          </div>
        )}
        <p className="text-slate-400 text-sm mt-4">
          {ctaContent.footerText}
        </p>
      </section>

      {/* Footer Disclaimer */}
      <div className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
        <p>
          This report is a satellite-based preliminary estimate. It is not a professional
          inspection, structural assessment, warranty, or binding quote. Roof condition,
          pricing, and scope of work can only be confirmed through on-site evaluation.
          RoofCheck does not perform inspections or roofing work.
        </p>
      </div>
    </div>
  );
}
