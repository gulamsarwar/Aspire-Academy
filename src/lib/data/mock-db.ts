import {
  Course,
  Batch,
  Module,
  Lesson,
  Enrollment,
  Order,
  Payment,
  LiveClass,
  LessonProgress,
  Announcement,
  AuditLog,
  Profile,
  SiteSettings,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Bookmark,
  StudentDoubt,
  DownloadedMaterial,
} from '@/lib/types';

export function generateDeterministicUUID(seed: string): string {
  if (!seed) return '00000000-0000-4000-8000-000000000001';
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x9e3779b9, h4 = 0x12345678;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 374761393);
  }
  const s1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const s2 = (h2 >>> 16).toString(16).padStart(4, '0');
  const s3 = ((h3 >>> 16) & 0x0fff | 0x4000).toString(16).padStart(4, '0');
  const s4 = ((h4 >>> 16) & 0x3fff | 0x8000).toString(16).padStart(4, '0');
  const s5 = ((h1 ^ h2 ^ h3 ^ h4) >>> 0).toString(16).padStart(8, '0') + ((h2 ^ h3) >>> 0).toString(16).padStart(4, '0');
  return `${s1}-${s2}-${s3}-${s4}-${s5.slice(0, 12)}`;
}

export function normalizeStudentId(id: string): string {
  if (!id || !id.trim()) return '';
  if (
    id === 'u0000000-0000-0000-0000-000000000001' ||
    id === 'student@gmail.com' ||
    id === 'student@aspireacademy.demo' ||
    id === 'student.aspire@gmail.com'
  ) {
    return '00000000-0000-4000-8000-000000000001';
  }
  const cleanDigits = id.replace(/\D/g, '');
  if (cleanDigits === '9876543210') {
    return '00000000-0000-4000-8000-000000000001';
  }
  if (
    id === 'u0000000-0000-0000-0000-000000000002' ||
    id === 'admin@aspireacademy.in' ||
    id === 'admin@aspireacademy.demo' ||
    cleanDigits === '9123456789'
  ) {
    return '00000000-0000-4000-8000-000000000002';
  }
  // If it's already a valid RFC 4122 UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  // Otherwise, deterministically hash phone number or email into compliant UUID
  return generateDeterministicUUID(id);
}


// Helper to generate valid RFC 4122 UUIDs for PostgreSQL compatibility
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const initialCourses: Course[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    slug: 'class-12-biology',
    title: 'Class 12 Biology — Complete Board & NEET Foundation',
    subtitle: 'Bihar Board & CBSE Biology with NCERT Line-by-Line, High-Yield Diagrams & Solved PYQs',
    description: 'Designed specifically for Bihar Board and CBSE Class 12 students aiming for top board scores and solid NEET fundamentals. Led by renowned Shekhar Sir, this course covers every chapter in detail with high-yield diagram practice, handwritten notes, chapter tests, and previous 10 years question bank solutions.',
    category: 'Bihar Board',
    target_class: 'Class 12',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    price: 399,
    original_price: 1499,
    currency: 'INR',
    published: true,
    featured: true,
    language: 'Hinglish (Hindi + English terminology)',
    duration_weeks: 32,
    instructor_name: 'Shekhar Sir',
    instructor_title: 'Senior Biology Specialist & Academic Director (10+ Yrs Exp)',
    features: [
      'Complete NCERT Line-by-Line Video Classes',
      'High-Yield Diagram Workshops with Step Marking',
      'Bihar Board 10 Years Solved PYQ Bank',
      'Chapter-wise PDF Notes & Mindmaps',
      'Weekly Live Doubt & Revision Sessions',
      '50% Objective Question Pattern Mastery',
    ],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    slug: 'class-12-physics',
    title: 'Class 12 Physics — Concept, Numerical & PYQ Mastery',
    subtitle: 'Master Electrostatics, Optics & Modern Physics with Derivations, Numericals and Regular Tests',
    description: 'Clear your fear of Physics with our step-by-step conceptual methodology. From Electrostatics to Magnetism, Ray Optics to Semiconductor Electronics, master every derivation and numerical technique needed for Bihar Board, CBSE, and JEE/NEET exams.',
    category: 'Bihar Board',
    target_class: 'Class 12',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
    price: 999,
    original_price: 2499,
    currency: 'INR',
    published: true,
    featured: true,
    language: 'Hinglish',
    duration_weeks: 32,
    instructor_name: 'Er. R. K. Verma',
    instructor_title: 'Senior Physics Faculty (Ex-Kota Educator)',
    features: [
      'Step-by-step Derivation Handbooks',
      'Formula Sheet & Short Notes PDF',
      'Daily Practice Problems (DPP) with solutions',
      'Live Numerical Solving Batches',
      'Board Exam Target Series',
    ],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    slug: 'class-12-chemistry',
    title: 'Class 12 Chemistry — Physical, Organic & Inorganic',
    subtitle: 'Simplified Reaction Mechanisms, Named Reactions, NCERT In-Text Problems & Formula Bank',
    description: 'Master Organic Chemistry mechanisms without rote memorization. Learn Physical Chemistry numericals effortlessly and memorize Inorganic trends with smart mnemonics and NCERT line pointers.',
    category: 'Bihar Board',
    target_class: 'Class 12',
    thumbnail_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
    price: 999,
    original_price: 2499,
    currency: 'INR',
    published: true,
    featured: true,
    language: 'Hinglish',
    duration_weeks: 32,
    instructor_name: 'Dr. A. Anand',
    instructor_title: 'Doctorate in Chemistry & Board Evaluator',
    features: [
      'Organic Reaction Mechanism Maps',
      'Inorganic NCERT Highlight Sheets',
      'Physical Chemistry Numerical Formula Booklet',
      'Monthly Grand Mock Tests',
      'Personal Doubt Clearing',
    ],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    slug: 'class-10-board-foundation',
    title: 'Class 10 Science & Mathematics — Topper Batch',
    subtitle: 'Comprehensive Science, Mathematics & Objective Strategy for Bihar Board & CBSE Class 10',
    description: 'Build unbreakable conceptual clarity in Physics, Chemistry, Biology, and Mathematics. Structured practice to ensure 95%+ marks in Class 10 Board examinations with bilingual explanation.',
    category: 'Foundation',
    target_class: 'Class 10',
    thumbnail_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    price: 799,
    original_price: 1999,
    currency: 'INR',
    published: true,
    featured: false,
    language: 'Hindi & English',
    duration_weeks: 28,
    instructor_name: 'Aspire Core Faculty',
    instructor_title: 'Team of Subject Specialists',
    features: [
      'Full Board Syllabus Coverage',
      'Chapter-wise Objective & Subjective Tests',
      'Special Doubt Classes',
      'Answer Writing Presentation Tips',
    ],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
];

