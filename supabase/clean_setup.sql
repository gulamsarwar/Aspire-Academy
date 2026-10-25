-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('student', 'admin', 'instructor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status_enum AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('created', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE live_class_status_enum AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('low', 'normal', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE
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
    thumbnail_url TEXT NOT NULL DEFAULT '/images/course-default.jpg',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    published BOOLEAN NOT NULL DEFAULT true,
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
    start_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '300 days'),
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

-- 11. ENROLLMENTS TABLE
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

-- 12. LIVE CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.live_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    youtube_live_url TEXT NOT NULL DEFAULT '',
    youtube_video_id TEXT NOT NULL DEFAULT '',
    instructor_name TEXT NOT NULL DEFAULT 'Shekhar Sir',
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '1 day'),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status live_class_status_enum NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. LESSON PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, lesson_id)
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_resource TEXT NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. SITE SETTINGS TABLE
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

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES (DROP EXISTING TO AVOID CONFLICT, THEN CREATE)
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
DROP POLICY IF EXISTS "Public access courses" ON public.courses;
CREATE POLICY "Public access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view batches" ON public.batches;
DROP POLICY IF EXISTS "Public access batches" ON public.batches;
CREATE POLICY "Public access batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view modules" ON public.modules;
DROP POLICY IF EXISTS "Public access modules" ON public.modules;
CREATE POLICY "Public access modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Public access lessons" ON public.lessons;
CREATE POLICY "Public access lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public access site settings" ON public.site_settings;
CREATE POLICY "Public access site settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- SEED 4 COURSES
INSERT INTO public.courses (
  id, slug, title, subtitle, description, category, target_class, thumbnail_url,
  price, original_price, currency, published, featured, language, duration_weeks,
  instructor_name, instructor_title
) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'class-12-biology',
  'Class 12 Biology — Complete Board & NEET Foundation',
  'Complete Bihar Board & CBSE Biology with NCERT Line-by-Line',
  'Designed specifically for Bihar Board and CBSE Class 12 students aiming for top board scores.',
  'Bihar Board',
  'Class 12',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  399.00,
  1499.00,
  'INR',
  true,
  true,
  'Hinglish',
  32,
  'Shekhar Sir',
  'Academic Director'
),
(
  'c0000000-0000-0000-0000-000000000002',
  'class-12-physics',
  'Class 12 Physics — Concept, Numerical & PYQ Mastery',
  'Master Electrostatics, Optics & Modern Physics with Derivations',
  'Clear your fear of Physics with our step-by-step conceptual methodology.',
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
  'Senior Faculty'
),
(
  'c0000000-0000-0000-0000-000000000003',
  'class-12-chemistry',
  'Class 12 Chemistry — Physical, Organic & Inorganic',
  'Simplified Reaction Mechanisms, Named Reactions & Formula Bank',
  'Master Organic Chemistry mechanisms without rote memorization.',
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
  'Chemistry Faculty'
),
(
  'c0000000-0000-0000-0000-000000000004',
  'class-10-board-foundation',
  'Class 10 Science & Mathematics — Topper Batch',
  'Comprehensive Science & Mathematics for Bihar Board Class 10',
  'Build unbreakable conceptual clarity in Science and Mathematics.',
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
  'Subject Specialists'
)
ON CONFLICT (id) DO NOTHING;

-- SEED BATCH
INSERT INTO public.batches (
  id, course_id, name, schedule_description, capacity, enrollment_open, instructor_name
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Super-50 Biology Board Batch 2026-27',
  'Daily 7:00 AM - 8:30 AM (Mon-Fri) + Sunday Grand Test',
  150,
  true,
  'Shekhar Sir'
)
ON CONFLICT (id) DO NOTHING;

-- SEED MODULE
INSERT INTO public.modules (
  id, course_id, title, sort_order
) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Unit 1: Reproduction in Organisms & Human Reproduction',
  1
)
ON CONFLICT (id) DO NOTHING;

-- SEED LESSON
INSERT INTO public.lessons (
  id, module_id, title, description, youtube_video_id, duration_minutes, sort_order, is_free_preview, published
) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Lecture 01: Reproduction in Organisms — Asexual vs Sexual Reproduction',
  'Introduction to reproduction modes, Binary fission, Budding, Vegetative propagation.',
  'jfKfPfyJRdk',
  48,
  1,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- SEED SITE SETTINGS
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
