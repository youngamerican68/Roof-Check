import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { authUserId, email, companyName } = await request.json();

    if (!authUserId || !email || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if roofer already exists
    const { data: existing } = await supabase
      .from('roofers')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, rooferId: existing.id });
    }

    // Create roofer record
    const { data: roofer, error } = await supabase
      .from('roofers')
      .insert({
        auth_user_id: authUserId,
        email,
        company_name: companyName,
        notification_email: email,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating roofer:', error);
      return NextResponse.json(
        { error: 'Failed to create roofer profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rooferId: roofer.id });
  } catch (error) {
    console.error('Create roofer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
