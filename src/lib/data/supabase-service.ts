import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from './mock-db';
import { Course, Lesson, SiteSettings } from '@/lib/types';

/**
 * Supabase Data Service
 * Provides resilient, hybrid access to Supabase PostgreSQL with automatic
 * graceful fallback to the in-memory database when offline or before keys are set.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    url.startsWith('https://') &&
    key.length > 15
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
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const hasAnonKey = Boolean(key && key.length > 15);
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

    // Verify other core tables
    const otherTables = ['batches', 'modules', 'lessons', 'site_settings'];
    await Promise.all(
      otherTables.map(async (tableName) => {
        try {
          const res = await client.from(tableName).select('id').limit(1);
          if (!res.error) {
            tablesVerified.push(tableName);
          }
        } catch {
          // ignore
        }
      })
    );

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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      status: 'error',
      url,
      hasAnonKey,
      hasServiceRoleKey,
      message: `Network or connection failure: ${errorMessage}`,
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

export async function addCourseToDatabase(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  const created = db.addCourse(courseData);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('courses').insert({
          id: created.id,
          slug: created.slug,
          title: created.title,
          subtitle: created.subtitle,
          description: created.description,
          category: created.category,
          target_class: created.target_class,
          thumbnail_url: created.thumbnail_url,
          price: created.price,
          original_price: created.original_price,
          currency: created.currency,
          published: created.published,
          featured: created.featured,
          language: created.language,
          duration_weeks: created.duration_weeks,
          instructor_name: created.instructor_name,
          instructor_title: created.instructor_title,
          instructor_avatar: created.instructor_avatar,
          features: created.features,
          created_at: created.created_at,
          updated_at: created.updated_at,
        });
      } catch (err) {
        console.warn('Could not persist course to Supabase:', err);
      }
    }
  }

  return created;
}

export async function updateCourseInDatabase(id: string, updates: Partial<Course>): Promise<Course | null> {
  const updated = db.updateCourse(id, updates);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('courses').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Could not update course in Supabase:', err);
      }
    }
  }

  return updated;
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

export async function updateLessonInDatabase(id: string, updates: Partial<Lesson>): Promise<Lesson | null> {
  const updated = db.updateLesson(id, updates);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('lessons').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Could not update lesson in Supabase:', err);
      }
    }
  }

  return updated;
}

export async function deleteLessonFromDatabase(id: string): Promise<boolean> {
  const success = db.deleteLesson(id);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('lessons').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete lesson from Supabase:', err);
      }
    }
  }

  return success;
}
