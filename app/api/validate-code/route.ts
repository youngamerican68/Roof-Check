import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ValidateCodeRequest, ValidateCodeResponse } from '@/types';

// Request validation schema
const validateCodeSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse<ValidateCodeResponse>> {
  try {
    // Parse and validate request body
    const body: ValidateCodeRequest = await request.json();
    const validatedData = validateCodeSchema.parse(body);

    const { code } = validatedData;

    const supabase = getSupabaseServerClient();

    // Look up the access code
    const { data: campaign, error } = await supabase
      .from('access_code_campaigns')
      .select('id, name, is_active')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !campaign) {
      return NextResponse.json({
        valid: false,
      });
    }

    if (!campaign.is_active) {
      return NextResponse.json({
        valid: false,
      });
    }

    return NextResponse.json({
      valid: true,
      campaignName: campaign.name,
    });
  } catch (error) {
    console.error('Validate code API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: false },
      { status: 500 }
    );
  }
}
