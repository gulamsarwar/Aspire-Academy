-- ==============================================================================
-- ASPIRE ACADEMY ONLINE — DATABASE INITIALIZATION SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('student', 'admin', 'instructor');
CREATE TYPE enrollment_status_enum AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE order_status_enum AS ENUM ('created', 'paid', 'failed', 'refunded');
CREATE TYPE payment_status_enum AS ENUM ('captured', 'failed', 'refunded');
CREATE TYPE live_class_status_enum AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE priority_enum AS ENUM ('low', 'normal', 'urgent');

-- 3. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Bihar Board',
    target_class TEXT NOT NULL DEFAULT 'Class 12',
    thumbnail_url TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    published BOOLEAN NOT NULL DEFAULT false,
    featured BOOLEAN NOT NULL DEFAULT false,
    language TEXT NOT NULL DEFAULT 'Hinglish',
    duration_weeks INTEGER NOT NULL DEFAULT 24,
    instructor_name TEXT NOT NULL DEFAULT 'Shekhar Sir',
    instructor_title TEXT NOT NULL DEFAULT 'Senior Faculty & Academic Director',
    instructor_avatar TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule_description TEXT NOT NULL DEFAULT '',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 150,
    enrollment_open BOOLEAN NOT NULL DEFAULT true,
    instructor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. MODULES TABLE
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    youtube_video_id TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    material_path TEXT,
    material_name TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status order_status_enum NOT NULL DEFAULT 'created',
    gateway_order_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway_payment_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    method TEXT NOT NULL DEFAULT 'upi',
    status payment_status_enum NOT NULL DEFAULT 'captured',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. ENROLLMENTS TABLE (with uniqueness constraint to prevent duplicate active access)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    status enrollment_status_enum NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    UNIQUE(student_id, course_id, batch_id)
);

-- 12. PAYMENT WEBHOOK EVENTS (Idempotency and audit)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ,
    raw_payload JSONB
);

-- 13. LIVE CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.live_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    youtube_live_url TEXT NOT NULL DEFAULT '',
    youtube_video_id TEXT NOT NULL DEFAULT '',
    instructor_name TEXT NOT NULL DEFAULT 'Shekhar Sir',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status live_class_status_enum NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. LESSON PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, lesson_id)
);

-- 15. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority priority_enum NOT NULL DEFAULT 'normal',
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_resource TEXT NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR 1000+ CONCURRENT STUDENTS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_published_slug ON public.courses(published, slug);
CREATE INDEX IF NOT EXISTS idx_batches_course ON public.batches(course_id, enrollment_open);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_student ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_gateway ON public.orders(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_batch ON public.live_classes(batch_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_progress_student ON public.lesson_progress(student_id, lesson_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_active_enrollment(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = auth.uid() 
      AND course_id = course_uuid 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are readable by owners and admins" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own permitted profile fields" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. USER ROLES POLICIES
CREATE POLICY "Users can view their own roles, admins can view all" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can insert or update user roles" 
ON public.user_roles FOR ALL 
USING (public.is_admin());

-- 3. COURSES POLICIES
CREATE POLICY "Anyone can view published courses, admins can view all" 
ON public.courses FOR SELECT 
USING (published = true OR public.is_admin());

CREATE POLICY "Only admins can modify courses" 
ON public.courses FOR ALL 
USING (public.is_admin());

-- 4. BATCHES POLICIES
CREATE POLICY "Anyone can view open batches of published courses" 
ON public.batches FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage batches" 
ON public.batches FOR ALL 
USING (public.is_admin());

-- 5. MODULES POLICIES
CREATE POLICY "Anyone can view modules for published courses" 
ON public.modules FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = modules.course_id AND (published = true OR public.is_admin())
));

CREATE POLICY "Only admins can manage modules" 
ON public.modules FOR ALL 
USING (public.is_admin());

-- 6. LESSONS POLICIES (Enrolled students or free preview or admin)
CREATE POLICY "Enrolled students, free previews, or admins can view lessons" 
ON public.lessons FOR SELECT 
USING (
    is_free_preview = true 
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        JOIN public.enrollments e ON e.course_id = c.id
        WHERE m.id = lessons.module_id 
          AND e.student_id = auth.uid() 
          AND e.status = 'active'
    )
);

CREATE POLICY "Only admins can manage lessons" 
ON public.lessons FOR ALL 
USING (public.is_admin());

-- 7. ORDERS POLICIES
CREATE POLICY "Students can view their own orders, admins can view all" 
ON public.orders FOR SELECT 
USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Students can create orders for themselves" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Only server or admin can update orders" 
ON public.orders FOR UPDATE 
USING (public.is_admin());

-- 8. PAYMENTS POLICIES
CREATE POLICY "Students can view their own payments" 
ON public.payments FOR SELECT 
USING (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = payments.order_id AND o.student_id = auth.uid()
    )
);

CREATE POLICY "Only server or admin can insert/modify payments" 
ON public.payments FOR ALL 
USING (public.is_admin());

-- 9. ENROLLMENTS POLICIES
CREATE POLICY "Students can view their own enrollments, admins see all" 
ON public.enrollments FOR SELECT 
USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Only verified gateway flow or admin can insert/modify enrollments" 
ON public.enrollments FOR ALL 
USING (public.is_admin());

-- 10. WEBHOOK EVENTS POLICIES
CREATE POLICY "Only server/admin can access webhook events" 
ON public.payment_webhook_events FOR ALL 
USING (public.is_admin());

-- 11. LIVE CLASSES POLICIES
CREATE POLICY "Enrolled students or admins can view live classes" 
ON public.live_classes FOR SELECT 
USING (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = live_classes.course_id 
          AND e.batch_id = live_classes.batch_id
          AND e.student_id = auth.uid()
          AND e.status = 'active'
    )
);

CREATE POLICY "Only admins can manage live classes" 
ON public.live_classes FOR ALL 
USING (public.is_admin());

-- 12. LESSON PROGRESS POLICIES
CREATE POLICY "Students manage their own progress, admins can view" 
ON public.lesson_progress FOR ALL 
USING (auth.uid() = student_id OR public.is_admin());

-- 13. ANNOUNCEMENTS POLICIES
CREATE POLICY "Anyone enrolled or admin can read announcements" 
ON public.announcements FOR SELECT 
USING (
    course_id IS NULL 
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE (e.course_id = announcements.course_id OR announcements.course_id IS NULL)
          AND (e.batch_id = announcements.batch_id OR announcements.batch_id IS NULL)
          AND e.student_id = auth.uid()
          AND e.status = 'active'
    )
);

CREATE POLICY "Only admins can manage announcements" 
ON public.announcements FOR ALL 
USING (public.is_admin());

-- 14. AUDIT LOGS POLICIES
CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Only admins can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (public.is_admin());

-- ==============================================================================
-- TRIGGER FOR AUTOMATIC PROFILE & ROLE CREATION ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
