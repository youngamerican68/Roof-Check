import type { CostRange, CardinalDirection } from '@/types';

// Format currency with commas and no decimals
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format a cost range as "$X,XXX – $X,XXX"
export function formatCostRange(range: CostRange): string {
  return `${formatCurrency(range.low)} – ${formatCurrency(range.high)}`;
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

// Format a range of numbers
export function formatNumberRange(low: number, high: number, suffix = ''): string {
  return `${formatNumber(low)} – ${formatNumber(high)}${suffix}`;
}

// Format squares with one decimal place
export function formatSquares(low: number, high: number): string {
  const lowFormatted = low.toFixed(1);
  const highFormatted = high.toFixed(1);
  return `${lowFormatted} – ${highFormatted} squares`;
}

// Format area in square feet
export function formatArea(low: number, high: number): string {
  return `${formatNumber(low)} – ${formatNumber(high)} sq ft`;
}

// Convert azimuth degrees to cardinal direction
export function azimuthToDirection(degrees: number): CardinalDirection {
  if (degrees >= 337.5 || degrees < 22.5) return 'North';
  if (degrees >= 22.5 && degrees < 67.5) return 'Northeast';
  if (degrees >= 67.5 && degrees < 112.5) return 'East';
  if (degrees >= 112.5 && degrees < 157.5) return 'Southeast';
  if (degrees >= 157.5 && degrees < 202.5) return 'South';
  if (degrees >= 202.5 && degrees < 247.5) return 'Southwest';
  if (degrees >= 247.5 && degrees < 292.5) return 'West';
  return 'Northwest';
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (basic US phone validation)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

// Capitalize first letter of each word
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate a short address for display (e.g., "123 Main St, Austin")
export function shortAddress(fullAddress: string): string {
  const parts = fullAddress.split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }
  return fullAddress;
}
