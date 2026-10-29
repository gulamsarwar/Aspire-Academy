'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { YouTubePlayer } from '@/components/ui/YouTubePlayer';
import { extractYouTubeVideoId } from '@/lib/youtube';
import {
  Video,
  Clock,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  Play,
  CheckCircle2,
  Lock,
  MessageCircle,
  MessageSquare,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

export default function LiveClassesPage() {
  const { user, role } = useAuth();
  const { settings } = useSiteSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [rightTab, setRightTab] = useState<'chat' | 'schedule'>('chat');
  const [embedDomain, setEmbedDomain] = useState<string>('localhost');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmbedDomain(window.location.hostname);
    }
  }, []);

  const rawPhone = (settings.whatsapp || settings.phone || '9123456789').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const liveWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${settings.lead_faculty || 'Shekhar Sir'}, I have a doubt during the live class`
  )}`;

  useEffect(() => {
    async function fetchLiveClasses() {
      try {
        setLoading(true);
        const studentId = user?.id || '';
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(studentId)}`);
        if (!res.ok) throw new Error('Failed to load live classes');
        const json = await res.json();
        setData(json);
        if (json.liveClasses && json.liveClasses.length > 0) {
          setActiveClassId(json.liveClasses[0].id);
        }
      } catch (err) {
        console.error('Failed to load live classes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveClasses();
  }, [user?.id]);

  const liveClasses = data?.liveClasses || [];
  const enrollments = data?.enrollments || [];
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));

  const activeClass = liveClasses.find((lc: any) => lc.id === activeClassId) || liveClasses[0];
  const cleanVideoId = extractYouTubeVideoId(activeClass?.youtube_video_id) || activeClass?.youtube_video_id;

  const isAccessible =
    activeClass &&
    (enrolledCourseIds.has(activeClass.course_id) ||
      role === 'admin' ||
      activeClass.isAccessible);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Live Classes & Interactive Doubt Sessions
        </h1>
        <p className="text-xs text-slate-500">
          Live stream doubt sessions, model paper solutions, and numerical workshops with {settings.lead_faculty || 'Shekhar Sir'}.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      ) : activeClass ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Video Stream Container */}
          <div className="lg:col-span-8 space-y-4">
            {isAccessible ? (
              <div className="overflow-hidden rounded-2xl shadow-xl border border-slate-800 bg-slate-950">
                <YouTubePlayer
                  url={activeClass.youtube_video_id}
                  title={activeClass.title}
                  autoPlay={false}
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-8 space-y-4 text-white">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold">Enrollment Required for this Live Batch</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  This live interactive session is restricted to enrolled students of{' '}
                  <strong>{activeClass.course?.title || 'this course'}</strong>.
                </p>
                <Link
                  href="/courses"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-lg transition"
                >
                  Enroll in Course to Join Live
                </Link>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      activeClass.status === 'live'
                        ? 'text-rose-600 bg-rose-50 animate-pulse'
                        : activeClass.status === 'completed'
                        ? 'text-slate-600 bg-slate-100'
                        : 'text-blue-600 bg-blue-50'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeClass.status === 'live' ? 'bg-rose-600 animate-ping' : 'bg-blue-600'
                      }`}
                    />
                    {activeClass.status === 'live'
                      ? 'Live Now'
                      : activeClass.status === 'completed'
                      ? 'Completed Recording'
                      : 'Upcoming Scheduled'}
                  </span>

                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Batch: {activeClass.batch?.name || 'Class 12th Board 2027'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Scheduled: {new Date(activeClass.scheduled_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{activeClass.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeClass.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Faculty: <strong>{activeClass.instructor_name}</strong></span>
                  <span>•</span>
                  <span>Subject: <strong>{activeClass.course?.category || 'Board Batch'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRightTab('chat')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                    <span>YouTube Live Chat</span>
                  </button>

                  <a
                    href={liveWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition text-xs"
                    title="Send private question to Shekhar Sir"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Doubt</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Note about unlisted stream URL security */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>Live Batch Protocol:</strong> Live streams & chats are hosted securely inside Aspire Academy.
                Please keep batch discussion respectful and focused on lecture concepts.
              </p>
            </div>
          </div>

          {/* Interactive Right Column: YouTube Live Chat & Scheduled Sessions */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4 flex flex-col h-full min-h-[580px]">
            {/* Header Tabs: YouTube Live Chat vs All Sessions */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRightTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  rightTab === 'chat'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                <span>Live Chat</span>
                {activeClass.status === 'live' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRightTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  rightTab === 'schedule'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Sessions ({liveClasses.length})</span>
              </button>
            </div>

            {/* Tab 1: Embedded YouTube Live Chat */}
            {rightTab === 'chat' ? (
              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time Live Chat Feed</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Powered by YouTube Live</span>
                </div>

                {cleanVideoId ? (
                  <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 min-h-[460px] relative">
                    <iframe
                      src={`https://www.youtube.com/live_chat?v=${cleanVideoId}&embed_domain=${embedDomain}`}
                      className="w-full h-full min-h-[460px] border-0"
                      title="YouTube Live Chat Feed"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">No Live Chat Active</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Live chat connects automatically when a YouTube Live broadcast is scheduled for this session.
                    </p>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="truncate">Need 1-on-1 private doubt help?</span>
                  <a
                    href={liveWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shrink-0"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Tab 2: Scheduled Sessions List */
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {liveClasses.map((lc: any) => {
                  const isSelected = lc.id === activeClassId;

                  return (
                    <div
                      key={lc.id}
                      onClick={() => setActiveClassId(lc.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'border-[#046BD2] bg-blue-50/70 shadow-sm'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`font-bold uppercase ${
                            lc.status === 'live'
                              ? 'text-rose-600'
                              : lc.status === 'completed'
                              ? 'text-slate-500'
                              : 'text-[#046BD2]'
                          }`}
                        >
                          {lc.status === 'live' ? '● Live Now' : lc.status}
                        </span>
                        <span className="text-slate-400">
                          {new Date(lc.scheduled_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                        {lc.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Faculty: {lc.instructor_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Video className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Live Sessions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upcoming live doubt solving classes and YouTube live streams will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
