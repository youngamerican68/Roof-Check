'use client';

import type { CostEstimateDisplayProps } from '@/types';
import { formatCostRange } from '@/lib/utils/formatters';
import { MATERIAL_TIERS } from '@/lib/utils/constants';

export default function CostEstimateDisplay({
  economy,
  standard,
  premium,
  isBlurred = false,
}: CostEstimateDisplayProps) {
  const tiers = [
    { key: 'economy', data: economy, ...MATERIAL_TIERS.economy, recommended: false },
    { key: 'standard', data: standard, ...MATERIAL_TIERS.standard, recommended: true },
    { key: 'premium', data: premium, ...MATERIAL_TIERS.premium, recommended: false },
  ];

  return (
    <div className={`relative ${isBlurred ? 'select-none' : ''}`}>
      {isBlurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-white/50 z-10 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-slate-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-sm text-slate-600 font-medium">
              Unlock to see full details
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`relative rounded-xl p-5 border-2 transition-all
                       ${tier.recommended
                         ? 'border-emerald-500 bg-emerald-50'
                         : 'border-slate-200 bg-white hover:border-slate-300'
                       }`}
          >
            {tier.recommended && (
              <div className="absolute -top-3 left-4">
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Common
                </span>
              </div>
            )}

            <div className="mt-1">
              <h4 className="text-lg font-semibold text-slate-900">{tier.name}</h4>
              <p className="text-sm text-slate-500 mb-3">{tier.material}</p>

              <p className="text-2xl font-bold text-slate-900 mb-2">
                {formatCostRange(tier.data)}
              </p>

              <p className="text-xs text-slate-400">{tier.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-amber-800">
            Estimates based on roof size and 2024/2025 national averages. Actual cost
            depends on existing layers, decking condition, local labor rates, pitch,
            and access. Use as a starting point.
          </p>
        </div>
      </div>
    </div>
  );
}
