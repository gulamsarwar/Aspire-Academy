'use client';

import React, { useState } from 'react';
import { db } from '@/lib/data/mock-db';
import { LiveClass } from '@/lib/types';
import { extractYouTubeVideoId } from '@/lib/youtube';
import {
  Video,
  Plus,
  Clock,
  ExternalLink,
  Calendar,
  CheckCircle2,
  ClipboardPaste,
  Radio,
  X,
} from 'lucide-react';

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([...db.liveClasses]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // New Live Session State
  const [selectedCourseId, setSelectedCourseId] = useState(db.courses[0]?.id || '');
  const batches = db.getBatchesForCourse(selectedCourseId);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [instructor, setInstructor] = useState('Shekhar Sir');

  const detectedLiveVideoId = extractYouTubeVideoId(youtubeLiveUrl);

  const handlePasteLiveUrl = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setYoutubeLiveUrl(text.trim());
          setSuccessToast('YouTube live link pasted!');
          setTimeout(() => setSuccessToast(''), 2500);
          return;
        }
      }
      throw new Error('Clipboard restricted');
    } catch {
      alert('Clipboard permission required. Please tap and hold inside the YouTube Live URL box and select "Paste".');
    }
  };

  const handleScheduleClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeLiveUrl.trim()) return;

    const cleanVideoId = extractYouTubeVideoId(youtubeLiveUrl);
    if (!cleanVideoId) {
      alert('Please provide a valid YouTube video or live stream link.');
      return;
    }

    const created = db.scheduleLiveClass({
      course_id: selectedCourseId,
      batch_id: selectedBatchId || batches[0]?.id || 'b0000000-0000-0000-0000-000000000001',
      title,
      description,
      youtube_live_url: youtubeLiveUrl,
      youtube_video_id: cleanVideoId,
      instructor_name: instructor,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: 75,
      status: 'scheduled',
    });

    setLiveClasses([created, ...liveClasses]);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setYoutubeLiveUrl('');
    setSuccessToast(`Live session "${created.title}" scheduled successfully!`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const updateStatus = (classId: string, newStatus: any) => {
    const liveClass = liveClasses.find((lc) => lc.id === classId);
    if (liveClass) {
      liveClass.status = newStatus;
      setLiveClasses([...liveClasses]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>Interactive Live Streaming</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            YouTube Live Class Scheduler
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Schedule live doubt clearing, test discussions, and numerical masterclasses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Stream</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Mobile Live Classes Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {liveClasses.map((lc) => {
          const course = db.getCourseById(lc.course_id);
          const batch = db.getBatchById(lc.batch_id);

          return (
            <div
              key={lc.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                      lc.status === 'live'
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : lc.status === 'completed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-50 text-[#046BD2]'
                    }`}
                  >
                    ● {lc.status}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {lc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {course?.title} • {batch?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(lc.scheduled_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span className="font-semibold text-slate-700">{lc.instructor_name}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <a
                  href={lc.youtube_live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Stream</span>
                </a>

                <div className="flex items-center gap-2">
                  {lc.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(lc.id, 'live')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                    >
                      Go Live
                    </button>
                  )}
                  {lc.status === 'live' && (
                    <button
                      onClick={() => updateStatus(lc.id, 'completed')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-sm"
                    >
                      End Stream
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(lc.id, 'cancelled')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Live Class Title</th>
                <th className="px-6 py-4">Course & Batch</th>
                <th className="px-6 py-4">Faculty</th>
                <th className="px-6 py-4">Scheduled Time</th>
                <th className="px-6 py-4">Live Stream Status</th>
                <th className="px-6 py-4 text-right">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liveClasses.map((lc) => {
                const course = db.getCourseById(lc.course_id);
                const batch = db.getBatchById(lc.batch_id);

                return (
                  <tr key={lc.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm max-w-xs truncate">
                            {lc.title}
                          </h4>
                          <a
                            href={lc.youtube_live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#046BD2] hover:underline flex items-center gap-1"
                          >
                            <span>Stream URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                        {course?.title}
                      </span>
                      <span className="text-[10px] text-slate-500">{batch?.name}</span>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {lc.instructor_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(lc.scheduled_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lc.status === 'live'
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : lc.status === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-[#046BD2]'
                        }`}
                      >
                        {lc.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-1.5">
                      {lc.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(lc.id, 'live')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                        >
                          Go Live
                        </button>
                      )}
                      {lc.status === 'live' && (
                        <button
                          onClick={() => updateStatus(lc.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-sm"
                        >
                          End Stream
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(lc.id, 'cancelled')}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Live Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule Live Class</h3>
                <p className="text-xs text-slate-500">
                  Broadcast live lectures or doubt clearing via YouTube.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Class Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Reproduction Unit Objective Rapid Fire & Doubts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              {/* YouTube Live URL with dedicated Paste Link Button & Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">YouTube Live URL *</label>
                  <button
                    type="button"
                    onClick={handlePasteLiveUrl}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste Link</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeLiveUrl}
                    onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handlePasteLiveUrl}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                </div>

                {detectedLiveVideoId && (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                    <img
                      src={`https://img.youtube.com/vi/${detectedLiveVideoId}/mqdefault.jpg`}
                      alt="Thumbnail"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-300"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid Live Stream Link
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        ID: {detectedLiveVideoId}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Faculty</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Class</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
