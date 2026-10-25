'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';

export function BrandLogo({
  variant = 'dark',
  size = 'md',
}: {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}) {
  const { settings } = useSiteSettings();
  const isLight = variant === 'light';

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', title: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', title: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-11 h-11', title: 'text-2xl', sub: 'text-xs' },
  }[size];

  // Split academy name into first word and remainder for styling
  const nameParts = (settings.academy_name || 'Aspire Academy').split(' ');
  const firstWord = nameParts[0] || 'Aspire';
  const restOfName = nameParts.slice(1).join(' ') || 'Academy';

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group outline-none focus:outline-none focus-visible:outline-none select-none">
      {/* Dynamic Emblem */}
      <div
        className={`relative flex items-center justify-center ${sizeClasses.icon} rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105 ${
          isLight
            ? 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-blue-500/20'
            : 'bg-gradient-to-br from-[#046BD2] to-[#0252A5] text-white shadow-blue-500/25 ring-1 ring-blue-400/20'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-white transition-colors"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="m14 14 3 3 5-5" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`font-black tracking-tight uppercase ${sizeClasses.title} ${
            isLight ? 'text-white' : 'text-slate-900'
          }`}
        >
          Aspire <span className="text-[#046BD2]">Academy</span>
        </span>
        <span
          className={`font-semibold tracking-widest uppercase ${sizeClasses.sub} ${
            isLight ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {settings.tagline || 'Learn Today. Lead Tomorrow.'}
        </span>
      </div>
    </Link>
  );
}