export const initialBatches: Batch[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Super-50 Biology Board Batch 2026-27',
    schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM IST',
    start_at: '2026-04-01T00:00:00Z',
    end_at: '2027-02-28T23:59:59Z',
    capacity: 150,
    enrolled_count: 64,
    enrollment_open: true,
    instructor_name: 'Shekhar Sir',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Morning Achievers Biology Batch',
    schedule_description: 'Tue, Thu, Sat — 07:00 AM to 08:30 AM IST',
    start_at: '2026-04-15T00:00:00Z',
    end_at: '2027-02-28T23:59:59Z',
    capacity: 120,
    enrolled_count: 38,
    enrollment_open: true,
    instructor_name: 'Shekhar Sir',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    course_id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Pratibha Physics Batch (Evening)',
    schedule_description: 'Mon, Wed, Fri — 06:45 PM to 08:15 PM IST',
    start_at: '2026-04-01T00:00:00Z',
    end_at: '2027-02-28T23:59:59Z',
    capacity: 150,
    enrolled_count: 52,
    enrollment_open: true,
    instructor_name: 'Er. R. K. Verma',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    course_id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Sankalp Chemistry Batch',
    schedule_description: 'Tue, Thu, Sat — 05:00 PM to 06:30 PM IST',
    start_at: '2026-04-01T00:00:00Z',
    end_at: '2027-02-28T23:59:59Z',
    capacity: 150,
    enrolled_count: 45,
    enrollment_open: true,
    instructor_name: 'Dr. A. Anand',
    created_at: '2026-04-01T00:00:00Z',
  },
];

export const initialModules: Module[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Unit 1: Sexual Reproduction in Flowering Plants',
    description: 'Flower morphology, microsporogenesis, megasporogenesis, pollination and double fertilization.',
    sort_order: 1,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Unit 2: Human Reproduction & Reproductive Health',
    description: 'Male & Female reproductive systems, gametogenesis, menstrual cycle, fertilization, and contraception.',
    sort_order: 2,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Unit 3: Genetics & Principles of Inheritance',
    description: 'Mendelian genetics, chromosomal disorders, linkage, sex determination, and pedigree analysis.',
    sort_order: 3,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    course_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Unit 1: Electric Charges & Gauss Law',
    description: 'Coulombs law, electric field lines, electric dipole, flux and Gauss theorem applications.',
    sort_order: 1,
    created_at: '2026-04-01T00:00:00Z',
  },
];

export const initialLessons: Lesson[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    module_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Lesson 1: Introduction to Flower Structure & Stamen Details',
    description: 'Deep dive into anther structure, 4 microsporangia layers (epidermis, endothecium, middle layers, tapetum), and pollen wall composition.',
    youtube_video_id: 'dwzOc6X5aeE',
    duration_minutes: 48,
    material_path: '/notes/biology-ch1-stamen-pollen.pdf',
    material_name: 'Lesson 1 — Anther Wall & Pollen Notes.pdf',
    sort_order: 1,
    is_free_preview: true,
    published: true,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    module_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Lesson 2: Megasporogenesis & 7-Celled 8-Nucleate Embryo Sac',
    description: 'Ovule types, integuments, nucellus, functional megaspore, free nuclear mitotic divisions, and egg apparatus structure.',
    youtube_video_id: 'ExaQ8shhkw8',
    duration_minutes: 52,
    material_path: '/notes/biology-ch1-embryo-sac.pdf',
    material_name: 'Lesson 2 — Embryo Sac Handout.pdf',
    sort_order: 2,
    is_free_preview: false,
    published: true,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    module_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Lesson 3: Pollination Agents & Outbreeding Mechanisms',
    description: 'Wind, water, and animal pollination adaptations. Self-incompatibility, dichogamy, and pollen-pistil interaction.',
    youtube_video_id: 'HLYPm2idSTE',
    duration_minutes: 45,
    material_path: '/notes/biology-ch1-pollination.pdf',
    material_name: 'Lesson 3 — Pollination PYQ Sheet.pdf',
    sort_order: 3,
    is_free_preview: false,
    published: true,
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    module_id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Lesson 1: Male Reproductive System & Spermatogenesis',
    description: 'Testis histology, Leydig cells, Sertoli cells, GnRH regulation, and spermiogenesis vs spermiation.',
    youtube_video_id: '-XQcnO4iX_U',
    duration_minutes: 56,
    material_path: '/notes/biology-ch2-male-system.pdf',
    material_name: 'Lesson 4 — Spermatogenesis Flowchart.pdf',
    sort_order: 1,
    is_free_preview: false,
    published: true,
    created_at: '2026-04-01T00:00:00Z',
  },
];

export const initialLiveClasses: LiveClass[] = [
  {
    id: 'lc000000-0000-0000-0000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Live Doubt Clearing & Bihar Board PYQ Rapid Fire',
    description: 'Shekhar Sir will address student doubts live on YouTube and solve previous 5 years Bihar Board 1-mark objective & 5-mark subjective diagram questions.',
    youtube_live_url: 'https://www.youtube.com/watch?v=live_demo_biology',
    youtube_video_id: 'jfKfPfyJRdk',
    instructor_name: 'Shekhar Sir',
    scheduled_at: '2026-04-15T18:00:00.000Z',
    duration_minutes: 75,
    status: 'scheduled',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'lc000000-0000-0000-0000-000000000002',
    course_id: 'c0000000-0000-0000-0000-000000000002',
    batch_id: 'b0000000-0000-0000-0000-000000000003',
    title: 'Physics Live Numerical Solving & Derivation Masterclass',
    description: 'Live derivation of Gauss law applications and electrostatic dipole torque calculation with Er. Verma.',
    youtube_live_url: 'https://www.youtube.com/watch?v=live_demo_physics',
    youtube_video_id: 'kJQP7kiw5Fk',
    instructor_name: 'Er. R. K. Verma',
    scheduled_at: '2026-04-16T18:45:00.000Z',
    duration_minutes: 90,
    status: 'scheduled',
    created_at: '2026-04-01T00:00:00Z',
  },
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Bihar Board Model Paper 2026 Analysis — Class 12 Biology',
    body: 'Dear students, the official model paper has been released. Shekhar Sir will dissect the high-weightage chapters and 50% objective MCQ tips during the upcoming live class.',
    priority: 'urgent',
    published_at: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Welcome to Aspire Academy Platform!',
    body: 'We are thrilled to launch the high-speed Aspire Academy web platform. Enrolled students can track their chapter progress, download authentic handwritten notes, and join live streams effortlessly.',
    priority: 'normal',
    published_at: '2026-04-09T14:00:00.000Z',
  },
];

