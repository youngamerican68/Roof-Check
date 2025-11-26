'use client';

import type { RoofReport } from '@/types';
import SatelliteImage from './SatelliteImage';
import CostEstimateDisplay from './CostEstimateDisplay';
import LeadCaptureForm from './LeadCaptureForm';
import {
  formatArea,
  formatSquares,
} from '@/lib/utils/formatters';
import { getComplexityDescription } from '@/lib/services/roofAnalysis';

interface ReportPreviewProps {
  report: RoofReport;
  onLeadCaptured: () => void;
}

export default function ReportPreview({ report, onLeadCaptured }: ReportPreviewProps) {
  const hasMetrics = report.roofSquaresLow && report.roofSquaresHigh;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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
        <SatelliteImage
          src={report.staticMapUrl}
          alt={`Satellite view of ${report.fullAddress}`}
          address={report.addressLine1}
        />
      )}

      {/* Key Metrics Preview */}
      {hasMetrics && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Roof Size */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-500">Estimated Area</span>
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
            <p className="text-xs text-slate-400 mt-1">1 square = 100 sq ft</p>
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
          </div>
        </div>
      )}

      {/* Cost Estimate Teaser */}
      {report.costStandardLow && report.costStandardHigh && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">
                Estimated Replacement Cost
              </p>
              <p className="text-3xl font-bold text-slate-900">
                ${report.costStandardLow.toLocaleString()} – ${report.costStandardHigh.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Based on standard architectural shingles
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Free estimate — no obligation</span>
            </div>
          </div>
        </div>
      )}

      {/* Locked Content Preview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Full Report Includes:
        </h2>

        {/* Blurred cost breakdown */}
        {report.costEconomyLow && report.costEconomyHigh &&
         report.costStandardLow && report.costStandardHigh &&
         report.costPremiumLow && report.costPremiumHigh && (
          <div>
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Detailed Cost Breakdown
            </h3>
            <CostEstimateDisplay
              economy={{ low: report.costEconomyLow, high: report.costEconomyHigh }}
              standard={{ low: report.costStandardLow, high: report.costStandardHigh }}
              premium={{ low: report.costPremiumLow, high: report.costPremiumHigh }}
              isBlurred={true}
            />
          </div>
        )}

        {/* Blurred insights */}
        {report.complexity && (
          <div className="relative">
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Roof Insights
            </h3>
            <div className="space-y-4 blur-sm select-none">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900 mb-1">Roof Complexity</h4>
                <p className="text-slate-600 text-sm">
                  {getComplexityDescription(report.complexity)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900 mb-1">Sun Exposure</h4>
                <p className="text-slate-600 text-sm">
                  Analysis of your roof&apos;s orientation and sun exposure...
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <p className="text-slate-600 font-medium">Unlock to view insights</p>
            </div>
          </div>
        )}

        {/* Blurred questions */}
        <div className="relative">
          <h3 className="text-lg font-medium text-slate-700 mb-3">
            Questions to Ask Your Roofer
          </h3>
          <div className="blur-sm select-none bg-slate-50 rounded-lg p-4">
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>• My roof is approximately X–Y squares. What price per square are you quoting?</li>
              <li>• Does your quote include tear-off of existing layers and disposal?</li>
              <li>• Will you install ice-and-water shield in valleys and along eaves?</li>
            </ul>
          </div>
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <p className="text-slate-600 font-medium">Unlock to view questions</p>
          </div>
        </div>
      </div>

      {/* Lead Capture Form */}
      <div className="mt-8">
        <LeadCaptureForm
          reportId={report.id}
          onSuccess={onLeadCaptured}
        />
      </div>
    </div>
  );
}
