import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { SiteSettings } from '@/lib/types';
import { mapSupabaseToSiteSettings } from '@/app/api/settings/route';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return checkServerAdminAuth(req);
}

// POST: Save and persist site settings to Supabase Cloud PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const nowIso = new Date().toISOString();

    const admin = createAdminClient();
    if (admin) {
      // Map frontend fields to Supabase site_settings columns
      const supabasePayload: Record<string, any> = {
        id: 'global',
        academy_name: body.academy_name?.trim(),
        tagline: body.tagline?.trim(),
        description: body.description?.trim(),
        director_name: body.lead_faculty?.trim() || body.director_name?.trim(),
        primary_phone: body.phone?.trim() || body.primary_phone?.trim(),
        whatsapp_number: body.whatsapp?.trim() || body.whatsapp_number?.trim(),
        primary_email: body.email?.trim() || body.primary_email?.trim(),
        office_address: body.address?.trim() || body.office_address?.trim(),
        announcement_ticker: body.announcement_text?.trim() || body.announcement_ticker?.trim(),
        ticker_active: body.announcement_active !== undefined ? Boolean(body.announcement_active) : (body.ticker_active !== undefined ? Boolean(body.ticker_active) : true),
        stats_students: body.stat_students?.trim() || body.stats_students?.trim(),
        stats_toppers: body.stat_success?.trim() || body.stats_toppers?.trim(),
        stats_lectures: body.stat_experience?.trim() || body.stats_lectures?.trim(),
        hero_headline: body.hero_headline?.trim(),
        hero_subheadline: body.hero_subheadline?.trim(),
        updated_at: nowIso,
      };

      // Clean undefined keys
      for (const k of Object.keys(supabasePayload)) {
        if (supabasePayload[k] === undefined) delete supabasePayload[k];
      }

      // Upsert into Supabase
      const { error: upsertErr } = await admin.from('site_settings').upsert(supabasePayload);
      if (upsertErr) {
        console.warn('Supabase site_settings upsert error:', upsertErr);
      }

      // Record in audit_logs
      try {
        await admin.from('audit_logs').insert({
          admin_id: '5afc6ea6-cb57-4591-a477-e5e820e5066f',
          action: 'SETTINGS_UPDATED',
          target_resource: 'site_settings:global',
          reason: 'Admin updated global academy settings & CMS parameters',
        });
      } catch {}
    }

    // Update in-memory DB
    const updatedSettings = db.updateSettings(body);

    // Invalidate site cache
    try {
      revalidatePath('/');
      revalidatePath('/about');
      revalidatePath('/contact');
      revalidatePath('/courses');
      revalidatePath('/dashboard');
    } catch {}

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save settings.' }, { status: 500 });
  }
}

