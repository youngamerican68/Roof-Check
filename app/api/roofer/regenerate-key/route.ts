import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/auth-server';
import crypto from 'crypto';

export async function POST() {
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

    // Generate new API key
    const newApiKey = `rk_${crypto.randomBytes(24).toString('hex')}`;

    // Update roofer with new key
    const { error } = await supabase
      .from('roofers')
      .update({
        api_key: newApiKey,
        api_key_created_at: new Date().toISOString(),
      })
      .eq('id', roofer.id);

    if (error) {
      console.error('Error regenerating key:', error);
      return NextResponse.json({ error: 'Failed to regenerate key' }, { status: 500 });
    }

    return NextResponse.json({ success: true, apiKey: newApiKey });
  } catch (error) {
    console.error('Key regeneration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
