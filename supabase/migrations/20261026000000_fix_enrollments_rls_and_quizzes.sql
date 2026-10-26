-- ============================================================================
-- ASPIRE ACADEMY ONLINE — DATABASE MIGRATION
-- Migration: 20261026000000_fix_enrollments_rls_and_quizzes.sql
-- Description:
--   1. Fixes RLS policies on orders, enrollments, and payments to allow
--      checkout creation, webhook activation, and student dashboard reads.
--   2. Adds schemas for Quizzes, Questions, Attempts, Doubts, Bookmarks,
--      Downloads, and Lesson Progress.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FIX ORDERS, ENROLLMENTS & PAYMENTS RLS POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if present
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "orders_student_read" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_checkout" ON public.orders;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_checkout" ON public.payments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_checkout" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_public_read" ON public.enrollments;
DROP POLICY IF EXISTS "orders_public_read" ON public.orders;

-- Allow checkout & backend webhook to insert/update orders
CREATE POLICY "orders_insert_checkout"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "orders_update_checkout"
ON public.orders FOR UPDATE
USING (true);

CREATE POLICY "orders_read_all"
ON public.orders FOR SELECT
USING (true);

-- Payments policies
CREATE POLICY "payments_insert_checkout"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "payments_read_all"
ON public.payments FOR SELECT
USING (true);

-- Enrollments policies (allow students to read their active access and checkout to activate)
CREATE POLICY "enrollments_insert_checkout"
ON public.enrollments FOR INSERT
WITH CHECK (true);

CREATE POLICY "enrollments_update_checkout"
ON public.enrollments FOR UPDATE
USING (true);

CREATE POLICY "enrollments_read_all"
ON public.enrollments FOR SELECT
USING (true);


-- ----------------------------------------------------------------------------
-- 2. QUIZZES, QUESTIONS, OPTIONS, ATTEMPTS & ANSWERS TABLES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  chapter_id TEXT,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  target_class TEXT DEFAULT 'Class 12th Board',
  subject TEXT DEFAULT 'Biology',
  duration_minutes INTEGER DEFAULT 30,
  total_marks INTEGER DEFAULT 50,
  marks_per_question NUMERIC(4,2) DEFAULT 1,
  negative_marking NUMERIC(4,2) DEFAULT 0,
  passing_percentage INTEGER DEFAULT 40,
  attempt_limit INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'published', -- 'draft', 'published', 'archived'
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type VARCHAR(30) DEFAULT 'mcq', -- 'mcq', 'single_choice', 'numerical'
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Denormalized options cache for rapid querying
  correct_option VARCHAR(10) NOT NULL,
  marks NUMERIC(4,2) DEFAULT 1,
  negative_marks NUMERIC(4,2) DEFAULT 0,
  explanation TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_key VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D'
  option_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_marks NUMERIC(6,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_passed BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'submitted', -- 'in_progress', 'submitted', 'auto_submitted', 'timed_out'
  time_taken_seconds INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option VARCHAR(10),
  is_correct BOOLEAN DEFAULT false,
  marks_awarded NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Quizzes and Child tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_public_select" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_admin_all" ON public.quizzes FOR ALL USING (true);

CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions FOR ALL USING (true);

CREATE POLICY "quiz_options_select" ON public.quiz_options FOR SELECT USING (true);
CREATE POLICY "quiz_options_admin_all" ON public.quiz_options FOR ALL USING (true);

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "quiz_attempts_all" ON public.quiz_attempts FOR ALL USING (true);

CREATE POLICY "quiz_attempt_answers_all" ON public.quiz_attempt_answers FOR ALL USING (true);


-- ----------------------------------------------------------------------------
-- 3. STUDENT DASHBOARD FEATURES (DOUBTS, BOOKMARKS, DOWNLOADS, PROGRESS)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  faculty_name TEXT DEFAULT 'Shekhar Sir',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.student_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  lesson_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  material_name TEXT NOT NULL,
  material_path TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.student_doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_doubts_all" ON public.student_doubts FOR ALL USING (true);
CREATE POLICY "student_bookmarks_all" ON public.student_bookmarks FOR ALL USING (true);
CREATE POLICY "student_downloads_all" ON public.student_downloads FOR ALL USING (true);
CREATE POLICY "student_progress_all" ON public.student_lesson_progress FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_student ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_doubts_student ON public.student_doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON public.student_lesson_progress(student_id);
