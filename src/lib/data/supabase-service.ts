import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONFIG } from '@/lib/config';
import { db, normalizeStudentId } from './mock-db';
import {
  Course,
  Batch,
  Module,
  Lesson,
  SiteSettings,
  Order,
  Enrollment,
  Payment,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Bookmark,
  StudentDoubt,
  DownloadedMaterial,
} from '@/lib/types';

/**
 * Supabase Data Service
 * Provides resilient, hybrid access to Supabase PostgreSQL with automatic
 * graceful fallback to the in-memory database when offline or before keys are set.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || CONFIG.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CONFIG.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    url.startsWith('https://') &&
    key.length > 15
  );
}

export function isServiceRoleConfigured(): boolean {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    CONFIG.SUPABASE_SERVICE_ROLE_KEY;
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || CONFIG.SUPABASE_URL || '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    CONFIG.SUPABASE_ANON_KEY ||
    '';
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
    const client = createAdminClient() || createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          db.courses = data as Course[];
          return data as Course[];
        }
      } catch {
        // Fallback to local
      }
    }
  }

  // If in browser and direct Supabase query returned nothing or failed, try server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        const json = await res.json();
        if (json.courses && Array.isArray(json.courses) && json.courses.length > 0) {
          db.courses = json.courses as Course[];
          return json.courses as Course[];
        }
      }
    } catch {
      // ignore
    }
  }

  return db.courses;
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  if (isSupabaseConfigured()) {
    const client = createAdminClient() || createClient();
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
        const coursePayload: Record<string, any> = {
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
        };

        const { error } = await admin.from('courses').insert(coursePayload);
        if (error) {
          console.warn('Could not persist course to Supabase:', error.message);
        } else {
          // Keep in-memory cache in sync
          if (!db.courses.some((c) => c.id === created.id)) {
            db.courses.unshift(created);
          }
        }
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
        const sanitized: Record<string, any> = {};
        const allowedColumns = [
          'title', 'subtitle', 'description', 'category', 'target_class',
          'thumbnail_url', 'thumbnail_r2_key', 'price', 'original_price', 'published', 'featured',
          'instructor_name', 'duration_weeks'
        ];
        for (const col of allowedColumns) {
          if ((updates as any)[col] !== undefined) {
            sanitized[col] = (updates as any)[col];
          }
        }
        sanitized.updated_at = new Date().toISOString();
        await admin.from('courses').update(sanitized).eq('id', id);
      } catch (err) {
        console.warn('Could not update course in Supabase:', err);
      }
    }
  }

  return updated || ({ id, ...updates } as Course);
}

export async function deleteCourseFromDatabase(id: string): Promise<boolean> {
  const localSuccess = db.deleteCourse(id);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('courses').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete course from Supabase:', err);
      }
    }
  }
  return localSuccess;
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
        const insertObj: Record<string, any> = {
          id: created.id,
          module_id: created.module_id,
          title: created.title,
          description: created.description,
          youtube_video_id: created.youtube_video_id || '',
          duration_minutes: created.duration_minutes,
          material_path: created.material_path,
          material_name: created.material_name,
          sort_order: created.sort_order,
          is_free_preview: created.is_free_preview,
          published: created.published,
          quiz_id: created.quiz_id,
          created_at: created.created_at,
        };
        if (created.video_source_type) insertObj.video_source_type = created.video_source_type;
        if (created.r2_object_key) insertObj.r2_object_key = created.r2_object_key;
        if (created.video_url) insertObj.video_url = created.video_url;

        await admin.from('lessons').insert(insertObj);
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

/**
 * Module & Batch Operations
 */
export async function addModuleToDatabase(courseId: string, title: string): Promise<Module> {
  const created = db.addModule(courseId, title);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('modules').insert({
          id: created.id,
          course_id: created.course_id,
          title: created.title,
          sort_order: created.sort_order,
        });
      } catch (err) {
        console.warn('Could not persist module to Supabase:', err);
      }
    }
  }
  return created;
}

export async function addBatchToDatabase(
  batchData: Omit<Batch, 'id' | 'enrolled_count' | 'created_at'>
): Promise<Batch> {
  const created = db.addBatch(batchData);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('batches').insert({
          id: created.id,
          course_id: created.course_id,
          name: created.name,
          schedule_description: created.schedule_description,
          start_at: created.start_at,
          end_at: created.end_at,
          capacity: created.capacity,
          enrollment_open: created.enrollment_open,
          instructor_name: created.instructor_name,
        });
      } catch (err) {
        console.warn('Could not persist batch to Supabase:', err);
      }
    }
  }
  return created;
}

