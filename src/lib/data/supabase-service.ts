import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from './mock-db';
import { Course, Batch, Lesson, Module, SiteSettings, Enrollment, Order } from '@/lib/types';

/**
 * Supabase Data Service
 * Provides resilient, hybrid access to Supabase PostgreSQL with automatic
 * graceful fallback to the in-memory database when offline or before keys are set.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    url.startsWith('https://') &&
    key.length > 20
  );
}

export function isServiceRoleConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(serviceKey && serviceKey.length > 20 && !serviceKey.includes('Your'));
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  status: 'connected' | 'not_configured' | 'error';
  url: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  message: string;
  tablesVerified: string[];
  latencyMs?: number;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = isServiceRoleConfigured();

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      status: 'not_configured',
      url: url || 'Not specified in .env.local',
      hasAnonKey,
      hasServiceRoleKey,
      message: 'Supabase credentials not configured yet in .env.local. The platform is running smoothly on local database mode.',
      tablesVerified: [],
    };
  }

  const startTime = Date.now();
  const client = createClient();
  if (!client) {
    return {
      success: false,
      status: 'error',
      url,
      hasAnonKey,
      hasServiceRoleKey,
      message: 'Failed to initialize Supabase client instance.',
      tablesVerified: [],
    };
  }

  try {
    // Attempt ping on public courses table
    const { data, error } = await client
      .from('courses')
      .select('id, title')
      .limit(3);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        status: 'error',
        url,
        hasAnonKey,
        hasServiceRoleKey,
        message: `Supabase responded with error: ${error.message} (Code: ${error.code})`,
        tablesVerified: [],
        latencyMs,
      };
    }

    const tablesVerified = ['courses'];

    // Verify site_settings table if possible
    try {
      const settingsRes = await client.from('site_settings').select('id').limit(1);
      if (!settingsRes.error) {
        tablesVerified.push('site_settings');
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      status: 'connected',
      url,
      hasAnonKey,
      hasServiceRoleKey,
      message: `Successfully connected to Supabase PostgreSQL! (${tablesVerified.length} tables verified, ${data?.length || 0} sample rows checked).`,
      tablesVerified,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      url,
      hasAnonKey,
      hasServiceRoleKey,
      message: `Network or connection failure: ${err?.message || 'Unknown error'}`,
      tablesVerified: [],
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Course Operations
 */
export async function getCourses(): Promise<Course[]> {
  if (isSupabaseConfigured()) {
    const client = createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Course[];
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.courses;
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  if (isSupabaseConfigured()) {
    const client = createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('courses')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          return data as Course;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getCourseBySlug(slug);
}

/**
 * Site Settings Operations
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured()) {
    const client = createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('site_settings')
          .select('*')
          .eq('id', 'global')
          .single();

        if (!error && data) {
          return data as SiteSettings;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getSettings();
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  // Always update in-memory DB first for instant zero-latency UI reaction
  const localUpdated = db.updateSettings(settings);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin
          .from('site_settings')
          .upsert({ id: 'global', ...settings, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Could not sync settings to Supabase:', err);
      }
    }
  }

  return localUpdated;
}

/**
 * Lesson Operations
 */
export async function addLessonToDatabase(lessonData: Omit<Lesson, 'id' | 'created_at'>): Promise<Lesson> {
  // Add to local database
  const created = db.addLesson(lessonData);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('lessons').insert({
          id: created.id,
          module_id: created.module_id,
          title: created.title,
          description: created.description,
          youtube_video_id: created.youtube_video_id,
          duration_minutes: created.duration_minutes,
          material_path: created.material_path,
          material_name: created.material_name,
          sort_order: created.sort_order,
          is_free_preview: created.is_free_preview,
          published: created.published,
          created_at: created.created_at,
        });
      } catch (err) {
        console.warn('Could not persist lesson to Supabase:', err);
      }
    }
  }

  return created;
}