export const initialProfiles: Profile[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'student@aspireacademy.demo',
    full_name: 'Priyanshu Kumari',
    phone: '+91 9876543210',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'student@aspireacademy.demo',
    full_name: 'Priyanshu Kumari',
    phone: '+91 9876543210',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'admin@aspireacademy.demo',
    full_name: 'Shekhar Sir (Admin)',
    phone: '+91 9123456789',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'admin@aspireacademy.demo',
    full_name: 'Shekhar Sir (Admin)',
    phone: '+91 9123456789',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
];

export const initialEnrollments: Enrollment[] = [
  {
    id: '00000000-0000-4000-8000-000000000030',
    student_id: '00000000-0000-4000-8000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    order_id: '00000000-0000-4000-8000-000000000010',
    status: 'active',
    enrolled_at: '2026-04-02T10:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000031',
    student_id: 'u0000000-0000-0000-0000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    order_id: '00000000-0000-4000-8000-000000000010',
    status: 'active',
    enrolled_at: '2026-04-02T10:00:00Z',
  },
];

export const initialOrders: Order[] = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    student_id: '00000000-0000-4000-8000-000000000001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    amount: 399,
    currency: 'INR',
    status: 'paid',
    gateway_order_id: 'order_test_9081237192',
    gateway_payment_id: 'pay_test_8871239812',
    created_at: '2026-04-02T09:58:00Z',
  },
];

export const initialPayments: Payment[] = [
  {
    id: '00000000-0000-4000-8000-000000000020',
    order_id: '00000000-0000-4000-8000-000000000010',
    gateway_payment_id: 'pay_test_8871239812',
    amount: 399,
    currency: 'INR',
    method: 'upi_googlepay',
    status: 'captured',
    verified_at: '2026-04-02T09:59:15Z',
    created_at: '2026-04-02T09:58:30Z',
  },
];

export const initialLessonProgress: LessonProgress[] = [
  {
    id: 'lp_001',
    student_id: '00000000-0000-4000-8000-000000000001',
    lesson_id: 'e0000000-0000-0000-0000-000000000001',
    completed: true,
    completed_at: '2026-04-02T11:30:00Z',
    updated_at: '2026-04-02T11:30:00Z',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'al_001',
    admin_id: '00000000-0000-4000-8000-000000000002',
    action: 'BATCH_CREATED',
    target_user_id: '00000000-0000-4000-8000-000000000002',
    target_resource: 'b0000000-0000-0000-0000-000000000001',
    reason: 'Initial session launch for Bihar Board Biology 2026-27',
    created_at: '2026-04-01T00:00:00Z',
  },
];

export const initialQuizzes: Quiz[] = [
  {
    id: 'qz_001',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Class 12 Biology — Genetics & Inheritance Principles (50% Objective Test)',
    description: 'Bihar Board & CBSE high-yield objective practice covering Mendel laws, dihybrid cross, and chromosomal theory.',
    duration_minutes: 20,
    total_marks: 3,
    passing_percentage: 60,
    published: true,
    questions_count: 3,
    created_at: '2026-04-05T10:00:00Z',
  },
  {
    id: 'qz_002',
    course_id: 'c0000000-0000-0000-0000-000000000002',
    batch_id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Class 12 Physics — Electrostatics & Coulomb Law Numerical MCQ Test',
    description: 'Concept verification and formula derivation tests on charge, Coulomb force, and dielectric constants.',
    duration_minutes: 25,
    total_marks: 3,
    passing_percentage: 60,
    published: true,
    questions_count: 3,
    created_at: '2026-04-06T10:00:00Z',
  },
];