export async function getAllBatchesFromDatabase(): Promise<Batch[]> {
  if (isSupabaseConfigured()) {
    const client = createAdminClient() || createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('batches')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          db.batches = data as Batch[];
          return data as Batch[];
        }
      } catch {
        // Fallback to local
      }
    }
  }

  // If in browser, try server batches API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const json = await res.json();
        if (json.batches && Array.isArray(json.batches) && json.batches.length > 0) {
          db.batches = json.batches as Batch[];
          return json.batches as Batch[];
        }
      }
    } catch {
      // ignore
    }
  }

  return db.batches;
}

export async function getBatchesForCourseFromDatabase(courseId: string): Promise<Batch[]> {
  const localBatches = db.getBatchesForCourse(courseId);
  if (isSupabaseConfigured()) {
    const client = createAdminClient() || createClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('batches')
          .select('*')
          .eq('course_id', courseId)
          .order('start_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Batch[];
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return localBatches;
}

export async function getCurriculumForCourseFromDatabase(
  courseId: string
): Promise<(Module & { lessons: Lesson[] })[]> {
  const localCurriculum = db.getCurriculumForCourse(courseId);
  if (isSupabaseConfigured()) {
    const client = createAdminClient() || createClient();
    if (client) {
      try {
        const { data: modules, error: modErr } = await client
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true });

        if (!modErr && modules && modules.length > 0) {
          const moduleIds = modules.map((m) => m.id);
          const { data: lessons, error: lessErr } = await client
            .from('lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('sort_order', { ascending: true });

          const lessonList = !lessErr && lessons ? (lessons as Lesson[]) : [];

          return modules.map((mod) => ({
            ...mod,
            lessons: lessonList.filter((l) => l.module_id === mod.id),
          })) as (Module & { lessons: Lesson[] })[];
        }
      } catch (err) {
        console.warn('Could not load curriculum from Supabase:', err);
      }
    }
  }
  return localCurriculum;
}


/**
 * Orders & Payment Operations
 */
export async function createOrderInDatabase(orderData: {
  studentId: string;
  courseId: string;
  batchId: string;
  amount: number;
  currency: string;
  gatewayOrderId: string;
}): Promise<Order> {
  const order = db.createOrder(orderData);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        // Ensure student profile exists in Supabase profiles table to prevent foreign key constraint violations
        await admin.from('profiles').upsert(
          {
            id: order.student_id,
            email: `student_${order.student_id.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        await admin.from('orders').insert({
          id: order.id,
          student_id: order.student_id,
          course_id: order.course_id,
          batch_id: order.batch_id,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          gateway_order_id: order.gateway_order_id,
          created_at: order.created_at,
        });
      } catch (err) {
        console.warn('Could not persist order to Supabase:', err);
      }
    }
  }

  return order;
}

export async function verifyAndActivateEnrollmentInDatabase({
  gatewayOrderId,
  gatewayPaymentId,
  method = 'upi',
}: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  method?: string;
}): Promise<{ success: boolean; enrollment?: Enrollment; order?: Order }> {
  // Always update in-memory DB first for instant zero-latency UI reaction
  const localResult = db.verifyAndActivateEnrollment({
    gatewayOrderId,
    gatewayPaymentId,
    method,
  });

  if (!localResult.success || !localResult.enrollment) {
    return localResult;
  }

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        // Ensure profile exists before inserting orders/enrollments
        await admin.from('profiles').upsert(
          {
            id: localResult.enrollment.student_id,
            email: `student_${localResult.enrollment.student_id.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        if (localResult.order) {
          await admin
            .from('orders')
            .update({
              status: 'paid',
              gateway_payment_id: gatewayPaymentId,
            })
            .eq('gateway_order_id', gatewayOrderId);

          await admin.from('payments').insert({
            order_id: localResult.order.id,
            gateway_payment_id: gatewayPaymentId,
            amount: localResult.order.amount,
            currency: localResult.order.currency,
            method,
            status: 'captured',
            verified_at: new Date().toISOString(),
          });
        }

        await admin.from('enrollments').upsert(
          {
            id: localResult.enrollment.id,
            student_id: localResult.enrollment.student_id,
            course_id: localResult.enrollment.course_id,
            batch_id: localResult.enrollment.batch_id,
            order_id: localResult.order?.id,
            status: 'active',
            enrolled_at: localResult.enrollment.enrolled_at,
          },
          { onConflict: 'student_id,course_id,batch_id' }
        );
      } catch (err) {
        console.warn('Could not sync payment/enrollment to Supabase:', err);
      }
    }
  }

  return localResult;
}

export async function directEnrollStudentInDatabase({
  studentId,
  courseId,
  batchId,
}: {
  studentId: string;
  courseId: string;
  batchId: string;
}): Promise<Enrollment> {
  const localEnr = db.directEnrollStudent({ studentId, courseId, batchId });
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: localEnr.student_id,
            email: `student_${localEnr.student_id.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        await admin.from('enrollments').upsert({
          id: localEnr.id,
          student_id: localEnr.student_id,
          course_id: localEnr.course_id,
          batch_id: localEnr.batch_id,
          order_id: localEnr.order_id,
          status: 'active',
          enrolled_at: localEnr.enrolled_at,
        });
      } catch {
        // fallback to local
      }
    }
  }
  return localEnr;
}

async function resolveAllAssociatedStudentIds(studentId: string, adminClient?: any): Promise<string[]> {
  const ids = new Set(db.resolveAssociatedStudentIds(studentId));
  if (adminClient && studentId) {
    try {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('email, phone')
        .eq('id', studentId)
        .maybeSingle();

      if (profile?.email) {
        const { data: sameEmailProfiles } = await adminClient
          .from('profiles')
          .select('id')
          .ilike('email', profile.email.trim());
        sameEmailProfiles?.forEach((p: any) => ids.add(p.id));
      }
      if (profile?.phone) {
        const cleanDigits = profile.phone.replace(/\D/g, '').slice(-10);
        if (cleanDigits.length === 10) {
          const { data: samePhoneProfiles } = await adminClient
            .from('profiles')
            .select('id')
            .ilike('phone', `%${cleanDigits}%`);
          samePhoneProfiles?.forEach((p: any) => ids.add(p.id));
        }
      }
    } catch {
      // ignore
    }
  }
  return Array.from(ids);
}

export async function getStudentEnrollmentsFromDatabase(studentId: string): Promise<Enrollment[]> {
  const localEnrs = db.getStudentEnrollments(studentId);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const associatedIds = await resolveAllAssociatedStudentIds(studentId, admin);
        const { data, error } = await admin
          .from('enrollments')
          .select('*, course:courses(*), batch:batches(*)')
          .in('student_id', associatedIds)
          .eq('status', 'active');

        if (!error && data) {
          const supabaseEnrs = await Promise.all(
            (data as unknown as Enrollment[]).map(async (e) => {
              let course = e.course || db.getCourseById(e.course_id);
              const batch = e.batch || db.getBatchById(e.batch_id);
              if (course && (!course.modules || course.modules.length === 0)) {
                try {
                  const curriculum = await getCurriculumForCourseFromDatabase(course.id);
                  if (curriculum && curriculum.length > 0) {
                    course = { ...course, modules: curriculum };
                  }
                } catch {
                  // ignore
                }
              }
              return {
                ...e,
                course,
                batch,
              };
            })
          );
          const combined = [...supabaseEnrs];
          for (const le of localEnrs) {
            if (!combined.some((e) => e.course_id === le.course_id)) {
              combined.push(le);
            }
          }
          return combined;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return localEnrs;
}

export async function getStudentOrdersFromDatabase(studentId: string): Promise<Order[]> {
  const localOrders = db.getStudentOrders(studentId);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const associatedIds = await resolveAllAssociatedStudentIds(studentId, admin);
        const { data, error } = await admin
          .from('orders')
          .select('*, course:courses(*), batch:batches(*)')
          .in('student_id', associatedIds)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const supabaseOrders = (data as unknown as Order[]).map((o) => {
            const course = o.course || db.getCourseById(o.course_id);
            const batch = o.batch || db.getBatchById(o.batch_id);
            return {
              ...o,
              course,
              batch,
            };
          });
          const combined = [...supabaseOrders];
          for (const lo of localOrders) {
            if (!combined.some((o) => o.id === lo.id || (o.course_id === lo.course_id && o.status === lo.status))) {
              combined.push(lo);
            }
          }
          return combined;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return localOrders;
}

export async function isStudentEnrolledInDatabase(studentId: string, courseId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const associatedIds = await resolveAllAssociatedStudentIds(studentId, admin);
        const { data, error } = await admin
          .from('enrollments')
          .select('id')
          .in('student_id', associatedIds)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .limit(1);

        if (!error && data && data.length > 0) {
          return true;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.isStudentEnrolled(studentId, courseId);
}

/**
 * Quiz & Math MCQ Operations
 */
export async function getQuizzesFromDatabase(courseId?: string): Promise<Quiz[]> {
  return db.getQuizzes(courseId);
}

export async function getQuizByIdFromDatabase(
  id: string,
  sanitizeForStudent: boolean = false
): Promise<(Quiz & { questions: QuizQuestion[] }) | null> {
  return db.getQuizById(id, sanitizeForStudent);
}

export async function saveQuizToDatabase(
  quizData: Omit<Quiz, 'id' | 'created_at' | 'questions_count'>,
  questions: Omit<QuizQuestion, 'id' | 'quiz_id'>[]
): Promise<Quiz> {
  return db.addQuiz(quizData, questions);
}

export async function updateQuizInDatabase(
  id: string,
  updates: Partial<Quiz>
): Promise<Quiz | null> {
  return db.updateQuiz(id, updates);
}

export async function deleteQuizInDatabase(id: string): Promise<boolean> {
  return db.deleteQuiz(id);
}

export async function submitQuizAttemptInDatabase(data: {
  studentId: string;
  quizId: string;
  answers: Record<string, string>;
  timeTakenSeconds?: number;
}): Promise<QuizAttempt> {
  const normStudentId = normalizeStudentId(data.studentId);
  const attempt = db.submitQuizAttempt({
    ...data,
    studentId: normStudentId,
  });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        const validQuizId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.quizId)
          ? data.quizId
          : normalizeStudentId(data.quizId);

        await admin.from('quiz_attempts').insert({
          id: attempt.id.startsWith('qa_') ? normalizeStudentId(attempt.id) : attempt.id,
          student_id: normStudentId,
          quiz_id: validQuizId,
          answers: data.answers,
          score: attempt.score,
          total_marks: attempt.total_marks,
          passed: attempt.passed,
          time_taken_seconds: data.timeTakenSeconds || 0,
          attempted_at: attempt.completed_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync quiz attempt to Supabase:', err);
      }
    }
  }

  return attempt;
}

export async function getStudentAttemptsFromDatabase(studentId: string): Promise<QuizAttempt[]> {
  const normStudentId = normalizeStudentId(studentId);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const { data: attempts, error } = await admin
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', normStudentId)
          .order('attempted_at', { ascending: false });

        if (!error && attempts && attempts.length > 0) {
          return attempts.map((a: any) => ({
            id: a.id,
            student_id: a.student_id,
            quiz_id: a.quiz_id,
            answers: a.answers || {},
            score: a.score || 0,
            total_marks: a.total_marks || 10,
            percentage: a.total_marks ? Math.round(((a.score || 0) / a.total_marks) * 100) : 0,
            passed: Boolean(a.passed),
            time_taken_seconds: a.time_taken_seconds || 0,
            started_at: a.attempted_at || new Date().toISOString(),
            completed_at: a.attempted_at || new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getStudentQuizAttempts(normStudentId);
}

/**
 * Doubts Operations
 */
export async function getStudentDoubtsFromDatabase(studentId?: string): Promise<StudentDoubt[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        let query = admin.from('student_doubts').select('*').order('created_at', { ascending: false });
        if (studentId) {
          const normId = normalizeStudentId(studentId);
          query = query.eq('student_id', normId);
        }
        const { data: supaDoubts, error } = await query;
        if (!error && supaDoubts && supaDoubts.length > 0) {
          return supaDoubts.map((d: any) => ({
            id: d.id,
            student_id: d.student_id,
            student_name: 'Student',
            course_id: d.course_id,
            question: d.question_text,
            answer: d.answer_text,
            faculty_name: d.faculty_name,
            status: d.status,
            created_at: d.created_at,
            answered_at: d.answered_at,
          }));
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getDoubts(studentId);
}

export async function saveStudentDoubtToDatabase(
  data: Omit<StudentDoubt, 'id' | 'created_at' | 'status'>
): Promise<StudentDoubt> {
  const normStudentId = normalizeStudentId(data.student_id);
  const localDoubt = db.addDoubt({ ...data, student_id: normStudentId });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: data.student_name || 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        await admin.from('student_doubts').insert({
          student_id: normStudentId,
          course_id: data.course_id,
          question_text: data.question,
          faculty_name: 'Shekhar Sir',
          status: 'open',
          created_at: localDoubt.created_at,
        });
      } catch (err) {
        console.warn('Could not persist doubt to Supabase:', err);
      }
    }
  }

  return localDoubt;
}

export async function answerStudentDoubtInDatabase(
  doubtId: string,
  answer: string,
  facultyName: string = 'Shekhar Sir'
): Promise<StudentDoubt | null> {
  const localAnswered = db.answerDoubt(doubtId, answer, facultyName);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin
          .from('student_doubts')
          .update({
            answer_text: answer,
            faculty_name: facultyName,
            status: 'answered',
            answered_at: new Date().toISOString(),
          })
          .or(`id.eq.${doubtId},question_text.eq.${localAnswered?.question || ''}`);
      } catch (err) {
        console.warn('Could not sync doubt answer to Supabase:', err);
      }
    }
  }

  return localAnswered;
}

/**
 * Lesson Progress Operations
 */
export async function toggleLessonProgressInDatabase(
  studentId: string,
  lessonId: string,
  courseId?: string
): Promise<{ completed: boolean; progress: any }> {
  const normStudentId = normalizeStudentId(studentId);
  const completed = db.toggleLessonProgress(normStudentId, lessonId);
  const progress = courseId ? db.getStudentProgressForCourse(normStudentId, courseId) : null;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        const validLessonId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)
          ? lessonId
          : normalizeStudentId(lessonId);

        await admin.from('lesson_progress').upsert(
          {
            student_id: normStudentId,
            lesson_id: validLessonId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,lesson_id' }
        );
      } catch (err) {
        console.warn('Could not sync lesson progress to Supabase:', err);
      }
    }
  }

  return { completed, progress };
}

/**
 * Bookmark Operations
 */
export async function getStudentBookmarksFromDatabase(studentId: string): Promise<Bookmark[]> {
  const normStudentId = normalizeStudentId(studentId);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const { data: bookmarks, error } = await admin
          .from('student_bookmarks')
          .select('*')
          .eq('student_id', normStudentId);

        if (!error && bookmarks && bookmarks.length > 0) {
          return bookmarks.map((b: any) => ({
            id: b.id,
            student_id: b.student_id,
            resource_type: 'lesson',
            resource_id: b.lesson_id,
            title: b.lesson_title || 'Lesson',
            url: `/dashboard/classes`,
            created_at: b.created_at,
          }));
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getBookmarks(normStudentId);
}

export async function saveStudentBookmarkToDatabase(
  data: Omit<Bookmark, 'id' | 'created_at'>
): Promise<Bookmark> {
  const normStudentId = normalizeStudentId(data.student_id);
  const bookmark = db.addBookmark({ ...data, student_id: normStudentId });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        const validLessonId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.resource_id)
          ? data.resource_id
          : normalizeStudentId(data.resource_id);

        await admin.from('student_bookmarks').insert({
          student_id: normStudentId,
          course_id: 'c0000000-0000-0000-0000-000000000001',
          lesson_id: validLessonId,
          lesson_title: data.title,
        });
      } catch (err) {
        console.warn('Could not sync bookmark to Supabase:', err);
      }
    }
  }

  return bookmark;
}

export async function deleteStudentBookmarkFromDatabase(
  studentId: string,
  resourceId: string
): Promise<boolean> {
  const normStudentId = normalizeStudentId(studentId);
  const removed = db.removeBookmark(normStudentId, resourceId);

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const validLessonId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)
          ? resourceId
          : normalizeStudentId(resourceId);

        await admin
          .from('student_bookmarks')
          .delete()
          .eq('student_id', normStudentId)
          .eq('lesson_id', validLessonId);
      } catch (err) {
        console.warn('Could not sync bookmark deletion to Supabase:', err);
      }
    }
  }

  return removed;
}

/**
 * Downloads Operations
 */
export async function getStudentDownloadsFromDatabase(studentId: string): Promise<DownloadedMaterial[]> {
  const normStudentId = normalizeStudentId(studentId);
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const { data: downloads, error } = await admin
          .from('downloaded_materials')
          .select('*')
          .eq('student_id', normStudentId);

        if (!error && downloads && downloads.length > 0) {
          return downloads.map((dm: any) => ({
            id: dm.id,
            student_id: dm.student_id,
            lesson_id: 'l0000000-0000-0000-0000-000000000001',
            title: dm.material_name,
            file_name: dm.material_name,
            file_size: '3.5 MB',
            downloaded_at: dm.downloaded_at,
          }));
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.getDownloads(normStudentId);
}

export async function recordStudentDownloadInDatabase(
  data: Omit<DownloadedMaterial, 'id' | 'downloaded_at'>
): Promise<DownloadedMaterial> {
  const normStudentId = normalizeStudentId(data.student_id);
  const download = db.recordDownload({ ...data, student_id: normStudentId });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        await admin.from('downloaded_materials').insert({
          student_id: normStudentId,
          material_name: data.file_name,
          material_path: `/notes/${data.file_name}`,
        });
      } catch (err) {
        console.warn('Could not sync download to Supabase:', err);
      }
    }
  }

  return download;
}

/**
 * Admin Audit Logs
 */
export async function recordAuditLogInDatabase({
  adminId,
  action,
  targetUserId,
  targetResource,
  reason,
  metadata = {},
}: {
  adminId?: string;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  reason: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const normAdminId = adminId ? normalizeStudentId(adminId) : '5afc6ea6-cb57-4591-a477-e5e820e5066f'; // Shekhar Sir ID
  const normTargetId = targetUserId ? normalizeStudentId(targetUserId) : null;
  const resource = targetResource || 'academy_general';

  db.auditLogs.unshift({
    id: `al_${Date.now()}`,
    admin_id: normAdminId,
    action,
    target_user_id: normTargetId || '',
    target_resource: resource,
    reason,
    created_at: new Date().toISOString(),
  });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('audit_logs').insert({
          admin_id: normAdminId,
          action,
          target_user_id: normTargetId,
          target_resource: resource,
          reason,
          metadata,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not persist audit log to Supabase:', err);
      }
    }
  }
}

export async function getAuditLogsFromDatabase(limit = 20): Promise<any[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        const { data: logs, error } = await admin
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && logs && logs.length > 0) {
          return logs;
        }
      } catch {
        // Fallback to local
      }
    }
  }
  return db.auditLogs.slice(0, limit);
}

/**
 * Manual Enrollment Override with Audit Trail
 */
export async function manualEnrollmentOverrideInDatabase({
  adminId,
  studentId,
  courseId,
  batchId,
  action,
  reason,
}: {
  adminId: string;
  studentId: string;
  courseId: string;
  batchId: string;
  action: 'grant' | 'revoke';
  reason: string;
}): Promise<boolean> {
  const normStudentId = normalizeStudentId(studentId);
  const result = db.manualEnrollmentOverride({
    adminId,
    studentId: normStudentId,
    courseId,
    batchId,
    action,
    reason,
  });

  if (isSupabaseConfigured()) {
    const admin = createAdminClient() || createClient();
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: normStudentId,
            email: `student_${normStudentId.slice(0, 8)}@aspireacademyonline.in`,
            full_name: 'Aspire Student',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        if (action === 'grant') {
          await admin.from('enrollments').upsert(
            {
              student_id: normStudentId,
              course_id: courseId,
              batch_id: batchId,
              status: 'active',
              enrolled_at: new Date().toISOString(),
            },
            { onConflict: 'student_id,course_id,batch_id' }
          );
        } else {
          await admin
            .from('enrollments')
            .update({ status: 'revoked' })
            .eq('student_id', normStudentId)
            .eq('course_id', courseId)
            .eq('batch_id', batchId);
        }

        await recordAuditLogInDatabase({
          adminId,
          action: action === 'grant' ? 'MANUAL_ACCESS_GRANTED' : 'MANUAL_ACCESS_REVOKED',
          targetUserId: normStudentId,
          targetResource: `course:${courseId},batch:${batchId}`,
          reason,
        });
      } catch (err) {
        console.warn('Could not sync manual override to Supabase:', err);
      }
    }
  }

  return result;
}

