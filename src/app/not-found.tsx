'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Home, BookOpen, UserCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';

export default function NotFound() {
  const { settings } = useSiteSettings();

  const rawPhone = (settings.whatsapp || settings.phone || '9123456789').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo variant="dark" size="lg" />
        </div>

        {/* 404 Visual Pill */}
        <div className="space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-[#046BD2] font-black text-xs uppercase tracking-widest">
            Error 404 &bull; Page Not Found
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            यह पृष्ठ उपलब्ध नहीं है
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs shadow-md shadow-blue-500/25 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs shadow-xs transition active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-[#046BD2]" />
            <span>Browse Courses</span>
          </Link>
        </div>

        {/* Helpdesk link */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          <Link href="/dashboard" className="hover:text-[#046BD2] flex items-center gap-1 transition">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student Dashboard</span>
          </Link>
          <span>&bull;</span>
          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello, I was trying to open a page on Aspire Academy but got 404.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 flex items-center gap-1 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Help</span>
          </a>
        </div>
      </div>
    </div>
  );
}
