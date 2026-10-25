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
