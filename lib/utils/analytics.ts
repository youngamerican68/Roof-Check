// Analytics tracking utility for RoofCheck funnel
// Events can be captured by any analytics provider (GA4, Segment, etc.)
// by listening to the custom events dispatched by this module.

export type TrackingEvent =
  | 'address_confirmed'
  | 'lead_form_viewed'
  | 'contractor_opt_in_checked'
  | 'lead_submitted'
  | 'report_unlocked';

export interface TrackingData {
  reportId?: string;
  wantsContractorContact?: boolean;
  [key: string]: unknown;
}

/**
 * Track an analytics event
 * Dispatches a custom event that can be captured by analytics providers
 */
export function trackEvent(event: TrackingEvent, data?: TrackingData): void {
  if (typeof window === 'undefined') return;

  // Dispatch custom event for analytics listeners
  window.dispatchEvent(
    new CustomEvent(`roofcheck:${event}`, {
      detail: {
        event,
        timestamp: new Date().toISOString(),
        ...data,
      },
    })
  );

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RoofCheck Analytics] ${event}`, data);
  }

  // Example: Send to Google Analytics 4 if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag('event', event, {
        event_category: 'roofcheck_funnel',
        ...data,
      });
    }
  }
}

/**
 * Track address confirmation
 */
export function trackAddressConfirmed(reportId: string): void {
  trackEvent('address_confirmed', { reportId });
}

/**
 * Track lead form viewed
 */
export function trackLeadFormViewed(reportId: string): void {
  trackEvent('lead_form_viewed', { reportId });
}

/**
 * Track contractor opt-in checkbox checked
 */
export function trackContractorOptInChecked(reportId: string): void {
  trackEvent('contractor_opt_in_checked', { reportId });
}

/**
 * Track lead form submitted
 */
export function trackLeadSubmitted(reportId: string, wantsContractorContact: boolean): void {
  trackEvent('lead_submitted', { reportId, wantsContractorContact });
}

/**
 * Track report unlocked (full report displayed)
 */
export function trackReportUnlocked(reportId: string): void {
  trackEvent('report_unlocked', { reportId });
}

// Export a global listener setup function for analytics providers
export function setupAnalyticsListeners(
  handler: (event: TrackingEvent, data: TrackingData) => void
): () => void {
  const events: TrackingEvent[] = [
    'address_confirmed',
    'lead_form_viewed',
    'contractor_opt_in_checked',
    'lead_submitted',
    'report_unlocked',
  ];

  const listeners = events.map((eventName) => {
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<TrackingData>;
      handler(eventName, customEvent.detail);
    };
    window.addEventListener(`roofcheck:${eventName}`, listener);
    return { eventName, listener };
  });

  // Return cleanup function
  return () => {
    listeners.forEach(({ eventName, listener }) => {
      window.removeEventListener(`roofcheck:${eventName}`, listener);
    });
  };
}
