import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { db, initialSiteSettings } from '@/lib/data/mock-db';
import { SiteSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export function mapSupabaseToSiteSettings(row: any): SiteSettings {
  if (!row) return initialSiteSettings;
  return {
    academy_name: row.academy_name || initialSiteSettings.academy_name,
    tagline: row.tagline || initialSiteSettings.tagline,
    description: row.description || initialSiteSettings.description,
    lead_faculty: row.director_name || row.lead_faculty || initialSiteSettings.lead_faculty,
    phone: row.primary_phone || row.phone || initialSiteSettings.phone,
    whatsapp: row.whatsapp_number || row.whatsapp || initialSiteSettings.whatsapp,
    email: row.primary_email || row.email || initialSiteSettings.email,
    address: row.office_address || row.address || initialSiteSettings.address,
    office_hours: row.office_hours || initialSiteSettings.office_hours,
    announcement_tag: row.announcement_tag || initialSiteSettings.announcement_tag,
    announcement_text: row.announcement_ticker || row.announcement_text || initialSiteSettings.announcement_text,
    announcement_active: row.ticker_active !== undefined ? Boolean(row.ticker_active) : (row.announcement_active !== undefined ? Boolean(row.announcement_active) : true),
    stat_students: row.stats_students || row.stat_students || initialSiteSettings.stat_students,
    stat_experience: row.stats_lectures || row.stat_experience || initialSiteSettings.stat_experience,
    stat_success: row.stats_toppers || row.stat_success || initialSiteSettings.stat_success,
    hero_headline: row.hero_headline || initialSiteSettings.hero_headline,
    hero_subheadline: row.hero_subheadline || initialSiteSettings.hero_subheadline,
    gemini_api_key: row.gemini_api_key || '',
    groq_api_key: row.groq_api_key || '',
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// GET: Fetch live site settings from Supabase Cloud PostgreSQL
export async function GET() {
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (!error && data) {
        const mapped = mapSupabaseToSiteSettings(data);
        db.updateSettings(mapped);
        return NextResponse.json({ success: true, settings: mapped });
      }
    }

    return NextResponse.json({ success: true, settings: db.getSettings() });
  } catch (err: any) {
    return NextResponse.json({ success: true, settings: db.getSettings() });
  }
}
