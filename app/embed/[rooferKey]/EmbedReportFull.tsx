'use client';

import type { RoofReport } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

interface EmbedReportFullProps {
  report: RoofReport;
  companyName: string;
  schedulingUrl: string | null;
  primaryColor: string;
  showPitch: boolean;
  showCostEstimates: boolean;
}

export function EmbedReportFull({
  report,
  companyName,
  schedulingUrl,
  primaryColor,
  showPitch,
  showCostEstimates,
}: EmbedReportFullProps) {
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div
        className="p-4 rounded-lg text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium">Your full report is ready!</p>
        <p className="text-sm opacity-90">{companyName} will contact you soon.</p>
      </div>

      {/* Satellite image */}
      {report.staticMapUrl && (
        <div className="rounded-lg overflow-hidden border border-slate-200">
          <img
            src={report.staticMapUrl}
            alt="Satellite view of your roof"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Address */}
      <div className="bg-slate-50 rounded-lg p-4">
        <p className="text-sm text-slate-500 mb-1">Property Address</p>
        <p className="font-medium text-slate-900">{report.fullAddress}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Roof Area"
          value={`${formatNumber(report.roofAreaSqFtLow || 0)} - ${formatNumber(report.roofAreaSqFtHigh || 0)}`}
          unit="sq ft"
          primaryColor={primaryColor}
        />
        <MetricCard
          label="Roofing Squares"
          value={`${report.roofSquaresLow?.toFixed(1) || '0'} - ${report.roofSquaresHigh?.toFixed(1) || '0'}`}
          unit="squares"
          primaryColor={primaryColor}
        />
        {showPitch && report.pitchDegrees && (
          <MetricCard
            label="Roof Pitch"
            value={report.pitchDegrees.toFixed(0)}
            unit="degrees"
            primaryColor={primaryColor}
          />
        )}
        {report.complexity && (
          <MetricCard
            label="Complexity"
            value={report.complexity.charAt(0).toUpperCase() + report.complexity.slice(1)}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* Cost estimates */}
      {showCostEstimates && (report.costStandardLow || report.costStandardHigh) && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Estimated Cost Range</h3>
          <div className="space-y-2">
            {report.costEconomyLow && report.costEconomyHigh && (
              <CostRow
                label="Economy"
                low={report.costEconomyLow}
                high={report.costEconomyHigh}
              />
            )}
            {report.costStandardLow && report.costStandardHigh && (
              <CostRow
                label="Standard"
                low={report.costStandardLow}
                high={report.costStandardHigh}
                highlight
                primaryColor={primaryColor}
              />
            )}
            {report.costPremiumLow && report.costPremiumHigh && (
              <CostRow
                label="Premium"
                low={report.costPremiumLow}
                high={report.costPremiumHigh}
              />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            * Estimates are approximate and based on average regional pricing.
            Contact {companyName} for an accurate quote.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> This is an estimate based on satellite imagery,
          not a professional inspection. Actual measurements and conditions may vary.
          A licensed contractor should verify all measurements before work begins.
        </p>
      </div>

      {/* CTA */}
      {schedulingUrl && (
        <a
          href={schedulingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 px-4 rounded-lg text-white font-medium text-center transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          Schedule Your Free Inspection
        </a>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  primaryColor,
}: {
  label: string;
  value: string;
  unit?: string;
  primaryColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-semibold" style={{ color: primaryColor }}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function CostRow({
  label,
  low,
  high,
  highlight,
  primaryColor,
}: {
  label: string;
  low: number;
  high: number;
  highlight?: boolean;
  primaryColor?: string;
}) {
  return (
    <div
      className={`flex justify-between items-center p-2 rounded ${
        highlight ? 'bg-slate-100' : ''
      }`}
    >
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`font-medium ${highlight ? 'text-lg' : 'text-slate-900'}`}
        style={highlight && primaryColor ? { color: primaryColor } : undefined}
      >
        {formatCurrency(low)} - {formatCurrency(high)}
      </span>
    </div>
  );
}