export const initialQuizQuestions: QuizQuestion[] = [
  {
    id: 'qq_001',
    quiz_id: 'qz_001',
    question_number: 1,
    question_text: 'मेंडल के द्विसंकर संकरण (Dihybrid Cross) का $F_2$ पीढ़ी में लक्षणप्ररूपी अनुपात (Phenotypic ratio) क्या होता है?',
    options: [
      { id: 'A', text: '$9:3:3:1$' },
      { id: 'B', text: '$1:2:1$' },
      { id: 'C', text: '$3:1$' },
      { id: 'D', text: '$9:7$' },
    ],
    correct_option: 'A',
    explanation: 'मेंडल के स्वतंत्र अपव्यूहन के नियमानुसार द्विसंकर क्रॉस में $F_2$ पीढ़ी का लक्षणप्ररूपी अनुपात $9:3:3:1$ प्राप्त होता है।',
    subject: 'Biology',
    marks: 1,
  },
  {
    id: 'qq_002',
    quiz_id: 'qz_001',
    question_number: 2,
    question_text: 'हार्ड-वेनबर्ग साम्यावस्था (Hardy-Weinberg Equilibrium) को किस गणितीय समीकरण द्वारा व्यक्त किया जाता है?',
    options: [
      { id: 'A', text: '$p^2 + 2pq + q^2 = 1$' },
      { id: 'B', text: '$p + q = 1$' },
      { id: 'C', text: '$p^2 - 2pq + q^2 = 1$' },
      { id: 'D', text: '$p^2 + q^2 = 1$' },
    ],
    correct_option: 'A',
    explanation: 'जीन आवृतियों की स्थिरता दर्शाने वाला द्विपद समीकरण $p^2 + 2pq + q^2 = 1$ है जहाँ $p^2$ समयुग्मजी प्रभावी और $q^2$ अप्रभावी आवृत्ति है।',
    subject: 'Biology',
    marks: 1,
  },
  {
    id: 'qq_003',
    quiz_id: 'qz_001',
    question_number: 3,
    question_text: 'वाटसन और क्रिक द्वारा प्रस्तावित B-DNA के एक पूर्ण घुमाव (Pitch) की लंबाई कितनी होती है?',
    options: [
      { id: 'A', text: '$3.4\\text{ nm}$ ($34\\text{ \\AA}$)' },
      { id: 'B', text: '$0.34\\text{ nm}$' },
      { id: 'C', text: '$2.0\\text{ nm}$' },
      { id: 'D', text: '$20\\text{ \\AA}$' },
    ],
    correct_option: 'A',
    explanation: 'B-DNA के एक पूर्ण कुंडल में 10 बेस पेयर्स होते हैं और प्रत्येक घुमाव की लंबाई $3.4\\text{ nm}$ होती है।',
    subject: 'Biology',
    marks: 1,
  },
  {
    id: 'qq_004',
    quiz_id: 'qz_002',
    question_number: 1,
    question_text: 'दो बिंदु आवेशों $q_1$ तथा $q_2$ के बीच दूरी $r$ होने पर निर्वात में कूलॉम बल का सही सूत्र क्या है?',
    options: [
      { id: 'A', text: '$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$' },
      { id: 'B', text: '$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r}$' },
      { id: 'C', text: '$F = 4\\pi\\varepsilon_0 \\frac{q_1 q_2}{r^2}$' },
      { id: 'D', text: '$F = \\frac{1}{2\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$' },
    ],
    correct_option: 'A',
    explanation: 'कूलॉम के नियम के अनुसार दो स्थिर बिंदु आवेशों के बीच आकर्षण या प्रतिकर्षण बल $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$ होता है।',
    subject: 'Physics',
    marks: 1,
  },
  {
    id: 'qq_005',
    quiz_id: 'qz_002',
    question_number: 2,
    question_text: 'समांतर पट्टिका संधारित्र (Parallel Plate Capacitor) की धारिता का सूत्र क्या है जहाँ पट्टिकाओं का क्षेत्रफल $A$ और दूरी $d$ है?',
    options: [
      { id: 'A', text: '$C = \\frac{\\varepsilon_0 A}{d}$' },
      { id: 'B', text: '$C = \\frac{\\varepsilon_0 d}{A}$' },
      { id: 'C', text: '$C = \\varepsilon_0 A d$' },
      { id: 'D', text: '$C = \\frac{A}{4\\pi\\varepsilon_0 d}$' },
    ],
    correct_option: 'A',
    explanation: 'वायु माध्यम वाले समांतर पट्टिका संधारित्र की धारिता $C = \\frac{\\varepsilon_0 A}{d}$ होती है।',
    subject: 'Physics',
    marks: 1,
  },
  {
    id: 'qq_006',
    quiz_id: 'qz_002',
    question_number: 3,
    question_text: 'यदि किसी प्रकाश तरंग की तरंगदैर्घ्य $\\lambda = 6000\\text{ \\AA}$ है, तो इसकी आवृत्ति $\\nu$ कितनी होगी? ($c = 3 \\times 10^8\\text{ m/s}$)',
    options: [
      { id: 'A', text: '$5 \\times 10^{14}\\text{ Hz}$' },
      { id: 'B', text: '$5 \\times 10^{15}\\text{ Hz}$' },
      { id: 'C', text: '$2 \\times 10^{14}\\text{ Hz}$' },
      { id: 'D', text: '$1.8 \\times 10^{14}\\text{ Hz}$' },
    ],
    correct_option: 'A',
    explanation: '$\\nu = \\frac{c}{\\lambda} = \\frac{3 \\times 10^8}{6000 \\times 10^{-10}} = \\frac{3 \\times 10^8}{6 \\times 10^{-7}} = 0.5 \\times 10^{15} = 5 \\times 10^{14}\\text{ Hz}$।',
    subject: 'Physics',
    marks: 1,
  },
];

export const initialQuizAttempts: QuizAttempt[] = [];

export const initialBookmarks: Bookmark[] = [
  {
    id: 'bm_001',
    student_id: '00000000-0000-4000-8000-000000000001',
    resource_type: 'lesson',
    resource_id: 'e0000000-0000-0000-0000-000000000001',
    title: 'DNA Double Helix Structure & Packaging',
    url: '/dashboard/courses/class-12-biology/learn',
    created_at: '2026-04-03T12:00:00Z',
  },
];

export const initialDoubts: StudentDoubt[] = [
  {
    id: 'dbt_001',
    student_id: '00000000-0000-4000-8000-000000000001',
    student_name: 'Priyanshu Kumari',
    course_id: 'c0000000-0000-0000-0000-000000000001',
    course_title: 'Class 12 Biology — Complete Board & NEET Foundation',
    question: 'Sir, how to determine whether an inheritance is sex-linked recessive or autosomal dominant in Bihar Board pedigree chart questions?',
    status: 'answered',
    answer: 'Look for male-to-male transmission: autosomal traits can pass from father to son, but X-linked recessive father cannot pass to son. Also if unaffected parents produce an affected female child, the trait must be autosomal recessive.',
    faculty_name: 'Shekhar Sir',
    created_at: '2026-04-04T15:30:00Z',
    answered_at: '2026-04-04T18:00:00Z',
  },
];

export const initialDownloads: DownloadedMaterial[] = [
  {
    id: 'dl_001',
    student_id: '00000000-0000-4000-8000-000000000001',
    lesson_id: 'e0000000-0000-0000-0000-000000000001',
    title: 'Molecular Basis of Inheritance Diagram Notes',
    file_name: 'molecular-basis-handwritten-notes.pdf',
    file_size: '4.2 MB',
    downloaded_at: '2026-04-03T11:45:00Z',
  },
];

