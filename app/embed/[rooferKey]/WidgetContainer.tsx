'use client';

import { useState, useEffect, useCallback } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import MapConfirmation from '@/components/MapConfirmation';
import ScanningAnimation from '@/components/ScanningAnimation';
import { EmbedLeadCaptureForm } from './EmbedLeadCaptureForm';
import { EmbedReportFull } from './EmbedReportFull';
import type { LocationData, RoofReport } from '@/types';

interface WidgetConfig {
  rooferId: string;
  rooferKey: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  ctaHeadline: string;
  ctaButtonText: string;
  showPitch: boolean;
  showCostEstimates: boolean;
  schedulingUrl: string | null;
  campaignId: string | null;
  campaignCode: string | null;
  token: string | null;
  turnstileSiteKey: string | null;
}

type Step = 'address' | 'confirm' | 'analyzing' | 'preview' | 'capture' | 'report';

export function WidgetContainer({ config }: { config: WidgetConfig }) {
  const [step, setStep] = useState<Step>('address');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [report, setReport] = useState<RoofReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Post message to parent window
  const postToParent = useCallback((event: string, data: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      // Get the parent origin from referrer or use wildcard for development
      const parentOrigin = document.referrer
        ? new URL(document.referrer).origin
        : '*';

      window.parent.postMessage({
        source: 'roofcheck-widget',
        event,
        ...data,
      }, parentOrigin);
    }
  }, []);

  // Notify parent of height changes
  useEffect(() => {
    const updateHeight = () => {
      postToParent('resize', { height: document.body.scrollHeight });
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [postToParent, step]);

  // Handle address selection
  const handleAddressSelect = (loc: LocationData) => {
    setLocation(loc);
    setStep('confirm');
    postToParent('address_selected', { address: loc.fullAddress });
  };

  // Handle location confirmation
  const handleConfirm = async (lat: number, lng: number) => {
    if (!location) return;

    setStep('analyzing');
    postToParent('analysis_started');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          fullAddress: location.fullAddress,
          addressLine1: location.addressLine1,
          city: location.city,
          state: location.state,
          postalCode: location.postalCode,
          placeId: location.placeId,
          rooferId: config.rooferId,
          campaignId: config.campaignId,
          embedToken: config.token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Fetch the report
      const reportResponse = await fetch(`/api/report/${data.reportId}`);
      const reportData = await reportResponse.json();

      setReport(reportData);
      setStep('preview');
      postToParent('report_generated', { reportId: data.reportId });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze roof');
      setStep('address');
    }
  };

  // Handle lead capture success
  const handleLeadCaptured = () => {
    setStep('report');
    postToParent('contact_captured', { reportId: report?.id });
  };

  // Custom styles based on roofer branding
  const brandStyles = {
    '--brand-color': config.primaryColor,
    '--brand-color-hover': adjustColor(config.primaryColor, -10),
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-white"
      style={brandStyles}
    >
      {/* Header with branding */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.companyName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.companyName.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-slate-900">{config.companyName}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {step === 'address' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">{config.ctaHeadline}</h1>
              <p className="text-slate-600 mt-2">
                Enter your address to get a free satellite roof analysis
              </p>
            </div>
            <AddressAutocomplete
              onSelect={handleAddressSelect}
              placeholder="Enter your address"
            />
          </div>
        )}

        {step === 'confirm' && location && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900">Confirm Your Location</h2>
              <p className="text-slate-600 mt-1 text-sm">
                Drag the marker to adjust if needed
              </p>
            </div>
            <MapConfirmation
              lat={location.lat}
              lng={location.lng}
              address={location.fullAddress}
              onConfirm={handleConfirm}
            />
          </div>
        )}

        {step === 'analyzing' && (
          <ScanningAnimation
            onComplete={() => {}}
            messages={[
              'Locating your property...',
              'Analyzing satellite imagery...',
              'Measuring roof segments...',
              'Calculating estimates...',
            ]}
          />
        )}

        {step === 'preview' && report && (
          <div className="space-y-6">
            {/* Blurred Preview */}
            <div className="relative">
              <div className="blur-sm pointer-events-none">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Roof Analysis Complete</h2>
                  <p className="text-slate-600">{report.fullAddress}</p>
                </div>
                {report.staticMapUrl && (
                  <div className="rounded-lg overflow-hidden mb-4">
                    <img
                      src={report.staticMapUrl}
                      alt="Satellite view"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {report.roofSquaresLow}-{report.roofSquaresHigh}
                    </div>
                    <div className="text-sm text-slate-600">Roof Squares</div>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-slate-900 capitalize">
                      {report.complexity}
                    </div>
                    <div className="text-sm text-slate-600">Complexity</div>
                  </div>
                </div>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-medium mb-4">
                    Enter your contact info to unlock the full report
                  </p>
                  <button
                    onClick={() => setStep('capture')}
                    className="px-6 py-3 rounded-lg text-white font-medium transition-colors"
                    style={{
                      backgroundColor: config.primaryColor,
                    }}
                  >
                    {config.ctaButtonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'capture' && report && (
          <EmbedLeadCaptureForm
            reportId={report.id}
            rooferId={config.rooferId}
            campaignId={config.campaignId}
            companyName={config.companyName}
            primaryColor={config.primaryColor}
            turnstileSiteKey={config.turnstileSiteKey}
            onSuccess={handleLeadCaptured}
            onBack={() => setStep('preview')}
          />
        )}

        {step === 'report' && report && (
          <EmbedReportFull
            report={report}
            companyName={config.companyName}
            schedulingUrl={config.schedulingUrl}
            primaryColor={config.primaryColor}
            showPitch={config.showPitch}
            showCostEstimates={config.showCostEstimates}
          />
        )}
      </main>
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
