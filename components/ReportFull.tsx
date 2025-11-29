'use client';

import { useState } from 'react';
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

interface ReportFullProps {
  report: RoofReport;
}

export default function ReportFull({ report }: ReportFullProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const hasMetrics = report.roofSquaresLow && report.roofSquaresHigh;
  const partnerName = process.env.NEXT_PUBLIC_PARTNER_NAME || 'our roofing partner';

  // Generate insights from metrics
  const insights: RoofInsight[] = hasMetrics ? generateInsights(
    {
      roofAreaSqFtLow: report.roofAreaSqFtLow!,
      roofAreaSqFtHigh: report.roofAreaSqFtHigh!,
      roofSquaresLow: report.roofSquaresLow!,
      roofSquaresHigh: report.roofSquaresHigh!,
      complexity: report.complexity || 'moderate',
      pitchDegrees: report.pitchDegrees,
      azimuthPrimary: report.azimuthPrimary as any,
      sunshineHoursAnnual: report.sunshineHoursAnnual,
      segmentCount: 0, // Not stored in DB, but that's okay
      costEconomy: { low: report.costEconomyLow!, high: report.costEconomyHigh! },
      costStandard: { low: report.costStandardLow!, high: report.costStandardHigh! },
      costPremium: { low: report.costPremiumLow!, high: report.costPremiumHigh! },
      estimationSource: report.estimationSource,
    },
    report.estimationSource === 'solar_api'
  ) : [];

  // Replace placeholder in questions
  const squaresRange = hasMetrics
    ? `${report.roofSquaresLow}–${report.roofSquaresHigh}`
    : 'X–Y';

  const questions = ROOFER_QUESTIONS.map((q) =>
    q.replace('{squares}', squaresRange)
  );

  // Hide confetti after animation
  setTimeout(() => setShowConfetti(false), 3000);

  return (
    <div className="space-y-8">
      {/* Success banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Simple confetti effect */}
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
            <h2 className="text-xl font-bold">Report Unlocked!</h2>
            <p className="text-emerald-100">
              Your full roof analysis is ready. {partnerName} will be in touch soon.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Preliminary Estimate — On-site inspection recommended
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Satellite Roof Analysis
        </h1>
        <p className="text-lg text-slate-600">{report.fullAddress}</p>
      </div>

      {/* Satellite Image */}
      {report.staticMapUrl && (
        <div>
          <SatelliteImage
            src={report.staticMapUrl}
            alt={`Satellite view of ${report.fullAddress}`}
            address={report.addressLine1}
          />
          <p className="text-center text-sm text-slate-500 mt-2">
            Satellite view of your property. Measurements estimated from aerial data.
          </p>
        </div>
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
            Roof Size & Geometry
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
                Contractors price by the &quot;square&quot; (100 sq ft). Knowing your squares helps you compare quotes.
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
          Questions to Ask Your Roofer
        </h2>
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <p className="text-slate-600 mb-4">
            Before signing a contract, ask these questions:
          </p>
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

      {/* CTA */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Ready for an Accurate Quote?
        </h2>
        <p className="text-slate-300 mb-6 max-w-xl mx-auto">
          This satellite estimate is a starting point. For a real assessment of your
          shingles, flashing, and decking, schedule a free on-site inspection.
        </p>

        {!showContactForm ? (
          <button
            onClick={() => setShowContactForm(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
                       text-white font-semibold px-8 py-4 rounded-xl shadow-lg
                       shadow-emerald-500/25 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule My Free Inspection
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
      </section>

      {/* Footer Disclaimer */}
      <div className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
        <p>
          This report is a satellite-based preliminary assessment and does not
          constitute a professional inspection, warranty, or binding quote.
          Actual roof condition, pricing, and scope can only be determined
          through on-site evaluation.
        </p>
      </div>
    </div>
  );
}
