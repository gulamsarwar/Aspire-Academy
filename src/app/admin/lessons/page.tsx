'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/data/mock-db';
import { Lesson } from '@/lib/types';
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
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react';

export default function AdminLessonsPage() {
  const courses = db.courses;
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');

  const modules = db.modules.filter((m) => m.course_id === selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');

  const [lessons, setLessons] = useState<Lesson[]>([...db.lessons]);
  const [successToast, setSuccessToast] = useState('');

  // Primary Add Video Form State (Visible on Page)
  const [title, setTitle] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [materialName, setMaterialName] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [description, setDescription] = useState('');

  // Edit Existing Lesson Modal State
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYoutubeLink, setEditYoutubeLink] = useState('');
  const [editDuration, setEditDuration] = useState(45);
  const [editFreePreview, setEditFreePreview] = useState(false);
  const [editMaterialName, setEditMaterialName] = useState('');

  // Handle URL query parameter ?courseId=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('courseId');
      if (cid && courses.some((c) => c.id === cid)) {
        setSelectedCourseId(cid);
        const m = db.modules.filter((mod) => mod.course_id === cid);
        if (m.length > 0) {
          setSelectedModuleId(m[0].id);
        }
      }
    }
  }, [courses]);

  const currentLessons = lessons.filter((l) => {
    const parentModule = db.modules.find((m) => m.id === l.module_id);
    return parentModule?.course_id === selectedCourseId;
  });

  // Helper to extract 11-char video ID from any YouTube URL format
  const extractVideoId = (input: string): string => {
    const clean = input.trim();
    if (!clean) return '';
    if (clean.includes('v=')) {
      return clean.split('v=')[1].split('&')[0];
    }
    if (clean.includes('youtu.be/')) {
      return clean.split('youtu.be/')[1].split('?')[0];
    }
    if (clean.includes('embed/')) {
      return clean.split('embed/')[1].split('?')[0];
    }
    if (clean.includes('live/')) {
      return clean.split('live/')[1].split('?')[0];
    }
    if (clean.includes('shorts/')) {
      return clean.split('shorts/')[1].split('?')[0];
    }
    return clean;
  };

  const detectedVideoId = extractVideoId(youtubeVideoId);
  const editDetectedVideoId = extractVideoId(editYoutubeLink);

  // Paste from clipboard handler
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setYoutubeVideoId(text.trim());
        }
      }
    } catch {
      alert('Clipboard access restricted. Please right-click inside the box and click Paste (Ctrl+V).');
    }
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVideoId = extractVideoId(youtubeVideoId);
    if (!title.trim() || !cleanVideoId) {
      alert('Please enter a lesson title and a valid YouTube video link or ID.');
      return;
    }

    const created = db.addLesson({
      module_id: selectedModuleId || modules[0]?.id || 'm0000000-0000-0000-0000-000000000001',
      title,
      description,
      youtube_video_id: cleanVideoId,
      duration_minutes: Number(durationMinutes),
      material_path: materialName ? `/notes/${materialName.toLowerCase().replace(/\s+/g, '-')}` : undefined,
      material_name: materialName || undefined,
      sort_order: currentLessons.length + 1,
      is_free_preview: isFreePreview,
      published: true,
    });

    setLessons([...db.lessons]);
    setTitle('');
    setDescription('');
    setYoutubeVideoId('');
    setMaterialName('');

    setSuccessToast(`Video lecture "${created.title}" published successfully!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditYoutubeLink(`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`);
    setEditDuration(lesson.duration_minutes);
    setEditFreePreview(lesson.is_free_preview);
    setEditMaterialName(lesson.material_name || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    const cleanVideoId = extractVideoId(editYoutubeLink);
    if (!editTitle.trim() || !cleanVideoId) {
      alert('Please provide a lesson title and valid YouTube link.');
      return;
    }

    db.updateLesson(editingLesson.id, {
      title: editTitle,
      youtube_video_id: cleanVideoId,
      duration_minutes: Number(editDuration),
      is_free_preview: editFreePreview,
      material_name: editMaterialName || undefined,
      material_path: editMaterialName ? `/notes/${editMaterialName.toLowerCase().replace(/\s+/g, '-')}` : undefined,
    });

    setLessons([...db.lessons]);
    setEditingLesson(null);
    setSuccessToast(`Lesson "${editTitle}" video link updated!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete lesson "${lessonTitle}"?`)) {
      db.deleteLesson(lessonId);
      setLessons([...db.lessons]);
      setSuccessToast(`Lesson "${lessonTitle}" removed.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5" />
            <span>Course Content Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Course Video Upload & Lesson Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apne unlisted YouTube video ka link yahan paste karein aur course me publish karein. Enrolled students turant apne video player me dekh sakenge.
          </p>
        </div>

        {/* Selected Course Selector */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap pl-2">
            Select Course:
          </span>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              const m = db.modules.filter((mod) => mod.course_id === e.target.value);
              setSelectedModuleId(m[0]?.id || '');
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:border-[#046BD2]"
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

      {/* 🚀 PRIMARY DEDICATED "PASTE VIDEO LINK" CARD (ALWAYS VISIBLE) */}
      <div className="bg-white rounded-3xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#046BD2]" />
              <span>Paste YouTube Video Link & Publish Lecture</span>
            </h2>
            <p className="text-xs text-slate-500">
              Paste your YouTube video URL below. Works with all standard links: <code>https://youtu.be/...</code> or <code>https://youtube.com/watch?v=...</code>
            </p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-[#046BD2] px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            Instant Publishing
          </span>
        </div>

        <form onSubmit={handleCreateLesson} className="space-y-6">
          {/* Main Video Link Input with Paste from Clipboard Button */}
          <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-400/50">
            <label className="text-xs font-black text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Video className="w-4 h-4 text-rose-600" />
                <span className="text-sm">यहाँ YouTube Video का Link Paste करें <strong className="text-red-500">*</strong></span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Unlisted ya Public YouTube Video link ya ID paste karein)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="यहाँ YouTube link paste karein (e.g. https://www.youtube.com/watch?v=kJQP7kiw5Fk ya https://youtu.be/...)"
                  value={youtubeVideoId}
                  onChange={(e) => setYoutubeVideoId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-blue-300 focus:border-[#046BD2] text-sm font-mono focus:outline-none bg-white shadow-inner font-semibold text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md transition whitespace-nowrap hover:scale-105 active:scale-95"
                title="Paste link directly from your clipboard"
              >
                <ClipboardPaste className="w-4 h-4 text-white" />
                <span>📋 Paste Link (Clipboard)</span>
              </button>
            </div>

            {/* Quick Demo Fill Buttons if user doesn't have link copied yet */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Test Demo Link:</span>
              <button
                type="button"
                onClick={() => setYoutubeVideoId('https://www.youtube.com/watch?v=kJQP7kiw5Fk')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                ⚡ Load Sample Physics Link
              </button>
              <button
                type="button"
                onClick={() => setYoutubeVideoId('https://youtu.be/3JZ_D3ELwOQ')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                ⚡ Load Sample Chemistry Link
              </button>
            </div>

            {/* Live Video Detection & Interactive Preview */}
            {detectedVideoId && detectedVideoId.length >= 6 ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 mt-3 animate-in fade-in space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-black text-emerald-900 block">
                        ✓ YouTube Video Link Successfully Detected!
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

                {/* Embedded Video Player */}
                <div className="aspect-video w-full max-w-lg rounded-2xl overflow-hidden shadow-lg border border-emerald-300 bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${detectedVideoId}`}
                    title="Video Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Module & Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Target Chapter / Unit Module <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:border-[#046BD2]"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lesson 4: Pollination Agents & Outbreeding Mechanisms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
              />
            </div>
          </div>

          {/* Secondary fields: Duration, Preview mode, PDF material */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Access Mode</label>
              <select
                value={isFreePreview ? 'yes' : 'no'}
                onChange={(e) => setIsFreePreview(e.target.value === 'yes')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                <option value="no">🔒 Paid Enrolled Students Only</option>
                <option value="yes">⭐ Free Demo Preview Allowed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">PDF Study Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Lesson 4 Handout & Diagrams.pdf"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <Plus className="w-5 h-5" />
            <span>Publish Video Lesson to Course</span>
          </button>
        </form>
      </div>

      {/* Existing Lessons Table with Edit Video Link Button on Every Row */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Published Lessons for This Course ({currentLessons.length})
            </h3>
            <p className="text-xs text-slate-500">
              Click <strong>"Edit Link"</strong> on any row to replace or update its YouTube video URL.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Lesson Title</th>
                <th className="px-4 py-3.5">Unit / Chapter</th>
                <th className="px-4 py-3.5">YouTube Video</th>
                <th className="px-4 py-3.5">PDF Notes</th>
                <th className="px-4 py-3.5">Mode</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLessons.map((lesson) => {
                const parentModule = db.modules.find((m) => m.id === lesson.module_id);

                return (
                  <tr key={lesson.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <PlayCircle className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{lesson.title}</h4>
                          <span className="text-[11px] text-slate-400">
                            {lesson.duration_minutes} minutes
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-700 max-w-xs truncate">
                      {parentModule?.title}
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
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
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {lesson.material_name ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {lesson.material_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">No PDF</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {lesson.is_free_preview ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Free Preview
                        </span>
                      ) : (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Enrolled Only
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lesson)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-[#046BD2] font-bold text-xs transition"
                          title="Change YouTube video link or title"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Video Link</span>
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ MODAL: EDIT EXISTING LESSON VIDEO LINK */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Video Link for Lesson
                </h3>
                <p className="text-xs text-slate-500">
                  Update the YouTube lecture link or title.
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
                <label className="text-xs font-bold text-slate-700">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  YouTube Video Link or URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste new YouTube link here"
                  value={editYoutubeLink}
                  onChange={(e) => setEditYoutubeLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#046BD2]"
                />

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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">PDF Notes Name</label>
                <input
                  type="text"
                  value={editMaterialName}
                  onChange={(e) => setEditMaterialName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
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
                  <span>Update Video Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
