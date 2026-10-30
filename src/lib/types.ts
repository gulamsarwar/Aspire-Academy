export type UserRoleType = 'student' | 'admin' | 'instructor';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role: UserRoleType;
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'Bihar Board' | 'CBSE' | 'NEET' | 'JEE' | 'Foundation';
  target_class: 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12' | 'Repeater/Dropper';
  thumbnail_url: string;
  thumbnail_r2_key?: string;
  price: number;
  original_price: number;
  currency: string;
  published: boolean;
  featured: boolean;
  language: string;
  duration_weeks: number;
  instructor_name: string;
  instructor_title: string;
  instructor_avatar?: string;
  features: string[];
  total_lectures?: number;
  created_at: string;
  updated_at: string;
  modules?: Module[];
}

export interface Batch {
  id: string;
  course_id: string;
  name: string;
  schedule_description: string;
  start_at: string;
  end_at: string;
  capacity: number;
  enrolled_count: number;
  enrollment_open: boolean;
  instructor_name?: string;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  video_source_type?: 'youtube' | 'r2';
  r2_object_key?: string;
  video_url?: string;
  duration_minutes: number;
  material_path?: string;
  material_name?: string;
  sort_order: number;
  is_free_preview: boolean;
  published: boolean;
  quiz_id?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  batch_id: string;
  order_id?: string;
  status: 'active' | 'revoked' | 'expired';
  enrolled_at: string;
  expires_at?: string;
  course?: Course;
  batch?: Batch;
}

export interface Order {
  id: string;
  student_id: string;
  course_id: string;
  batch_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  gateway_order_id: string;
  gateway_payment_id?: string;
  created_at: string;
  course?: Course;
  batch?: Batch;
  student?: Profile;
}

export interface Payment {
  id: string;
  order_id: string;
  gateway_payment_id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'captured' | 'failed' | 'refunded';
  verified_at?: string;
  created_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  batch_id: string;
  title: string;
  description: string;
  youtube_live_url: string;
  youtube_video_id: string;
  instructor_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_at: string;
  course?: Course;
  batch?: Batch;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  course_id?: string;
  batch_id?: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'urgent';
  published_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string;
  target_resource: string;
  reason: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SiteSettings {
  academy_name: string;
  tagline: string;
  description: string;
  lead_faculty: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  office_hours: string;
  announcement_tag: string;
  announcement_text: string;
  announcement_active: boolean;
  stat_students: string;
  stat_experience: string;
  stat_success: string;
  hero_headline: string;
  hero_subheadline: string;
  updated_at: string;
}

export interface QuizOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  key?: string; // 'A' | 'B' | 'C' | 'D' (alias)
  text: string;
  order_index?: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id?: string;
  question_number: number;
  question_text: string;
  question_type?: 'mcq' | 'single_choice' | 'numerical';
  options: QuizOption[];
  correct_option: string; // 'A' | 'B' | 'C' | 'D'
  explanation?: string;
  subject?: string;
  marks?: number;
  negative_marks?: number;
  image_url?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  batch_id?: string;
  chapter_id?: string;
  lesson_id?: string;
  title: string;
  description: string;
  subject?: string;
  target_class?: string;
  duration_minutes: number;
  total_marks: number;
  marks_per_question?: number;
  negative_marking?: number;
  passing_percentage: number;
  attempt_limit?: number;
  instructions?: string;
  randomize_questions?: boolean;
  published: boolean;
  status?: 'draft' | 'published' | 'archived';
  questions_count: number;
  created_at: string;
  course?: Course;
  questions?: QuizQuestion[];
}

export interface QuizAttemptAnswer {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  marks_awarded: number;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  status?: 'in_progress' | 'submitted' | 'auto_submitted' | 'timed_out';
  time_taken_seconds?: number;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
  answers: Record<string, string>; // questionId -> chosenOption
  attempt_answers?: QuizAttemptAnswer[];
  started_at: string;
  completed_at: string;
  quiz?: Quiz;
}

export interface Bookmark {
  id: string;
  student_id: string;
  resource_type: 'lesson' | 'note' | 'question' | 'live';
  resource_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface StudentDoubt {
  id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_title?: string;
  question: string;
  image_url?: string;
  status: 'pending' | 'answered';
  answer?: string;
  faculty_name?: string;
  created_at: string;
  answered_at?: string;
}

export interface DownloadedMaterial {
  id: string;
  student_id: string;
  lesson_id?: string;
  title: string;
  file_name: string;
  file_size?: string;
  downloaded_at: string;
}