export const initialSiteSettings: SiteSettings = {
  academy_name: 'Aspire Academy',
  tagline: 'Learn Today. Lead Tomorrow.',
  description:
    'Aspire Academy provides top-tier education for Bihar Board, CBSE, NEET, and Foundation students through experienced faculty, smart digital classes, chapter-wise tests, and personal mentoring led by renowned Shekhar Sir.',
  lead_faculty: 'Shekhar Sir',
  phone: '+91 9876543210',
  whatsapp: '+91 9876543210',
  email: 'contact@aspireacademyonline.in',
  address: 'Main Road, Near College Chowk, Bihar 800001',
  office_hours: 'Mon – Sat: 8:00 AM – 8:00 PM, Sun: 9:00 AM – 2:00 PM',
  announcement_tag: 'New Batch 2026-27',
  announcement_text: 'Class 12 Bihar Board & NEET Foundation Admissions Open!',
  announcement_active: true,
  stat_students: '500+',
  stat_experience: '10+ Yrs',
  stat_success: '100%',
  hero_headline: 'Learn Today. Lead Tomorrow.',
  hero_subheadline:
    'Aspire Academy provides top-tier education for Bihar Board, CBSE, NEET, and Foundation students through experienced faculty, smart digital classes, chapter-wise tests, and personal mentoring led by renowned Shekhar Sir.',
  updated_at: '2026-04-01T00:00:00Z',
};

// In-Memory Database store with runtime mutability
class MockDatabase {
  courses: Course[] = [...initialCourses];
  batches: Batch[] = [...initialBatches];
  modules: Module[] = [...initialModules];
  lessons: Lesson[] = [...initialLessons];
  liveClasses: LiveClass[] = [...initialLiveClasses];
  announcements: Announcement[] = [...initialAnnouncements];
  profiles: Profile[] = [...initialProfiles];
  enrollments: Enrollment[] = [...initialEnrollments];
  orders: Order[] = [...initialOrders];
  payments: Payment[] = [...initialPayments];
  lessonProgress: LessonProgress[] = [...initialLessonProgress];
  auditLogs: AuditLog[] = [...initialAuditLogs];
  quizzes: Quiz[] = [...initialQuizzes];
  quizQuestions: QuizQuestion[] = [...initialQuizQuestions];
  quizAttempts: QuizAttempt[] = [...initialQuizAttempts];
  bookmarks: Bookmark[] = [...initialBookmarks];
  doubts: StudentDoubt[] = [...initialDoubts];
  downloads: DownloadedMaterial[] = [...initialDownloads];
  settings: SiteSettings = { ...initialSiteSettings };
  processedWebhookEvents: Set<string> = new Set(['event_test_demo_001']);


  // Courses
  getCourses(onlyPublished = true) {
    if (onlyPublished) {
      return this.courses.filter((c) => c.published);
    }
    return [...this.courses];
  }

  getCourseBySlug(slug: string) {
    return this.courses.find((c) => c.slug === slug);
  }

  getCourseById(id: string) {
    return this.courses.find((c) => c.id === id);
  }

  // Batches
  getBatchesForCourse(courseId: string, onlyOpen = false) {
    return this.batches.filter((b) => {
      const match = b.course_id === courseId;
      return onlyOpen ? match && b.enrollment_open : match;
    });
  }

  getBatchById(id: string) {
    return this.batches.find((b) => b.id === id);
  }

  // Modules & Lessons
  getCurriculumForCourse(courseId: string) {
    const courseModules = this.modules
      .filter((m) => m.course_id === courseId)
      .sort((a, b) => a.sort_order - b.sort_order);

    return courseModules.map((module) => {
      const lessons = this.lessons
        .filter((l) => l.module_id === module.id && l.published)
        .sort((a, b) => a.sort_order - b.sort_order);
      return {
        ...module,
        lessons,
      };
    });
  }

  // Canonical Identity & Profile Resolver
  resolveAssociatedStudentIds(studentId: string): string[] {
    if (!studentId || !studentId.trim()) return [];
    const sId = normalizeStudentId(studentId);
    if (!sId) return [];
    const ids = new Set<string>([studentId, sId]);

    // Find profile
    const profile = this.profiles.find((p) => p.id === studentId || normalizeStudentId(p.id) === sId);
    if (profile) {
      ids.add(profile.id);
      ids.add(normalizeStudentId(profile.id));

      const cleanPhoneDigits = profile.phone ? profile.phone.replace(/\D/g, '').slice(-10) : '';
      const cleanEmail = profile.email?.toLowerCase().trim();

      // Find all other profiles matching phone or email
      this.profiles.forEach((p) => {
        const pDigits = p.phone ? p.phone.replace(/\D/g, '').slice(-10) : '';
        const pEmail = p.email?.toLowerCase().trim();
        if ((cleanPhoneDigits && pDigits === cleanPhoneDigits) || (cleanEmail && pEmail === cleanEmail)) {
          ids.add(p.id);
          ids.add(normalizeStudentId(p.id));
        }
      });
    }

    return Array.from(ids);
  }

