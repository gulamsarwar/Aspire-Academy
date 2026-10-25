'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function AdminLessonsPage() {
  const courses = db.courses;
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');

  const modules = db.modules.filter((m) => m.course_id === selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');

  const [lessons, setLessons] = useState<Lesson[]>([...db.lessons]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lesson State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [materialPath, setMaterialPath] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);

  const currentLessons = lessons.filter((l) => {
    const parentModule = db.modules.find((m) => m.id === l.module_id);
    return parentModule?.course_id === selectedCourseId;
  });

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeVideoId.trim()) return;

    // Sanitize YouTube video ID if full URL pasted
    let cleanVideoId = youtubeVideoId.trim();
    if (cleanVideoId.includes('v=')) {
      cleanVideoId = cleanVideoId.split('v=')[1].split('&')[0];
    } else if (cleanVideoId.includes('youtu.be/')) {
      cleanVideoId = cleanVideoId.split('youtu.be/')[1].split('?')[0];
    }

    const created = db.addLesson({
      module_id: selectedModuleId || modules[0]?.id || 'm0000000-0000-0000-0000-000000000001',
      title,
      description,
      youtube_video_id: cleanVideoId,
      duration_minutes: Number(durationMinutes),
      material_path: materialPath || undefined,
      material_name: materialName || undefined,
      sort_order: currentLessons.length + 1,
      is_free_preview: isFreePreview,
      published: true,
    });

    setLessons([...lessons, created]);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setYoutubeVideoId('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lesson Video & PDF Notes Management
          </h1>
          <p className="text-xs text-slate-500">
            Organize modules, upload YouTube video lessons, and attach PDF study notes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lesson to Module</span>
        </button>
      </div>

      {/* Course Filter Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
          Filter Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => {
            setSelectedCourseId(e.target.value);
            const m = db.modules.filter((mod) => mod.course_id === e.target.value);
            setSelectedModuleId(m[0]?.id || '');
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-800"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Lesson Title</th>
                <th className="px-6 py-4">Unit / Module</th>
                <th className="px-6 py-4">YouTube Video ID</th>
                <th className="px-6 py-4">PDF Material</th>
                <th className="px-6 py-4">Preview Mode</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLessons.map((lesson) => {
                const parentModule = db.modules.find((m) => m.id === lesson.module_id);

                return (
                  <tr key={lesson.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <PlayCircle className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{lesson.title}</h4>
                          <span className="text-[11px] text-slate-400">
                            {lesson.duration_minutes} minutes
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700 max-w-xs truncate">
                      {parentModule?.title}
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                      <a
                        href={`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#046BD2] hover:underline flex items-center gap-1"
                      >
                        <span>{lesson.youtube_video_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {lesson.material_path ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          PDF Attached
                        </span>
                      ) : (
                        <span className="text-slate-400">No PDF</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {lesson.is_free_preview ? (
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Free Preview
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          Enrolled Only
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                        Published
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Lesson to Module</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Parent Module / Unit</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lesson 4: Gauss Law Derivations & Symmetrical Surfaces"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  YouTube Video ID or Full URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dQw4w9WgXcQ or https://youtube.com/watch?v=..."
                  value={youtubeVideoId}
                  onChange={(e) => setYoutubeVideoId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-xs font-bold text-slate-700">Free Preview Lesson?</label>
                  <select
                    value={isFreePreview ? 'yes' : 'no'}
                    onChange={(e) => setIsFreePreview(e.target.value === 'yes')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="no">Enrolled Students Only</option>
                    <option value="yes">Free Preview Allowed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  PDF Notes File Name / Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lesson 4 Handout & Diagram Sheet.pdf"
                  value={materialName}
                  onChange={(e) => {
                    setMaterialName(e.target.value);
                    setMaterialPath('/notes/' + e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts discussed in this lecture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm"
                >
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
