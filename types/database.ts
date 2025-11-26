// Supabase Database Types
// These types should match your Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      access_code_campaigns: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      roof_reports: {
        Row: {
          id: string;
          access_code_id: string | null;
          address_line1: string;
          city: string;
          state: string;
          postal_code: string;
          full_address: string;
          lat: number;
          lng: number;
          estimation_source: 'solar_api' | 'heuristic' | 'fallback';
          roof_area_sqft_low: number | null;
          roof_area_sqft_high: number | null;
          roof_squares_low: number | null;
          roof_squares_high: number | null;
          complexity: 'simple' | 'moderate' | 'complex' | null;
          pitch_degrees: number | null;
          azimuth_primary: string | null;
          sunshine_hours_annual: number | null;
          cost_economy_low: number | null;
          cost_economy_high: number | null;
          cost_standard_low: number | null;
          cost_standard_high: number | null;
          cost_premium_low: number | null;
          cost_premium_high: number | null;
          approx_home_sqft: number | null;
          roof_age_years: number | null;
          static_map_url: string | null;
          solar_raw_json: Json | null;
          lead_captured: boolean;
          lead_name: string | null;
          lead_email: string | null;
          lead_phone: string | null;
          lead_captured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          access_code_id?: string | null;
          address_line1: string;
          city: string;
          state: string;
          postal_code: string;
          full_address: string;
          lat: number;
          lng: number;
          estimation_source: 'solar_api' | 'heuristic' | 'fallback';
          roof_area_sqft_low?: number | null;
          roof_area_sqft_high?: number | null;
          roof_squares_low?: number | null;
          roof_squares_high?: number | null;
          complexity?: 'simple' | 'moderate' | 'complex' | null;
          pitch_degrees?: number | null;
          azimuth_primary?: string | null;
          sunshine_hours_annual?: number | null;
          cost_economy_low?: number | null;
          cost_economy_high?: number | null;
          cost_standard_low?: number | null;
          cost_standard_high?: number | null;
          cost_premium_low?: number | null;
          cost_premium_high?: number | null;
          approx_home_sqft?: number | null;
          roof_age_years?: number | null;
          static_map_url?: string | null;
          solar_raw_json?: Json | null;
          lead_captured?: boolean;
          lead_name?: string | null;
          lead_email?: string | null;
          lead_phone?: string | null;
          lead_captured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          access_code_id?: string | null;
          address_line1?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          full_address?: string;
          lat?: number;
          lng?: number;
          estimation_source?: 'solar_api' | 'heuristic' | 'fallback';
          roof_area_sqft_low?: number | null;
          roof_area_sqft_high?: number | null;
          roof_squares_low?: number | null;
          roof_squares_high?: number | null;
          complexity?: 'simple' | 'moderate' | 'complex' | null;
          pitch_degrees?: number | null;
          azimuth_primary?: string | null;
          sunshine_hours_annual?: number | null;
          cost_economy_low?: number | null;
          cost_economy_high?: number | null;
          cost_standard_low?: number | null;
          cost_standard_high?: number | null;
          cost_premium_low?: number | null;
          cost_premium_high?: number | null;
          approx_home_sqft?: number | null;
          roof_age_years?: number | null;
          static_map_url?: string | null;
          solar_raw_json?: Json | null;
          lead_captured?: boolean;
          lead_name?: string | null;
          lead_email?: string | null;
          lead_phone?: string | null;
          lead_captured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
