'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import {
  getCourses,
  addCourseToDatabase,
  updateCourseInDatabase,
  addLessonToDatabase,
  addModuleToDatabase,
  addBatchToDatabase,
} from '@/lib/data/supabase-service';
import { Course } from '@/lib/types';
import { extractYouTubeVideoId } from '@/lib/youtube';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  Users,
  Edit,
  ExternalLink,
  Save,
  Check,
  Video,
  ClipboardPaste,
  Play,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  X,
  Clock,
  HelpCircle,
  Film,
} from 'lucide-react';

const PRESET_THUMBNAILS = [
  { label: 'Biology', url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', icon: '🧬' },
  { label: 'Physics', url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80', icon: '⚛️' },
  { label: 'Chemistry', url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80', icon: '🧪' },
  { label: 'Mathematics', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80', icon: '📐' },
  { label: 'Smart Classroom', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', icon: '🎓' },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([...db.courses]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [successToast, setSuccessToast] = useState('');

  // Fetch live courses from database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveCourses() {
      try {
        const liveCourses = await getCourses();
        if (liveCourses && liveCourses.length > 0 && isMounted) {
          setCourses(liveCourses);
        }
      } catch (err) {
        console.warn('Could not load courses from database:', err);
      }
    }
    loadLiveCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Course Created Success Dialog State
  const [createdSuccessCourse, setCreatedSuccessCourse] = useState<{
    course: Course;
    hasVideo: boolean;
    videoTitle?: string;
  } | null>(null);

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Bihar Board' | 'CBSE' | 'NEET' | 'Foundation'>('Bihar Board');
  const [newClass, setNewClass] = useState<'Class 12' | 'Class 11' | 'Class 10'>('Class 12');
  const [newPrice, setNewPrice] = useState(499);
  const [newOriginalPrice, setNewOriginalPrice] = useState(1499);
  const [newInstructor, setNewInstructor] = useState('Shekhar Sir');
  const [newDuration, setNewDuration] = useState(24);
  const [newThumbnail, setNewThumbnail] = useState('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80');
  const [newDescription, setNewDescription] = useState('Complete conceptual lectures, chapterwise notes, and high-yield board question practice.');
  const [newPublished, setNewPublished] = useState(true);

  // Video Link State inside "Create Course" Modal
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newIsFreePreview, setNewIsFreePreview] = useState(true);

  // Edit Course Form State
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editCategory, setEditCategory] = useState<'Bihar Board' | 'CBSE' | 'NEET' | 'Foundation'>('Bihar Board');
  const [editClass, setEditClass] = useState<'Class 12' | 'Class 11' | 'Class 10'>('Class 12');
  const [editPrice, setEditPrice] = useState(499);
  const [editOriginalPrice, setEditOriginalPrice] = useState(1499);
  const [editInstructor, setEditInstructor] = useState('Shekhar Sir');
  const [editDuration, setEditDuration] = useState(24);
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublished, setEditPublished] = useState(true);

  // Detected video IDs
  const detectedNewVideoId = extractYouTubeVideoId(newVideoUrl);

  // Robust Clipboard Paste for Mobile & Desktop
  const handlePasteToField = async (setter: (val: string) => void, fieldName: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setter(text.trim());
          setSuccessToast(`Pasted link into ${fieldName}!`);
          setTimeout(() => setSuccessToast(''), 2500);
          return;
        }
      }
      throw new Error('Clipboard empty or restricted');
    } catch {
      alert(`Clipboard permission required. Please tap and hold inside the "${fieldName}" box, then choose "Paste".`);
    }
  };

  const togglePublish = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const newPublishStatus = !course.published;
    const updated = await updateCourseInDatabase(courseId, { published: newPublishStatus });
    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, published: newPublishStatus } : c))
      );
      setSuccessToast(`Course status updated to ${newPublishStatus ? 'Published' : 'Draft'}.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // If user provided a YouTube video and thumbnail was left as default/empty, auto-set thumbnail from YouTube!
    let finalThumbnail = newThumbnail.trim();
    if (detectedNewVideoId && (!finalThumbnail || finalThumbnail.includes('unsplash.com/photo-1434030216411'))) {
      finalThumbnail = `https://img.youtube.com/vi/${detectedNewVideoId}/hqdefault.jpg`;
    }
    if (!finalThumbnail) {
      finalThumbnail = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
    }

    const created = await addCourseToDatabase({
      slug,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Comprehensive Board & Entrance Preparation',
      description: newDescription.trim() || 'Structured conceptual classes, NCERT line-by-line solutions and chapter tests.',
      category: newCategory,
      target_class: newClass,
      thumbnail_url: finalThumbnail,
      price: Number(newPrice),
      original_price: Number(newOriginalPrice),
      currency: 'INR',
      published: newPublished,
      featured: false,
      language: 'Hinglish',
      duration_weeks: Number(newDuration),
      instructor_name: newInstructor.trim() || 'Shekhar Sir',
      instructor_title: 'Senior Faculty',
      features: ['Full Syllabus Video Lectures', 'NCERT Handwritten Notes', 'Chapter PYQ Bank'],
    });

    let hasVideoAdded = false;
    let savedVideoTitle = '';

    // If YouTube video link was provided, auto-create Chapter 1 and Lesson 1!
    if (detectedNewVideoId) {
      try {
        const mod = await addModuleToDatabase(created.id, 'Chapter 1: Foundation & Core Concepts');
        savedVideoTitle = newLessonTitle.trim() || `${created.title} - Intro & Demo Lecture`;

        await addLessonToDatabase({
          module_id: mod.id,
          title: savedVideoTitle,
          description: 'Comprehensive introductory lecture, key chapter concepts, and syllabus walkthrough.',
          youtube_video_id: detectedNewVideoId,
          duration_minutes: 45,
          sort_order: 1,
          is_free_preview: newIsFreePreview,
          published: true,
        });

        hasVideoAdded = true;
      } catch (err) {
        console.error('Failed to auto-create first lesson:', err);
      }
    }

    // Auto-create a default active Batch so course is ready for student enrollment!
    try {
      await addBatchToDatabase({
        course_id: created.id,
        name: 'Target 2026-27 Batch',
        schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
        capacity: 150,
        enrollment_open: true,
        instructor_name: newInstructor.trim() || 'Shekhar Sir',
      });
    } catch (err) {
      console.warn('Could not auto-create batch:', err);
    }

    setCourses([created, ...courses]);
    setShowAddModal(false);

    // Reset Form Fields
    setNewTitle('');
    setNewSubtitle('');
    setNewVideoUrl('');
    setNewLessonTitle('');
    setNewThumbnail('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80');

    // Show celebratory post-creation dialog with clear next steps!
    setCreatedSuccessCourse({
      course: created,
      hasVideo: hasVideoAdded,
      videoTitle: savedVideoTitle,
    });
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditSubtitle(course.subtitle || '');
    setEditCategory((course.category as any) || 'Bihar Board');
    setEditClass((course.target_class as any) || 'Class 12');
    setEditPrice(course.price);
    setEditOriginalPrice(course.original_price);
    setEditInstructor(course.instructor_name);
    setEditDuration(course.duration_weeks);
    setEditThumbnail(course.thumbnail_url);
    setEditDescription(course.description || '');
    setEditPublished(course.published);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const updated = await updateCourseInDatabase(editingCourse.id, {
      title: editTitle,
      subtitle: editSubtitle,
      category: editCategory,
      target_class: editClass,
      price: Number(editPrice),
      original_price: Number(editOriginalPrice),
      instructor_name: editInstructor,
      duration_weeks: Number(editDuration),
      thumbnail_url: editThumbnail,
      description: editDescription,
      published: editPublished,
    });

    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updated } : c))
      );
      setEditingCourse(null);
      setSuccessToast(`Course "${editTitle}" updated successfully.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  // Calculate totals
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.published).length;
  const totalLessonsInAllCourses = courses.reduce((acc, c) => {
    return acc + db.getCurriculumForCourse(c.id).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Aspire Academy LMS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Course & Video Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Create courses, paste YouTube video links, set pricing, and manage batches.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-lg shadow-blue-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Course</span>
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900">{totalCourses}</div>
            <div className="text-[11px] text-slate-500 font-bold">Total Courses ({publishedCourses} Active)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900">{totalLessonsInAllCourses}</div>
            <div className="text-[11px] text-slate-500 font-bold">Total Video Lessons</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-black text-[#046BD2]">Want to add video to existing course?</div>
            <div className="text-[11px] text-slate-600">Click &ldquo;Manage Lessons&rdquo; on any course below</div>
          </div>
          <Link
            href="/admin/lessons"
            className="px-3 py-1.5 rounded-xl bg-[#046BD2] text-white font-bold text-xs whitespace-nowrap shadow-sm hover:bg-[#0352A0]"
          >
            Open Lessons →
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 📱 MOBILE COURSE CARDS VIEW (Visible on mobile screens < 768px for supreme touch experience) */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            All Courses ({courses.length})
          </h2>
          <span className="text-[11px] text-slate-400">Tap below to manage videos</span>
        </div>

        {courses.map((course) => {
          const batches = db.getBatchesForCourse(course.id);
          const curriculum = db.getCurriculumForCourse(course.id);
          const totalLessons = curriculum.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

          return (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3.5 hover:shadow-md transition"
            >
              {/* Top Row: Thumbnail + Info */}
              <div className="flex items-start gap-3">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-slate-200 bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#046BD2]">
                      {course.target_class}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {course.category}
                    </span>
                    {course.published ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        ✓ Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        Draft
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                    <span>{course.instructor_name}</span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{course.price.toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-400 line-through font-normal ml-1">
                        ₹{course.original_price.toLocaleString('en-IN')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Lessons Status Banner */}
              <div
                className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
                  totalLessons > 0
                    ? 'bg-blue-50/70 border border-blue-200/60 text-blue-900'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <Video className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                  <span>
                    {totalLessons > 0
                      ? `${totalLessons} Video Lectures Uploaded`
                      : '⚠️ No Videos Yet (Paste link now)'}
                  </span>
                </div>
                <Link
                  href={`/admin/lessons?courseId=${course.id}`}
                  className="text-xs font-black text-[#046BD2] hover:underline"
                >
                  {totalLessons > 0 ? 'Manage →' : '+ Add Video'}
                </Link>
              </div>

              {/* Primary Mobile Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Large High-Visibility Button to Paste Video Links & Manage Curriculum */}
                <Link
                  href={`/admin/lessons?courseId=${course.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
                >
                  <Video className="w-4 h-4" />
                  <span>🎬 Manage Lessons & Paste Video Links</span>
                </Link>

                {/* 2. Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/batches?courseId=${course.id}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Batches ({batches.length})</span>
                  </Link>

                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>

              {/* Bottom Preview & Status Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <a
                  href={`/courses/${course.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Student View Preview</span>
                </a>

                <button
                  onClick={() => togglePublish(course.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    course.published
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {course.published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💻 DESKTOP COURSES TABLE (Visible on screens >= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Course Info</th>
                <th className="px-6 py-4">Class & Board</th>
                <th className="px-6 py-4">Price (INR)</th>
                <th className="px-6 py-4">Video Lessons</th>
                <th className="px-6 py-4">Batches</th>
                <th className="px-6 py-4">Catalog Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => {
                const batches = db.getBatchesForCourse(course.id);
                const curriculum = db.getCurriculumForCourse(course.id);
                const totalLessons = curriculum.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

                return (
                  <tr key={course.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                        />
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900 text-sm max-w-xs truncate">
                            {course.title}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Faculty: {course.instructor_name} • {course.duration_weeks} wks
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">
                        {course.target_class}
                      </span>
                      <span className="text-[10px] text-slate-500">{course.category}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900 text-sm block">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{course.original_price.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/lessons?courseId=${course.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                          totalLessons > 0
                            ? 'bg-blue-50 text-[#046BD2] border-blue-200 hover:bg-blue-100'
                            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                        }`}
                        title="Click to view lessons and paste YouTube video links"
                      >
                        <Video className="w-3.5 h-3.5 text-[#046BD2]" />
                        <span>{totalLessons > 0 ? `${totalLessons} Lessons` : '+ Add Video'}</span>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/batches?courseId=${course.id}`}
                        className="font-bold text-slate-800 hover:text-[#046BD2] hover:underline"
                      >
                        {batches.length} Batches
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      {course.published ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <XCircle className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end flex-wrap gap-1.5">
                        {/* 1. Manage Lessons */}
                        <Link
                          href={`/admin/lessons?courseId=${course.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#046BD2] text-white hover:bg-[#0352A0] transition shadow-sm"
                          title="Manage curriculum and paste video links"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Lessons</span>
                        </Link>

                        {/* 2. Manage Batches */}
                        <Link
                          href={`/admin/batches?courseId=${course.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          title="View and configure batches for this course"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Batches</span>
                        </Link>

                        {/* 3. Edit Course */}
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          title="Edit course metadata"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* 4. View Student Preview */}
                        <a
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Open public course catalog preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* 5. Publish Toggle */}
                        <button
                          onClick={() => togglePublish(course.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            course.published
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {course.published ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 ADD COURSE MODAL (Includes Direct Video Link Pasting + Preset Thumbnails) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Create New Course</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter details and paste your introductory video lecture link below.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              {/* 1. Course Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Course Title <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">e.g. Class 12 Biology</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 12 Biology — Complete Board & NEET Preparation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#046BD2] font-semibold text-slate-900"
                />
              </div>

              {/* 2. Short Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Full Syllabus, Chapter PYQs & NCERT Line-by-Line"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              {/* 3. Board & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Board / Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="Bihar Board">Bihar Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="NEET">NEET</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Class</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="Class 12">Class 12</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                </div>
              </div>

              {/* 4. Price & Original Price */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Course Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"
                  />
                </div>
              </div>

              {/* 5. Faculty & Duration */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lead Faculty</label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* 🌟 6. DIRECT YOUTUBE VIDEO LINK PASTING SECTION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-white to-blue-50/90 border-2 border-rose-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>Course Video / YouTube Lecture Link</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase">
                          Demo Lecture
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Paste any YouTube video link here. It will automatically create Chapter 1 & Lesson 1!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paste URL Input & Paste Button */}
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 text-xs font-mono font-medium focus:outline-none bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setNewVideoUrl, 'Video Link')}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition active:scale-95 whitespace-nowrap"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>📋 Paste Link</span>
                  </button>
                </div>

                {/* Quick Test Sample Links */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">Quick Test Link:</span>
                  <button
                    type="button"
                    onClick={() => setNewVideoUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk')}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                  >
                    ⚡ Biology Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVideoUrl('https://www.youtube.com/watch?v=kJQP7kiw5Fk')}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                  >
                    ⚡ Physics Demo
                  </button>
                  <Link
                    href="/admin/lessons"
                    target="_blank"
                    className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#046BD2] hover:underline font-bold ml-auto flex items-center gap-1"
                  >
                    <span>Full Curriculum Manager →</span>
                  </Link>
                </div>

                {/* Video Detection Confirmation Box */}
                {detectedNewVideoId && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-900">
                          ✓ Valid YouTube Video Detected!
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        ID: {detectedNewVideoId}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={`https://img.youtube.com/vi/${detectedNewVideoId}/mqdefault.jpg`}
                        alt="Preview"
                        className="w-20 h-12 object-cover rounded-lg border border-emerald-200 shadow-sm"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          placeholder="Lesson Title (e.g. Chapter 1: Introduction)"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg border border-emerald-300 text-xs bg-white text-slate-800 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewThumbnail(`https://img.youtube.com/vi/${detectedNewVideoId}/hqdefault.jpg`);
                            setSuccessToast('YouTube thumbnail copied to Course Thumbnail!');
                            setTimeout(() => setSuccessToast(''), 2500);
                          }}
                          className="text-[10px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>⚡ Use as Course Thumbnail Image</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="newIsFreePreview"
                        checked={newIsFreePreview}
                        onChange={(e) => setNewIsFreePreview(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#046BD2] rounded border-slate-300"
                      />
                      <label htmlFor="newIsFreePreview" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                        ⭐ Free Demo Preview Lecture (Students can watch before purchasing)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Thumbnail URL + 1-Click Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Course Thumbnail URL</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setNewThumbnail, 'Thumbnail URL')}
                    className="text-[11px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste URL</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newThumbnail}
                    onChange={(e) => setNewThumbnail(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                  />
                  {newThumbnail && (
                    <img
                      src={newThumbnail}
                      alt="Thumbnail Preview"
                      className="w-10 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                  )}
                </div>

                {/* 1-Click Thumbnail Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                  {PRESET_THUMBNAILS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewThumbnail(preset.url)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                        newThumbnail === preset.url
                          ? 'bg-blue-50 text-[#046BD2] border-[#046BD2]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.icon} {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. Course Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Description</label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive description of what students will learn..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              {/* 9. Publish Immediately */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newPublishedCheckbox"
                  checked={newPublished}
                  onChange={(e) => setNewPublished(e.target.checked)}
                  className="w-4 h-4 text-[#046BD2] rounded border-slate-300"
                />
                <label htmlFor="newPublishedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publish immediately to student catalog
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-md shadow-blue-500/25 flex items-center gap-2 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎉 POST-CREATION CELEBRATION MODAL (Guides user seamlessly to video lessons / batches) */}
      {createdSuccessCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Course Created Successfully! 🎉
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#046BD2]">
                {createdSuccessCourse.course.title}
              </p>
              {createdSuccessCourse.hasVideo ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  ✓ First Video Lecture &amp; Free Demo Lesson attached and published!
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  Course details saved. Now paste your video links below to add lecture content!
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href={`/admin/lessons?courseId=${createdSuccessCourse.course.id}`}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-[#046BD2] hover:bg-[#0352A0] text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>🎬 Add / Manage Video Lessons Now</span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/batches?courseId=${createdSuccessCourse.course.id}`}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Configure Batches</span>
                </Link>

                <a
                  href={`/courses/${createdSuccessCourse.course.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Student Page</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setCreatedSuccessCourse(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 transition"
              >
                Done (Stay on Courses Page)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Course</h3>
                <p className="text-xs text-slate-500">
                  Update course details, pricing, and thumbnail.
                </p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Link to Manage Lessons for this course */}
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#046BD2]" />
                <span className="text-xs font-bold text-blue-900">Manage Video Lessons &amp; YouTube Links</span>
              </div>
              <Link
                href={`/admin/lessons?courseId=${editingCourse.id}`}
                className="px-3 py-1 rounded-xl bg-[#046BD2] text-white font-bold text-xs hover:bg-[#0352A0]"
              >
                Open Lessons →
              </Link>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Subtitle</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Board / Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="Bihar Board">Bihar Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="NEET">NEET</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Class</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="Class 12">Class 12</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Course Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lead Faculty</label>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Thumbnail URL</label>
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setEditThumbnail, 'Thumbnail URL')}
                    className="text-[11px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste URL</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editThumbnail}
                    onChange={(e) => setEditThumbnail(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  {editThumbnail && (
                    <img
                      src={editThumbnail}
                      alt=""
                      className="w-10 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPublishedCheckbox"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                  className="w-4 h-4 text-[#046BD2] rounded border-slate-300"
                />
                <label htmlFor="editPublishedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Published in public student catalog
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
