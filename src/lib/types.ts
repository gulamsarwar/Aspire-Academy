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
  created_at: string;
  updated_at: string;
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
  duration_minutes: number;
  material_path?: string;
  material_name?: string;
  sort_order: number;
  is_free_preview: boolean;
  published: boolean;
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