  resolveOrCreateProfile({
    id,
    email,
    phone,
    fullName,
    avatarUrl,
  }: {
    id?: string;
    email?: string;
    phone?: string;
    fullName?: string;
    avatarUrl?: string;
  }): Profile {
    const cleanEmail = email?.toLowerCase().trim();
    const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';

    // 1. Try to find existing profile by ID or canonical email identifier
    const targetNormalizedId = id
      ? normalizeStudentId(id)
      : (cleanEmail && (cleanEmail.includes('admin') || cleanEmail.includes('student@aspireacademy.demo'))
          ? normalizeStudentId(cleanEmail)
          : undefined);

    let profile = targetNormalizedId
      ? this.profiles.find((p) => p.id === targetNormalizedId || normalizeStudentId(p.id) === targetNormalizedId)
      : undefined;

    // 2. Try to find existing profile by phone
    if (!profile && cleanPhoneDigits) {
      profile = this.profiles.find((p) => {
        const pDigits = p.phone ? p.phone.replace(/\D/g, '').slice(-10) : '';
        return pDigits === cleanPhoneDigits;
      });
    }

    // 3. Try to find existing profile by email
    if (!profile && cleanEmail) {
      profile = this.profiles.find((p) => p.email && p.email.toLowerCase().trim() === cleanEmail);
    }

    if (profile) {
      if (cleanEmail && (!profile.email || profile.email.includes('@mobile.aspireacademy.in'))) {
        profile.email = cleanEmail;
      }
      if (cleanPhoneDigits && !profile.phone) {
        profile.phone = `+91 ${cleanPhoneDigits}`;
      }
      if (fullName && (!profile.full_name || profile.full_name.startsWith('Student ('))) {
        profile.full_name = fullName;
      }
      if (avatarUrl && !profile.avatar_url) {
        profile.avatar_url = avatarUrl;
      }
      return profile;
    }

    // 4. Create new profile with stable deterministic UUID
    const seed = cleanEmail || cleanPhoneDigits || id || `${Date.now()}`;
    const newId =
      id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        ? id.toLowerCase()
        : generateDeterministicUUID(`student_${seed}`);

    const newProfile: Profile = {
      id: newId,
      email: cleanEmail || `student_${cleanPhoneDigits || 'new'}@aspireacademyonline.in`,
      full_name:
        fullName || (cleanEmail ? cleanEmail.split('@')[0] : 'Aspire Student'),
      phone: cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : undefined,
      avatar_url:
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.unshift(newProfile);
    return newProfile;
  }

  // Student Access & Enrollments
  isStudentEnrolled(studentId: string, courseId: string): boolean {
    if (!studentId || !studentId.trim()) return false;
    const associatedIds = new Set(this.resolveAssociatedStudentIds(studentId));
    return this.enrollments.some(
      (e) =>
        (associatedIds.has(e.student_id) || associatedIds.has(normalizeStudentId(e.student_id))) &&
        e.course_id === courseId &&
        e.status === 'active'
    );
  }

  getStudentEnrollments(studentId: string) {
    if (!studentId || !studentId.trim()) return [];
    const associatedIds = new Set(this.resolveAssociatedStudentIds(studentId));
    return this.enrollments
      .filter(
        (e) =>
          (associatedIds.has(e.student_id) || associatedIds.has(normalizeStudentId(e.student_id))) &&
          e.status === 'active'
      )
      .map((enrollment) => {
        const course = this.getCourseById(enrollment.course_id);
        const batch = this.getBatchById(enrollment.batch_id);
        return {
          ...enrollment,
          course,
          batch,
        };
      });
  }

  getStudentOrders(studentId: string) {
    if (!studentId || !studentId.trim()) return [];
    const associatedIds = new Set(this.resolveAssociatedStudentIds(studentId));
    return this.orders
      .filter((o) => associatedIds.has(o.student_id) || associatedIds.has(normalizeStudentId(o.student_id)))
      .map((order) => {
        const course = this.getCourseById(order.course_id);
        const batch = this.getBatchById(order.batch_id);
        return {
          ...order,
          course,
          batch,
        };
      });
  }

  // Orders and Payments
  createOrder({
    studentId,
    courseId,
    batchId,
    amount,
    currency,
    gatewayOrderId,
  }: {
    studentId: string;
    courseId: string;
    batchId: string;
    amount: number;
    currency: string;
    gatewayOrderId: string;
  }): Order {
    const order: Order = {
      id: generateUUID(),
      student_id: studentId,
      course_id: courseId,
      batch_id: batchId,
      amount,
      currency,
      status: 'created',
      gateway_order_id: gatewayOrderId,
      created_at: new Date().toISOString(),
    };
    this.orders.unshift(order);
    return order;
  }

  verifyAndActivateEnrollment({
    gatewayOrderId,
    gatewayPaymentId,
    method = 'upi',
  }: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    method?: string;
  }): { success: boolean; enrollment?: Enrollment; order?: Order } {
    const orderIndex = this.orders.findIndex(
      (o) => o.gateway_order_id === gatewayOrderId
    );
    if (orderIndex === -1) {
      return { success: false };
    }

    const order = this.orders[orderIndex];
    order.status = 'paid';
    order.gateway_payment_id = gatewayPaymentId;

    // Record payment
    const payment: Payment = {
      id: generateUUID(),
      order_id: order.id,
      gateway_payment_id: gatewayPaymentId,
      amount: order.amount,
      currency: order.currency,
      method,
      status: 'captured',
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    this.payments.unshift(payment);

    // Prevent duplicate active enrollments
    const existingEnrollment = this.enrollments.find(
      (e) =>
        e.student_id === order.student_id &&
        e.course_id === order.course_id &&
        e.batch_id === order.batch_id
    );

    let enrollment: Enrollment;
    if (existingEnrollment) {
      existingEnrollment.status = 'active';
      existingEnrollment.order_id = order.id;
      enrollment = existingEnrollment;
    } else {
      enrollment = {
        id: generateUUID(),
        student_id: order.student_id,
        course_id: order.course_id,
        batch_id: order.batch_id,
        order_id: order.id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      };
      this.enrollments.unshift(enrollment);

      // Increment batch enrolled count
      const batch = this.batches.find((b) => b.id === order.batch_id);
      if (batch) {
        batch.enrolled_count += 1;
      }
    }

    return { success: true, enrollment, order };
  }

  // Webhook Idempotency
  isWebhookProcessed(gatewayEventId: string): boolean {
    return this.processedWebhookEvents.has(gatewayEventId);
  }

  markWebhookProcessed(gatewayEventId: string) {
    this.processedWebhookEvents.add(gatewayEventId);
  }

  // Lesson Progress
  toggleLessonProgress(studentId: string, lessonId: string): boolean {
    const existing = this.lessonProgress.find(
      (p) => p.student_id === studentId && p.lesson_id === lessonId
    );

    if (existing) {
      existing.completed = !existing.completed;
      existing.completed_at = existing.completed ? new Date().toISOString() : undefined;
      existing.updated_at = new Date().toISOString();
      return existing.completed;
    } else {
      this.lessonProgress.push({
        id: generateUUID(),
        student_id: studentId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return true;
    }
  }

  getStudentProgressForCourse(studentId: string, courseId: string) {
    const curriculum = this.getCurriculumForCourse(courseId);
    const allLessonIds = curriculum.flatMap((m) => m.lessons.map((l) => l.id));
    const completedLessonIds = new Set(
      this.lessonProgress
        .filter((p) => p.student_id === studentId && p.completed)
        .map((p) => p.lesson_id)
    );

    const completedCount = allLessonIds.filter((id) => completedLessonIds.has(id)).length;
    const totalCount = allLessonIds.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedCount,
      totalCount,
      percent,
      completedLessonIds: Array.from(completedLessonIds),
    };
  }

  // Admin Actions
  addCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) {
    const course: Course = {
      ...courseData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.courses.unshift(course);
    return course;
  }

  updateCourse(id: string, updates: Partial<Course>) {
    const course = this.courses.find((c) => c.id === id);
    if (!course) return null;
    Object.assign(course, updates, { updated_at: new Date().toISOString() });
    return course;
  }

  addBatch(batchData: Omit<Batch, 'id' | 'enrolled_count' | 'created_at'>) {
    const batch: Batch = {
      ...batchData,
      id: generateUUID(),
      enrolled_count: 0,
      created_at: new Date().toISOString(),
    };
    this.batches.unshift(batch);
    return batch;
  }

  addModule(courseId: string, title: string, description?: string) {
    const newModule: Module = {
      id: generateUUID(),
      course_id: courseId,
      title,
      description,
      sort_order: this.modules.filter((m) => m.course_id === courseId).length + 1,
      created_at: new Date().toISOString(),
    };
    this.modules.push(newModule);
    return newModule;
  }

  addLesson(lessonData: Omit<Lesson, 'id' | 'created_at'>) {
    const lesson: Lesson = {
      ...lessonData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.lessons.push(lesson);
    return lesson;
  }

  updateLesson(id: string, updates: Partial<Lesson>) {
    const lesson = this.lessons.find((l) => l.id === id);
    if (!lesson) return null;
    Object.assign(lesson, updates);
    return lesson;
  }

  deleteLesson(id: string) {
    const idx = this.lessons.findIndex((l) => l.id === id);
    if (idx >= 0) {
      this.lessons.splice(idx, 1);
      return true;
    }
    return false;
  }

  scheduleLiveClass(liveClassData: Omit<LiveClass, 'id' | 'created_at'>) {
    const liveClass: LiveClass = {
      ...liveClassData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.liveClasses.unshift(liveClass);
    return liveClass;
  }

  manualEnrollmentOverride({
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
  }) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A valid reason of at least 5 characters is required for audit logs');
    }

    const enrollmentIndex = this.enrollments.findIndex(
      (e) =>
        e.student_id === studentId &&
        e.course_id === courseId &&
        e.batch_id === batchId
    );

    if (action === 'grant') {
      if (enrollmentIndex >= 0) {
        this.enrollments[enrollmentIndex].status = 'active';
      } else {
        this.enrollments.unshift({
          id: generateUUID(),
          student_id: studentId,
          course_id: courseId,
          batch_id: batchId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        });
      }
    } else {
      if (enrollmentIndex >= 0) {
        this.enrollments[enrollmentIndex].status = 'revoked';
      }
    }

    // Log the audit event
    this.auditLogs.unshift({
      id: `al_${Date.now()}`,
      admin_id: adminId,
      action: action === 'grant' ? 'MANUAL_ACCESS_GRANTED' : 'MANUAL_ACCESS_REVOKED',
      target_user_id: studentId,
      target_resource: `course:${courseId},batch:${batchId}`,
      reason,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  // Dashboard Metrics
  getAdminMetrics() {
    const totalStudents = this.profiles.length;
    const publishedCourses = this.courses.filter((c) => c.published).length;
    const activeBatches = this.batches.filter((b) => b.enrollment_open).length;
    const activeEnrollments = this.enrollments.filter((e) => e.status === 'active').length;
    const totalRevenue = this.orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
    const upcomingLiveCount = this.liveClasses.filter(
      (lc) => lc.status === 'scheduled' || lc.status === 'live'
    ).length;

    return {
      totalStudents,
      publishedCourses,
      activeBatches,
      activeEnrollments,
      totalRevenue,
      upcomingLiveCount,
    };
  }

  // Site Settings Management
  getSettings(): SiteSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.settings = {
      ...this.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.auditLogs.unshift({
      id: `al_${Date.now()}`,
      admin_id: 'u0000000-0000-0000-0000-000000000002',
      action: 'SITE_SETTINGS_UPDATED',
      target_user_id: 'u0000000-0000-0000-0000-000000000002',
      target_resource: 'academy_settings',
      reason: 'Admin updated academy branding and contact details',
      created_at: new Date().toISOString(),
    });

    return { ...this.settings };
  }

  // Quiz Management
  getQuizzes(courseId?: string): Quiz[] {
    const list = courseId
      ? this.quizzes.filter((q) => q.course_id === courseId && q.published)
      : this.quizzes.filter((q) => q.published);

    return list.map((q) => {
      const course = this.getCourseById(q.course_id);
      const questions = this.quizQuestions.filter((qq) => qq.quiz_id === q.id);
      return {
        ...q,
        course,
        questions_count: questions.length,
      };
    });
  }

  getQuizById(id: string, sanitizeForStudent: boolean = false): (Quiz & { questions: QuizQuestion[] }) | null {
    const quiz = this.quizzes.find((q) => q.id === id);
    if (!quiz) return null;

    const course = this.getCourseById(quiz.course_id);
    const rawQuestions = this.quizQuestions
      .filter((qq) => qq.quiz_id === id)
      .sort((a, b) => a.question_number - b.question_number);

    let questions = sanitizeForStudent
      ? rawQuestions.map((q) => ({
          ...q,
          correct_option: '', // Sanitized: Never leak correct answer to browser during exam
          explanation: undefined, // Sanitized: Never leak explanation before submission
        }))
      : rawQuestions;

    if (sanitizeForStudent && quiz.randomize_questions) {
      questions = [...questions].sort(() => 0.5 - Math.random());
    }

    return {
      ...quiz,
      course,
      questions,
    };
  }

  addQuiz(
    quizData: Omit<Quiz, 'id' | 'created_at' | 'questions_count'>,
    questions: Omit<QuizQuestion, 'id' | 'quiz_id'>[]
  ): Quiz {
    const quizId = generateUUID();
    const newQuiz: Quiz = {
      ...quizData,
      id: quizId,
      status: quizData.status || (quizData.published ? 'published' : 'draft'),
      questions_count: questions.length,
      created_at: new Date().toISOString(),
    };
    this.quizzes.unshift(newQuiz);

    questions.forEach((q, idx) => {
      this.quizQuestions.push({
        ...q,
        id: generateUUID(),
        quiz_id: quizId,
        question_number: idx + 1,
      });
    });

    return newQuiz;
  }

  updateQuiz(id: string, updates: Partial<Quiz>): Quiz | null {
    const quiz = this.quizzes.find((q) => q.id === id);
    if (!quiz) return null;
    Object.assign(quiz, updates);
    if (updates.status) {
      quiz.published = updates.status === 'published';
    } else if (updates.published !== undefined) {
      quiz.status = updates.published ? 'published' : 'draft';
    }
    return quiz;
  }

  deleteQuiz(id: string): boolean {
    const idx = this.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    this.quizzes.splice(idx, 1);
    this.quizQuestions = this.quizQuestions.filter((qq) => qq.quiz_id !== id);
    return true;
  }

  submitQuizAttempt(data: {
    studentId: string;
    quizId: string;
    answers: Record<string, string>;
    timeTakenSeconds?: number;
  }): QuizAttempt {
    // Look up true quiz with secret answer keys
    const fullQuiz = this.getQuizById(data.quizId, false);
    if (!fullQuiz) {
      throw new Error('Quiz not found');
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let positiveMarks = 0;
    let negativeDeduction = 0;
    const attemptAnswers: any[] = [];

    const defaultNegative = Number(fullQuiz.negative_marking || 0);
    const marksPerQ = Number(fullQuiz.marks_per_question || 1);

    fullQuiz.questions.forEach((q) => {
      const chosen = data.answers[q.id];
      const qMarks = Number(q.marks || marksPerQ);
      const qNeg = Number(q.negative_marks !== undefined ? q.negative_marks : defaultNegative);

      if (!chosen || !chosen.trim()) {
        unansweredCount++;
        attemptAnswers.push({
          question_id: q.id,
          selected_option: '',
          is_correct: false,
          marks_awarded: 0,
        });
      } else if (chosen.trim().toUpperCase() === q.correct_option.trim().toUpperCase()) {
        correctCount++;
        positiveMarks += qMarks;
        attemptAnswers.push({
          question_id: q.id,
          selected_option: chosen.trim().toUpperCase(),
          is_correct: true,
          marks_awarded: qMarks,
        });
      } else {
        incorrectCount++;
        negativeDeduction += qNeg;
        attemptAnswers.push({
          question_id: q.id,
          selected_option: chosen.trim().toUpperCase(),
          is_correct: false,
          marks_awarded: -qNeg,
        });
      }
    });

    const calculatedScore = Math.max(0, Number((positiveMarks - negativeDeduction).toFixed(2)));
    const totalMarks = fullQuiz.total_marks || fullQuiz.questions.length * marksPerQ;
    const percentage = totalMarks > 0 ? Number(((calculatedScore / totalMarks) * 100).toFixed(1)) : 0;
    const passed = percentage >= (fullQuiz.passing_percentage || 40);

    const attempt: QuizAttempt = {
      id: generateUUID(),
      student_id: normalizeStudentId(data.studentId),
      quiz_id: data.quizId,
      score: calculatedScore,
      total_marks: totalMarks,
      percentage,
      passed,
      status: 'submitted',
      time_taken_seconds: data.timeTakenSeconds || 0,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      answers: data.answers,
      attempt_answers: attemptAnswers,
      started_at: new Date(Date.now() - (data.timeTakenSeconds || 900) * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      quiz: fullQuiz,
    };

    this.quizAttempts.unshift(attempt);
    return attempt;
  }

  getStudentQuizAttempts(studentId: string): QuizAttempt[] {
    const sId = normalizeStudentId(studentId);
    return this.quizAttempts
      .filter((a) => a.student_id === studentId || normalizeStudentId(a.student_id) === sId)
      .map((a) => {
        const quiz = this.getQuizById(a.quiz_id);
        return {
          ...a,
          quiz: quiz || undefined,
        };
      });
  }

  // Bookmarks
  getBookmarks(studentId: string): Bookmark[] {
    const sId = normalizeStudentId(studentId);
    return this.bookmarks.filter(
      (b) => b.student_id === studentId || normalizeStudentId(b.student_id) === sId
    );
  }

  addBookmark(data: Omit<Bookmark, 'id' | 'created_at'>): Bookmark {
    const existing = this.bookmarks.find(
      (b) =>
        (b.student_id === data.student_id ||
          normalizeStudentId(b.student_id) === normalizeStudentId(data.student_id)) &&
        b.resource_id === data.resource_id
    );
    if (existing) return existing;

    const bm: Bookmark = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.bookmarks.unshift(bm);
    return bm;
  }

  removeBookmark(studentId: string, resourceId: string): boolean {
    const sId = normalizeStudentId(studentId);
    const idx = this.bookmarks.findIndex(
      (b) =>
        (b.student_id === studentId || normalizeStudentId(b.student_id) === sId) &&
        b.resource_id === resourceId
    );
    if (idx >= 0) {
      this.bookmarks.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Doubts
  getDoubts(studentId?: string): StudentDoubt[] {
    if (studentId) {
      const sId = normalizeStudentId(studentId);
      return this.doubts.filter(
        (d) => d.student_id === studentId || normalizeStudentId(d.student_id) === sId
      );
    }
    return [...this.doubts];
  }

  addDoubt(data: Omit<StudentDoubt, 'id' | 'created_at' | 'status'>): StudentDoubt {
    const doubt: StudentDoubt = {
      ...data,
      id: generateUUID(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.doubts.unshift(doubt);
    return doubt;
  }

  answerDoubt(doubtId: string, answer: string, facultyName = 'Shekhar Sir'): StudentDoubt | null {
    const doubt = this.doubts.find((d) => d.id === doubtId);
    if (!doubt) return null;

    doubt.answer = answer;
    doubt.faculty_name = facultyName;
    doubt.status = 'answered';
    doubt.answered_at = new Date().toISOString();
    return doubt;
  }

  // Downloads
  getDownloads(studentId: string): DownloadedMaterial[] {
    const sId = normalizeStudentId(studentId);
    return this.downloads.filter(
      (dl) => dl.student_id === studentId || normalizeStudentId(dl.student_id) === sId
    );
  }

  recordDownload(data: Omit<DownloadedMaterial, 'id' | 'downloaded_at'>): DownloadedMaterial {
    const dl: DownloadedMaterial = {
      ...data,
      id: generateUUID(),
      downloaded_at: new Date().toISOString(),
    };
    this.downloads.unshift(dl);
    return dl;
  }
}

// Global Singleton for development & test state
const globalForDb = globalThis as unknown as { mockDb: MockDatabase };
export const db = globalForDb.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.mockDb = db;
