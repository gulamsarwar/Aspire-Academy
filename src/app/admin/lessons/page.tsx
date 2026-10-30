'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { getCourses, addLessonToDatabase, updateLessonInDatabase, deleteLessonFromDatabase } from '@/lib/data/supabase-service';
import { Course, Lesson, Module } from '@/lib/types';
import {
  FileText,
  Plus,
  Video,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ClipboardPaste,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  BookOpen,
  Award,
  FolderPlus,
  HelpCircle,
  Upload,
  Paperclip,
  Sparkles,
} from 'lucide-react';

import { extractYouTubeVideoId } from '@/lib/youtube';
import { YouTubePlayer } from '@/components/ui/YouTubePlayer';
import { R2MediaUpload } from '@/components/admin/R2MediaUpload';

export default function AdminLessonsPage() {
  const [courses, setCourses] = useState<Course[]>([...db.courses]);
  const [selectedCourseId, setSelectedCourseId] = useState(db.courses[0]?.id || '');

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  const [lessons, setLessons] = useState<Lesson[]>([...db.lessons]);
  const [successToast, setSuccessToast] = useState('');

  // Primary Add Lesson Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'youtube' | 'r2'>('youtube');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [r2ObjectKey, setR2ObjectKey] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [materialName, setMaterialName] = useState('');
  const [lessonOrder, setLessonOrder] = useState(1);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [attachedQuizId, setAttachedQuizId] = useState('');

  // New Chapter Inline Modal/State
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Edit Existing Lesson Modal State
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editModuleId, setEditModuleId] = useState('');
  const [editVideoSourceType, setEditVideoSourceType] = useState<'youtube' | 'r2'>('youtube');
  const [editYoutubeLink, setEditYoutubeLink] = useState('');
  const [editR2ObjectKey, setEditR2ObjectKey] = useState('');
  const [editDuration, setEditDuration] = useState(45);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editLessonOrder, setEditLessonOrder] = useState(1);
  const [editFreePreview, setEditFreePreview] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [editQuizId, setEditQuizId] = useState('');

  // Load live courses from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadLiveCourses() {
      try {
        const res = await fetch('/api/admin/courses');
        if (res.ok) {
          const data = await res.json();
          if (data.courses && Array.isArray(data.courses) && data.courses.length > 0 && isMounted) {
            setCourses(data.courses);
            return;
          }
        }
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

  // Handle URL query parameter ?courseId=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('courseId');
      if (cid && courses.some((c) => c.id === cid)) {
        setSelectedCourseId(cid);
      }
    }
  }, [courses]);

  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [materialPath, setMaterialPath] = useState('');
  const [editMaterialPath, setEditMaterialPath] = useState('');

  // Fetch live modules and lessons from database when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    let isMounted = true;
    async function fetchCourseData() {
      try {
        const res = await fetch(`/api/admin/lessons?courseId=${encodeURIComponent(selectedCourseId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.modules && Array.isArray(data.modules)) {
              setModules(data.modules);
              if (data.modules.length > 0) {
                setSelectedModuleId(data.modules[0].id);
              } else {
                setSelectedModuleId('');
              }
            }
            if (data.lessons && Array.isArray(data.lessons)) {
              setLessons((prev) => {
                const currentModIds = new Set((data.modules || []).map((m: any) => m.id));
                const retained = prev.filter((l) => !currentModIds.has(l.module_id));
                return [...retained, ...data.lessons];
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not load lessons from database:', err);
      }
    }
    fetchCourseData();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  // Current selected course object
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Lessons for currently selected course
  const currentLessons = lessons.filter((l) => {
    const parentModule = modules.find((m) => m.id === l.module_id) || db.modules.find((m) => m.id === l.module_id);
    return parentModule?.course_id === selectedCourseId;
  });

  // Automatically update lesson order suggested for new lesson
  useEffect(() => {
    setLessonOrder(currentLessons.length + 1);
  }, [currentLessons.length, selectedCourseId]);

  // Available quizzes for this course
  const availableQuizzes = db.quizzes.filter(
    (q) => !q.course_id || q.course_id === selectedCourseId
  );

  const extractVideoId = (input: string): string => {
    return extractYouTubeVideoId(input) || '';
  };

  const detectedVideoId = extractVideoId(youtubeVideoId);
  const editDetectedVideoId = extractVideoId(editYoutubeLink);

  const handleUploadPdf = async (file: File, isEdit = false) => {
    try {
      setIsUploadingPdf(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      const res = await fetch('/api/admin/notes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload PDF file.');
      }

      if (isEdit) {
        setEditMaterialPath(data.material_path);
        setEditMaterialName(data.material_name);
      } else {
        setMaterialPath(data.material_path);
        setMaterialName(data.material_name);
      }
      setSuccessToast(`PDF "${data.material_name}" uploaded successfully!`);
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err: any) {
      alert(err.message || 'PDF upload failed.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Paste from clipboard handlers with mobile touch awareness
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setYoutubeVideoId(text.trim());
          setSuccessToast('YouTube video link pasted from clipboard!');
          setTimeout(() => setSuccessToast(''), 2500);
          return;
        }
      }
      throw new Error('Clipboard restricted');
    } catch {
      alert('Clipboard access restricted by browser. Please tap and hold inside the YouTube URL box and select "Paste".');
    }
  };

  const handlePasteEditClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setEditYoutubeLink(text.trim());
          setSuccessToast('YouTube video link pasted from clipboard!');
          setTimeout(() => setSuccessToast(''), 2500);
          return;
        }
      }
      throw new Error('Clipboard restricted');
    } catch {
      alert('Clipboard access restricted by browser. Please tap and hold inside the YouTube URL box and select "Paste".');
    }
  };

  // Add a new Chapter / Module directly to Supabase
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_chapter',
          course_id: selectedCourseId,
          title: newChapterTitle.trim(),
          sort_order: modules.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create chapter in database.');

      if (data.module) {
        setModules((prev) => [...prev, data.module]);
        setSelectedModuleId(data.module.id);
        setNewChapterTitle('');
        setShowAddChapter(false);
        setSuccessToast(`Chapter "${data.module.title}" created in database!`);
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create chapter.');
    }
  };

  // Create & Save Lesson with YouTube or Cloudflare R2
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanVideoId = '';
    if (videoSourceType === 'youtube') {
      cleanVideoId = extractVideoId(youtubeVideoId);
      if (!title.trim() || !cleanVideoId) {
        alert('Please enter a lesson title and a valid YouTube video link or ID.');
        return;
      }
    } else {
      if (!title.trim() || !r2ObjectKey) {
        alert('Please enter a lesson title and upload a video file to Cloudflare R2.');
        return;
      }
    }

    let targetModuleId = selectedModuleId;
    if (!targetModuleId) {
      // Auto-create a default chapter in database if course has none yet
      try {
        const resMod = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_chapter',
            course_id: selectedCourseId,
            title: 'Chapter 1: Core Concepts & Introduction',
            sort_order: 1,
          }),
        });
        const mData = await resMod.json();
        if (mData.module) {
          setModules((prev) => [...prev, mData.module]);
          targetModuleId = mData.module.id;
          setSelectedModuleId(mData.module.id);
        }
      } catch {}
    }

    if (!targetModuleId) {
      targetModuleId = db.addModule(selectedCourseId, 'Chapter 1: Core Concepts & Introduction').id;
    }

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_lesson',
          module_id: targetModuleId,
          title: title.trim(),
          description: description.trim() || 'Conceptual lecture and practice walkthrough.',
          youtube_video_id: cleanVideoId,
          video_source_type: videoSourceType,
          r2_object_key: r2ObjectKey || undefined,
          duration_minutes: Number(durationMinutes) || 45,
          material_path: materialPath || (materialName ? `/notes/${materialName.toLowerCase().replace(/\s+/g, '-')}` : null),
          material_name: materialName.trim() || null,
          sort_order: Number(lessonOrder) || currentLessons.length + 1,
          is_free_preview: isFreePreview,
          published: isPublished,
          quiz_id: attachedQuizId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save lesson in database.');

      if (data.lesson) {
        setLessons((prev) => [...prev, data.lesson]);
        setTitle('');
        setDescription('');
        setYoutubeVideoId('');
        setR2ObjectKey('');
        setMaterialName('');
        setMaterialPath('');
        setAttachedQuizId('');
        setIsFreePreview(false);
        setSuccessToast(`Lesson "${data.lesson.title}" saved to database!`);
        setTimeout(() => setSuccessToast(''), 4500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson.');
    }
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description || '');
    setEditModuleId(lesson.module_id);
    setEditVideoSourceType(lesson.video_source_type || 'youtube');
    setEditR2ObjectKey(lesson.r2_object_key || '');
    setEditYoutubeLink(lesson.youtube_video_id ? `https://www.youtube.com/watch?v=${lesson.youtube_video_id}` : '');
    setEditDuration(lesson.duration_minutes);
    setEditMaterialName(lesson.material_name || '');
    setEditMaterialPath(lesson.material_path || '');
    setEditLessonOrder(lesson.sort_order);
    setEditFreePreview(lesson.is_free_preview);
    setEditPublished(lesson.published);
    setEditQuizId(lesson.quiz_id || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    let cleanVideoId = '';
    if (editVideoSourceType === 'youtube') {
      cleanVideoId = extractVideoId(editYoutubeLink);
      if (!editTitle.trim() || !cleanVideoId) {
        alert('Please provide a lesson title and valid YouTube link.');
        return;
      }
    } else {
      if (!editTitle.trim() || !editR2ObjectKey) {
        alert('Please provide a lesson title and upload or retain the Cloudflare R2 video.');
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLesson.id,
          title: editTitle.trim(),
          description: editDescription.trim(),
          module_id: editModuleId || editingLesson.module_id,
          youtube_video_id: cleanVideoId,
          video_source_type: editVideoSourceType,
          r2_object_key: editR2ObjectKey || undefined,
          duration_minutes: Number(editDuration) || 45,
          sort_order: Number(editLessonOrder) || 1,
          is_free_preview: editFreePreview,
          published: editPublished,
          material_name: editMaterialName.trim() || null,
          material_path: editMaterialPath || (editMaterialName ? `/notes/${editMaterialName.toLowerCase().replace(/\s+/g, '-')}` : null),
          quiz_id: editQuizId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lesson.');

      setLessons((prev) =>
        prev.map((l) =>
          l.id === editingLesson.id
            ? { ...l, ...data.updated }
            : l
        )
      );
      setEditingLesson(null);
      setSuccessToast(`Lesson "${editTitle}" updated in database!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update lesson.');
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete lesson "${lessonTitle}"?`)) {
      try {
        const res = await fetch(`/api/admin/lessons?id=${encodeURIComponent(lessonId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete lesson.');

        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
        setSuccessToast(`Lesson "${lessonTitle}" removed from database.`);
        setTimeout(() => setSuccessToast(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Failed to delete lesson.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1.5 text-[#046BD2] hover:underline font-extrabold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Course Management</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-extrabold truncate max-w-sm">
              {currentCourse?.title || 'Manage Lessons'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Manage Lessons & Video Content
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Add YouTube video links, study notes, and quizzes to lessons for this specific course.
          </p>
        </div>

        {/* Course Switcher */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap pl-2">
            Course:
          </span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:border-[#046BD2] max-w-xs truncate"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 🚀 CENTRALIZED "ADD LESSON & VIDEO LINK" FORM FOR CURRENT COURSE */}
      <div className="bg-white rounded-3xl border-2 border-blue-500/25 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{currentCourse?.title}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#046BD2]" />
              <span>Add New Lesson</span>
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Lessons will appear in student dashboard for this course
          </span>
        </div>

        <form onSubmit={handleCreateLesson} className="space-y-6">
          {/* Chapter / Module & Lesson Title Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Subject / Chapter (Module) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddChapter(!showAddChapter)}
                  className="text-[11px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{showAddChapter ? 'Cancel' : '+ Add New Chapter'}</span>
                </button>
              </div>

              {showAddChapter ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter new chapter name (e.g. Chapter 2: Electrostatics)"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#046BD2] text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateChapter}
                    className="px-3 py-2 rounded-xl bg-[#046BD2] text-white font-bold text-xs hover:bg-[#0352A0]"
                  >
                    Save Chapter
                  </button>
                </div>
              ) : (
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:border-[#046BD2]"
                >
                  {modules.length === 0 ? (
                    <option value="">No chapters created yet (will auto-create Chapter 1)</option>
                  ) : (
                    modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lesson 1: Introduction & Fundamental Principles"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
              />
            </div>
          </div>

          {/* Dedicated Video Source Selector: Option A (YouTube) or Option B (Cloudflare R2) */}
          <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-400/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#046BD2]" />
                <span>Video Source Option <span className="text-red-500">*</span></span>
              </span>

              {/* Source Option Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setVideoSourceType('youtube')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${videoSourceType === 'youtube'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Option A — 🎬 YouTube Link
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSourceType('r2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${videoSourceType === 'r2'
                      ? 'bg-[#046BD2] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Option B — ☁️ Cloudflare R2
                </button>
              </div>
            </div>

            {/* Option A: YouTube Link Input */}
            {videoSourceType === 'youtube' ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Paste YouTube Video URL here (e.g. https://www.youtube.com/watch?v=...)"
                      value={youtubeVideoId}
                      onChange={(e) => setYoutubeVideoId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-blue-300 focus:border-[#046BD2] text-sm font-mono focus:outline-none bg-white font-semibold text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow transition whitespace-nowrap"
                    title="Paste link directly from your clipboard"
                  >
                    <ClipboardPaste className="w-4 h-4 text-white" />
                    <span>📋 Paste Link</span>
                  </button>
                </div>

                {/* Quick Test Links */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Quick Test Link:</span>
                  <button
                    type="button"
                    onClick={() => setYoutubeVideoId('https://www.youtube.com/watch?v=kJQP7kiw5Fk')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                  >
                    ⚡ Sample Physics Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setYoutubeVideoId('https://youtu.be/3JZ_D3ELwOQ')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                  >
                    ⚡ Sample Chemistry Link
                  </button>
                </div>

                {/* Video Player Preview if valid ID */}
                {detectedVideoId && detectedVideoId.length >= 6 ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 mt-3 animate-in fade-in space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="text-xs sm:text-sm font-black text-emerald-900 block">
                            ✓ Valid YouTube Video Link Detected!
                          </span>
                          <span className="text-[11px] text-emerald-700 font-mono font-semibold">
                            Video ID: {detectedVideoId}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`https://www.youtube.com/watch?v=${detectedVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-sm"
                      >
                        <span>Open in YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-lg border border-emerald-300 bg-black">
                      <YouTubePlayer
                        url={detectedVideoId}
                        title={title || 'Lesson Video Preview'}
                        autoPlay={false}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Option B: Cloudflare R2 Upload */
              <div className="space-y-3">
                <R2MediaUpload
                  type="video"
                  resourceId={selectedCourseId}
                  currentValue={r2ObjectKey}
                  onSuccess={({ key }) => {
                    setR2ObjectKey(key);
                    setSuccessToast('Private video uploaded to Cloudflare R2 successfully!');
                    setTimeout(() => setSuccessToast(''), 4000);
                  }}
                />

                {r2ObjectKey && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-700 truncate max-w-sm">
                      Key: {r2ObjectKey}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      R2 Linked
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Lesson Description</label>
            <textarea
              rows={2}
              placeholder="What topics are covered in this video lecture..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
            />
          </div>

          {/* PDF / Notes Attachment Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#046BD2]" />
                <span>PDF Study Material & Chapter Notes</span>
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition">
                {isUploadingPdf ? <Loader2 className="w-3.5 h-3.5 text-[#046BD2] animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#046BD2]" />}
                <span>{isUploadingPdf ? 'Uploading...' : 'Browse PDF File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  disabled={isUploadingPdf}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleUploadPdf(f, false);
                    }
                  }}
                />
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type material name or select a preset below (e.g. NCERT Chapter Handout.pdf)..."
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#046BD2]"
              />
              {materialName && (
                <button
                  type="button"
                  onClick={() => setMaterialName('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick-Pick Popular Handout Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Presets:
              </span>
              {[
                'NCERT Chapter Handout & Color Diagrams.pdf',
                'High-Yield Derivation & Formula Sheet.pdf',
                'Previous 10-Years Solved PYQ Bank.pdf',
                '50% Objective Question Matrix.pdf',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaterialName(preset)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#046BD2] hover:text-[#046BD2] text-slate-600 transition shadow-2xs"
                >
                  + {preset.replace('.pdf', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Additional details: Duration, Order, Free preview, Publish status, Attached Quiz */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lesson Order / Number</label>
              <input
                type="number"
                value={lessonOrder}
                onChange={(e) => setLessonOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Access Mode</label>
              <select
                value={isFreePreview ? 'yes' : 'no'}
                onChange={(e) => setIsFreePreview(e.target.value === 'yes')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="no">🔒 Enrolled Students Only</option>
                <option value="yes">⭐ Free Demo Preview Allowed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Publication Status</label>
              <select
                value={isPublished ? 'published' : 'draft'}
                onChange={(e) => setIsPublished(e.target.value === 'published')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="published">✓ Published</option>
                <option value="draft">Draft (Hidden from students)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Attach Quiz / Test</label>
                <Link
                  href="/admin/quizzes"
                  className="text-[10px] font-bold text-[#046BD2] hover:underline"
                >
                  + Create Quiz
                </Link>
              </div>
              <select
                value={attachedQuizId}
                onChange={(e) => setAttachedQuizId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="">No Quiz Attached</option>
                {availableQuizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questions_count} Qs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>Save Lesson to Course</span>
          </button>
        </form>
      </div>

      {/* Published Lessons Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Curriculum Lessons for {currentCourse?.title} ({currentLessons.length})
            </h3>
            <p className="text-xs text-slate-500">
              Lessons and YouTube links for this course. Click Edit to modify any video URL or attached quiz.
            </p>
          </div>
        </div>

        {/* Mobile Lessons List (< 768px) */}
        <div className="md:hidden space-y-3">
          {currentLessons.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No lessons added to this course yet. Use the form above to add your first video lesson!
            </div>
          ) : (
            currentLessons.map((lesson, idx) => {
              const parentModule = db.modules.find((m) => m.id === lesson.module_id);

              return (
                <div
                  key={lesson.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${lesson.youtube_video_id}/mqdefault.jpg`}
                      alt=""
                      className="w-20 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          #{lesson.sort_order || idx + 1}
                        </span>
                        {lesson.is_free_preview ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            ⭐ Free Demo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            🔒 Enrolled
                          </span>
                        )}
                        {lesson.published ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#046BD2]">
                            ✓ Published
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                        {lesson.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {parentModule?.title || 'Chapter'} • {lesson.duration_minutes} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    {lesson.video_source_type === 'r2' || lesson.r2_object_key ? (
                      <span className="inline-flex items-center gap-1 text-[#046BD2] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <span>☁️ Cloudflare R2 Video</span>
                      </span>
                    ) : (
                      <a
                        href={`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-rose-600 font-bold hover:underline"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Watch Video</span>
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(lesson)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-[#046BD2] font-bold text-xs hover:bg-blue-50 flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Lesson Title</th>
                <th className="px-4 py-3.5">Chapter</th>
                <th className="px-4 py-3.5">YouTube Video</th>
                <th className="px-4 py-3.5">Study Notes</th>
                <th className="px-4 py-3.5">Attached Quiz</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLessons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No lessons added to this course yet. Use the form above to add your first video lesson!
                  </td>
                </tr>
              ) : (
                currentLessons.map((lesson, idx) => {
                  const parentModule = db.modules.find((m) => m.id === lesson.module_id);
                  const attachedQuiz = db.quizzes.find((q) => q.id === lesson.quiz_id);

                  return (
                    <tr key={lesson.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4 font-mono font-bold text-slate-400">
                        {lesson.sort_order || idx + 1}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <PlayCircle className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {lesson.title}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {lesson.duration_minutes} min • {lesson.is_free_preview ? '⭐ Free Preview' : '🔒 Enrolled Only'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-700 max-w-xs truncate">
                        {parentModule?.title || 'General'}
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px]">
                        {lesson.video_source_type === 'r2' || lesson.r2_object_key ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#046BD2] border border-blue-200 flex items-center gap-1 whitespace-nowrap">
                              ☁️ R2 Video
                            </span>
                            <span className="text-slate-500 truncate max-w-[120px]" title={lesson.r2_object_key}>
                              {lesson.r2_object_key?.split('/').pop() || 'Private Media'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {lesson.youtube_video_id ? (
                              <>
                                <img
                                  src={`https://img.youtube.com/vi/${lesson.youtube_video_id}/mqdefault.jpg`}
                                  alt=""
                                  className="w-12 h-8 object-cover rounded border border-slate-200"
                                />
                                <a
                                  href={`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#046BD2] hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>{lesson.youtube_video_id}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              </>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {lesson.material_name ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            {lesson.material_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {attachedQuiz ? (
                          <Link
                            href={`/admin/quizzes`}
                            className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold transition border border-amber-200"
                            title="View Quiz Details"
                          >
                            <Award className="w-3 h-3 text-amber-600" />
                            <span className="truncate max-w-[100px]">{attachedQuiz.title}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {lesson.published ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            Published
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lesson)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-[#046BD2] font-bold text-xs transition"
                            title="Edit Lesson details or video URL"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ MODAL: EDIT EXISTING LESSON */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Lesson & Video Link
                </h3>
                <p className="text-xs text-slate-500">
                  Update the YouTube video lecture, notes, or attached quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Chapter / Module</label>
                <select
                  value={editModuleId}
                  onChange={(e) => setEditModuleId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <label className="text-xs font-bold text-slate-700">Video Source Option</label>
                  <div className="flex items-center gap-1.5 p-0.5 bg-white rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditVideoSourceType('youtube')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${editVideoSourceType === 'youtube'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Option A: YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditVideoSourceType('r2')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${editVideoSourceType === 'r2'
                          ? 'bg-[#046BD2] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Option B: R2 Video
                    </button>
                  </div>
                </div>

                {editVideoSourceType === 'youtube' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste YouTube link here"
                        value={editYoutubeLink}
                        onChange={(e) => setEditYoutubeLink(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#046BD2]"
                      />
                      <button
                        type="button"
                        onClick={handlePasteEditClipboard}
                        className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 border border-rose-200 flex-shrink-0"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        <span>Paste</span>
                      </button>
                    </div>

                    {editDetectedVideoId && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                        <img
                          src={`https://img.youtube.com/vi/${editDetectedVideoId}/mqdefault.jpg`}
                          alt="Thumbnail Preview"
                          className="w-20 h-12 object-cover rounded-lg border border-slate-300 shadow-sm"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-emerald-600 block flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Valid Link
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            ID: {editDetectedVideoId}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <R2MediaUpload
                    type="video"
                    resourceId={selectedCourseId}
                    currentValue={editR2ObjectKey}
                    onSuccess={({ key }) => {
                      setEditR2ObjectKey(key);
                      setSuccessToast('Video replaced in Cloudflare R2!');
                      setTimeout(() => setSuccessToast(''), 3000);
                    }}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lesson Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={editLessonOrder}
                    onChange={(e) => setEditLessonOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Free Preview?</label>
                  <select
                    value={editFreePreview ? 'yes' : 'no'}
                    onChange={(e) => setEditFreePreview(e.target.value === 'yes')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="no">Enrolled Only</option>
                    <option value="yes">Free Preview</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Published?</label>
                  <select
                    value={editPublished ? 'yes' : 'no'}
                    onChange={(e) => setEditPublished(e.target.value === 'yes')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="yes">Published</option>
                    <option value="no">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#046BD2]" />
                      <span>PDF Notes Attachment</span>
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                      {isUploadingPdf ? <Loader2 className="w-3 h-3 text-[#046BD2] animate-spin" /> : <Upload className="w-3 h-3 text-[#046BD2]" />}
                      <span>{isUploadingPdf ? 'Uploading...' : 'Browse File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        disabled={isUploadingPdf}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadPdf(f, true);
                        }}
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Chapter 1 Notes.pdf"
                      value={editMaterialName}
                      onChange={(e) => setEditMaterialName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#046BD2]"
                    />
                    {editMaterialName && (
                      <button
                        type="button"
                        onClick={() => setEditMaterialName('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Attach Quiz</label>
                  <select
                    value={editQuizId}
                    onChange={(e) => setEditQuizId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="">None</option>
                    {availableQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
