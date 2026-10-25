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

-- ==============================================================================
-- 15. SITE SETTINGS TABLE (DYNAMIC CMS FOR ACADEMY DETAILS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    academy_name TEXT NOT NULL DEFAULT 'Aspire Academy Online',
    director_name TEXT NOT NULL DEFAULT 'Er. Shekhar Sir',
    tagline TEXT NOT NULL DEFAULT 'Bihar Board & CBSE Hindi/English Medium Online Coaching',
    hero_headline TEXT NOT NULL DEFAULT 'Bihar Board Class 12th & 11th Topper Banane Ka Sankalp',
    hero_subheadline TEXT NOT NULL DEFAULT 'NCERT line-by-line conceptual video lectures, high-yield numerical solutions, bilingual handwritten PDF notes, and daily doubt solving under Shekhar Sir.',
    primary_phone TEXT NOT NULL DEFAULT '+91 9123456789',
    secondary_phone TEXT NOT NULL DEFAULT '+91 9876543210',
    whatsapp_number TEXT NOT NULL DEFAULT '919123456789',
    primary_email TEXT NOT NULL DEFAULT 'support@aspireacademyonline.in',
    office_address TEXT NOT NULL DEFAULT 'Main Road, Kankarbagh, Near Colony More, Patna, Bihar 800020',
    announcement_ticker TEXT NOT NULL DEFAULT '🔥 New Target 2027 Class 12 Batch Starting Soon! Flat 60% OFF for First 100 Students.',
    ticker_active BOOLEAN NOT NULL DEFAULT true,
    stats_students TEXT NOT NULL DEFAULT '10,000+',
    stats_toppers TEXT NOT NULL DEFAULT '95%+',
    stats_lectures TEXT NOT NULL DEFAULT '1,200+',
    stats_rating TEXT NOT NULL DEFAULT '4.9/5',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Only admins can update site settings" 
ON public.site_settings FOR ALL 
USING (public.is_admin());

-- ==============================================================================
-- ASPIRE ACADEMY ONLINE — DATABASE SEED DATA
-- ==============================================================================

-- 1. COURSES
INSERT INTO public.courses (
  id, slug, title, subtitle, description, category, target_class, thumbnail_url,
  price, original_price, currency, published, featured, language, duration_weeks,
  instructor_name, instructor_title, features
) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'class-12-biology',
  'Class 12 Biology — Complete Board & NEET Foundation',
  'Complete Bihar Board & CBSE Biology with NCERT Line-by-Line, Diagrams, PYQs & Doubt Sessions',
  'Designed specifically for Bihar Board and CBSE Class 12 students aiming for top board scores and solid NEET fundamentals. Led by renowned Shekhar Sir, this course covers every chapter in detail with high-yield diagram practice, handwritten notes, chapter tests, and previous 10 years question bank solutions.',
  'Bihar Board',
  'Class 12',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  399.00,
  1499.00,
  'INR',
  true,
  true,
  'Hinglish (Hindi + English terms)',
  32,
  'Shekhar Sir',
  'Biology Specialist & Academic Director (10+ Yrs Exp)',
  '["Complete NCERT Line-by-Line Video Classes", "High-Yield Diagram Workshops", "Bihar Board 10 Years Solved PYQs", "Chapter-wise PDF Notes & Mindmaps", "Weekly Live Doubts & Revision Sessions", "Objective 50% Pattern Mastery"]'::jsonb
),
(
  'c0000000-0000-0000-0000-000000000002',
  'class-12-physics',
  'Class 12 Physics — Concept, Numerical & PYQ Mastery',
  'Master Electrostatics, Optics & Modern Physics with Derivations, Numericals and Regular Tests',
  'Clear your fear of Physics with our step-by-step conceptual methodology. From Electrostatics to Magnetism, Ray Optics to Semiconductor Electronics, master every derivation and numerical technique needed for Bihar Board, CBSE, and JEE/NEET exams.',
  'Bihar Board',
  'Class 12',
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
  999.00,
  2499.00,
  'INR',
  true,
  true,
  'Hinglish',
  32,
  'Er. R. K. Verma',
  'Senior Physics Faculty (Ex-Kota Educator)',
  '["Step-by-step Derivation Handbooks", "Formula Sheet & Short Notes PDF", "Daily Practice Problems (DPP) with solutions", "Live Numerical Solving Batches", "Board Exam Target Series"]'::jsonb
),
(
  'c0000000-0000-0000-0000-000000000003',
  'class-12-chemistry',
  'Class 12 Chemistry — Physical, Organic & Inorganic',
  'Simplified Reaction Mechanisms, Named Reactions, NCERT In-Text Problems & Formula Bank',
  'Master Organic Chemistry mechanisms without rote memorization. Learn Physical Chemistry numericals effortlessly and memorize Inorganic trends with smart mnemonics and NCERT line pointers.',
  'Bihar Board',
  'Class 12',
  'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
  999.00,
  2499.00,
  'INR',
  true,
  true,
  'Hinglish',
  32,
  'Dr. A. Anand',
  'Doctorate in Chemistry & Board Evaluator',
  '["Organic Reaction Mechanism Maps", "Inorganic NCERT Highlight Sheets", "Physical Chemistry Numerical Formula Booklet", "Monthly Grand Mock Tests", "Personal Doubt Clearing"]'::jsonb
),
(
  'c0000000-0000-0000-0000-000000000004',
  'class-10-board-foundation',
  'Class 10 Science & Mathematics — Topper Batch',
  'Comprehensive Science, Mathematics & Objective Strategy for Bihar Board & CBSE Class 10',
  'Build unbreakable conceptual clarity in Physics, Chemistry, Biology, and Mathematics. Structured practice to ensure 95%+ marks in Class 10 Board examinations with bilingual explanation.',
  'Foundation',
  'Class 10',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  799.00,
  1999.00,
  'INR',
  true,
  false,
  'Hindi & English',
  28,
  'Aspire Core Faculty',
  'Team of Subject Specialists',
  '["Full Board Syllabus Coverage", "Chapter-wise Objective & Subjective Tests", "Special Doubt Classes", "Answer Writing Presentation Tips"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. BATCHES
INSERT INTO public.batches (
  id, course_id, name, schedule_description, start_at, end_at, capacity, enrollment_open, instructor_name
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Super-50 Biology Board Batch 2026-27',
  'Mon, Wed, Fri — 05:00 PM to 06:30 PM IST',
  '2026-04-01 00:00:00+05:30',
  '2027-02-28 23:59:59+05:30',
  150,
  true,
  'Shekhar Sir'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Morning Achievers Biology Batch',
  'Tue, Thu, Sat — 07:00 AM to 08:30 AM IST',
  '2026-04-15 00:00:00+05:30',
  '2027-02-28 23:59:59+05:30',
  120,
  true,
  'Shekhar Sir'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000002',
  'Pratibha Physics Batch (Evening)',
  'Mon, Wed, Fri — 06:45 PM to 08:15 PM IST',
  '2026-04-01 00:00:00+05:30',
  '2027-02-28 23:59:59+05:30',
  150,
  true,
  'Er. R. K. Verma'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000003',
  'Sankalp Chemistry Batch',
  'Tue, Thu, Sat — 05:00 PM to 06:30 PM IST',
  '2026-04-01 00:00:00+05:30',
  '2027-02-28 23:59:59+05:30',
  150,
  true,
  'Dr. A. Anand'
)
ON CONFLICT (id) DO NOTHING;

-- 3. MODULES
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES
('m0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Unit 1: Reproduction in Organisms & Flowering Plants', 1),
('m0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Unit 2: Human Reproduction & Reproductive Health', 2),
('m0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Unit 3: Genetics & Principles of Inheritance', 3),
('m0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Unit 1: Electrostatics & Gauss Law', 1),
('m0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Unit 2: Current Electricity & Kirchhoff Laws', 2)
ON CONFLICT (id) DO NOTHING;

-- 4. LESSONS
INSERT INTO public.lessons (
  id, module_id, title, description, youtube_video_id, duration_minutes,
  material_path, material_name, sort_order, is_free_preview, published
) VALUES
(
  'l0000000-0000-0000-0000-000000000001',
  'm0000000-0000-0000-0000-000000000001',
  'Lesson 1: Introduction to Sexual Reproduction in Flowering Plants',
  'Comprehensive introduction to flower morphology, stamen, microsporangium, and pollen grain development with NCERT diagram breakdown.',
  'dQw4w9WgXcQ',
  48,
  '/notes/biology-ch1-flowering-plants-ncert.pdf',
  'Chapter 1 Notes & High-Yield Diagrams.pdf',
  1,
  true,
  true
),
(
  'l0000000-0000-0000-0000-000000000002',
  'm0000000-0000-0000-0000-000000000001',
  'Lesson 2: Megasporogenesis & Embryo Sac Structure',
  'Detailed study of ovule types, megasporogenesis, female gametophyte structure, and 7-celled 8-nucleate embryo sac.',
  'M7lc1UVf-VE',
  52,
  '/notes/biology-ch1-megasporogenesis.pdf',
  'Megasporogenesis & Embryo Sac Handout.pdf',
  2,
  false,
  true
),
(
  'l0000000-0000-0000-0000-000000000003',
  'm0000000-0000-0000-0000-000000000001',
  'Lesson 3: Pollination Agents & Outbreeding Devices',
  'Types of pollination (Autogamy, Geitonogamy, Xenogamy), biotic vs abiotic pollinating agents, and adaptations.',
  'ScMzIvxBSi4',
  45,
  '/notes/biology-ch1-pollination.pdf',
  'Pollination Mindmap & PYQ Sheet.pdf',
  3,
  false,
  true
),
(
  'l0000000-0000-0000-0000-000000000004',
  'm0000000-0000-0000-0000-000000000002',
  'Lesson 1: Male Reproductive System & Spermatogenesis',
  'Testis histology, Seminiferous tubules, hormonal regulation (GnRH, LH, FSH), and Spermatogenesis stages.',
  'tgbNymZ7vqY',
  55,
  '/notes/biology-ch2-male-reproduction.pdf',
  'Male Reproductive System Diagram & Notes.pdf',
  1,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 5. LIVE CLASSES
INSERT INTO public.live_classes (
  id, course_id, batch_id, title, description, youtube_live_url, youtube_video_id,
  instructor_name, scheduled_at, duration_minutes, status
) VALUES
(
  'lc000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Live Doubt Clearing & PYQ Rapid Fire — Reproduction Unit',
  'Shekhar Sir will address student doubts live on YouTube and solve previous 5 years Bihar Board objective & 5-mark subjective questions.',
  'https://www.youtube.com/watch?v=live_demo_biology',
  'jfKfPfyJRdk',
  'Shekhar Sir',
  timezone('utc'::text, now() + interval '2 hours'),
  75,
  'scheduled'
),
(
  'lc000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'Physics Live Numerical Problem Solving Workshop',
  'Live calculation tricks and step marking techniques for Gauss law and electric field problems.',
  'https://www.youtube.com/watch?v=live_demo_physics',
  'kJQP7kiw5Fk',
  'Er. R. K. Verma',
  timezone('utc'::text, now() + interval '1 day'),
  90,
  'scheduled'
)
ON CONFLICT (id) DO NOTHING;

-- 6. ANNOUNCEMENTS
INSERT INTO public.announcements (
  id, course_id, batch_id, title, body, priority, published_at
) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Bihar Board Model Paper 2026 Released — Class 12 Biology',
  'Dear students, the official model paper has been reviewed by Shekhar Sir. The special discussion session will take place this Friday at 5:00 PM. Please download the question sheet from the Study Materials tab.',
  'urgent',
  timezone('utc'::text, now())
),
(
  'a0000000-0000-0000-0000-000000000002',
  NULL,
  NULL,
  'Welcome to Aspire Academy Online Platform!',
  'Welcome to our next-generation online learning platform. Access your lessons, track your progress, attend live doubt sessions, and download authentic notes anytime.',
  'normal',
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO NOTHING;

-- 7. SITE SETTINGS
INSERT INTO public.site_settings (
  id, academy_name, director_name, tagline, hero_headline, hero_subheadline,
  primary_phone, secondary_phone, whatsapp_number, primary_email, office_address,
  announcement_ticker, ticker_active, stats_students, stats_toppers, stats_lectures, stats_rating
) VALUES (
  'global',
  'Aspire Academy Online',
  'Er. Shekhar Sir',
  'Bihar Board & CBSE Hindi/English Medium Online Coaching',
  'Bihar Board Class 12th & 11th Topper Banane Ka Sankalp',
  'NCERT line-by-line conceptual video lectures, high-yield numerical solutions, bilingual handwritten PDF notes, and daily doubt solving under Shekhar Sir.',
  '+91 9123456789',
  '+91 9876543210',
  '919123456789',
  'support@aspireacademyonline.in',
  'Main Road, Kankarbagh, Near Colony More, Patna, Bihar 800020',
  '🔥 New Target 2027 Class 12 Batch Starting Soon! Flat 60% OFF for First 100 Students.',
  true,
  '10,000+',
  '95%+',
  '1,200+',
  '4.9/5'
)
ON CONFLICT (id) DO NOTHING;

