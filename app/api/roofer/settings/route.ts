import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/auth-server';

export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get roofer
    const { data: roofer } = await supabase
      .from('roofers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!roofer) {
      return NextResponse.json({ error: 'Roofer not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update roofer settings
    const { error } = await supabase
      .from('roofers')
      .update({
        company_name: body.company_name,
        primary_color: body.primary_color,
        notification_email: body.notification_email,
        notification_emails_additional: body.notification_emails_additional,
        scheduling_url: body.scheduling_url,
        allowed_domains: body.allowed_domains,
        cta_headline: body.cta_headline,
        cta_button_text: body.cta_button_text,
        show_pitch: body.show_pitch,
        show_cost_estimates: body.show_cost_estimates,
        cost_per_square: body.cost_per_square,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roofer.id);

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
