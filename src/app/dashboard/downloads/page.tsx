'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { Download, FileText, ExternalLink, BookOpen, Loader2 } from 'lucide-react';

export default function MyDownloadsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDownloads() {
      try {
        setLoading(true);
        if (!user?.id) {
          setData({ downloads: [] });
          return;
        }
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user.id)}`);
        if (!res.ok) throw new Error('Failed to load downloads');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDownloads();
  }, [user?.id]);

  const downloads = data?.downloads || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Downloaded Study Materials
        </h1>
        <p className="text-xs text-slate-500">
          Handwritten notes, diagram sheets, and formula banks downloaded to your device.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      ) : downloads.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {downloads.map((d: any) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {d.material_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Downloaded on {new Date(d.downloaded_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <a
                  href={d.material_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-download</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Download className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Downloads Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t downloaded any PDF notes yet. Visit the PDF Bank to download chapter formula notes.
          </p>
          <Link
            href="/dashboard/materials"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2]"
          >
            Open PDF Bank
          </Link>
        </div>
      )}
    </div>
  );
}
