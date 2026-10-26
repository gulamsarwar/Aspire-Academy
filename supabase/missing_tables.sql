-- ==============================================================================
-- ASPIRE ACADEMY ONLINE — MISSING TABLES, TRIGGERS & RLS SETUP
-- ==============================================================================

-- 1. QUIZZES & QUESTIONS TABLES
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks INTEGER NOT NULL DEFAULT 50,
    passing_marks INTEGER NOT NULL DEFAULT 20,
    attempt_limit INTEGER NOT NULL DEFAULT 3,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(1) NOT NULL,
    explanation TEXT DEFAULT '',
    marks INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total_marks NUMERIC(5, 2) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. DOUBTS, BOOKMARKS & DOWNLOADS TABLES
CREATE TABLE IF NOT EXISTS public.student_doubts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    faculty_name TEXT DEFAULT 'Shekhar Sir',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    answered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    lesson_title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.downloaded_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    material_path TEXT NOT NULL,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloaded_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_admin" ON public.quizzes;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (published = true OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));
CREATE POLICY "quizzes_admin" ON public.quizzes FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

DROP POLICY IF EXISTS "questions_select" ON public.quiz_questions;
DROP POLICY IF EXISTS "questions_admin" ON public.quiz_questions;
CREATE POLICY "questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_admin" ON public.quiz_questions FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

DROP POLICY IF EXISTS "attempts_student" ON public.quiz_attempts;
CREATE POLICY "attempts_student" ON public.quiz_attempts FOR ALL USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

DROP POLICY IF EXISTS "doubts_all" ON public.student_doubts;
CREATE POLICY "doubts_all" ON public.student_doubts FOR ALL USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

DROP POLICY IF EXISTS "bookmarks_student" ON public.student_bookmarks;
CREATE POLICY "bookmarks_student" ON public.student_bookmarks FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "downloads_student" ON public.downloaded_materials;
CREATE POLICY "downloads_student" ON public.downloaded_materials FOR ALL USING (auth.uid() = student_id);

-- 4. GOOGLE OAUTH AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN public.profiles.full_name = '' OR public.profiles.full_name IS NULL 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
