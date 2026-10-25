'use client';

import React from 'react';
import Link from 'next/link';

export function BrandLogo({
  variant = 'dark',
  size = 'md',
  showTagline = true,
}: {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const isLight = variant === 'light';

  // Sizing for the circular crest emblem
  const sealSizes = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-11 h-11 sm:w-13 sm:h-13',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  }[size];

  // Sizing for main title typography
  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg lg:text-xl',
    lg: 'text-xl sm:text-2xl',
  }[size];

  // Sizing for motto subtitle
  const subtitleSizes = {
    sm: 'text-[8px] sm:text-[9px]',
    md: 'text-[9.5px] sm:text-[10.5px]',
    lg: 'text-[11px] sm:text-xs',
  }[size];

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 sm:gap-3 group outline-none focus:outline-none focus-visible:outline-none select-none transition-opacity hover:opacity-95"
      title="Aspire Academy — Home"
    >
      {/* Official Circular Crest Seal (Transparent PNG at the beginning) */}
      <div className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
        <img
          src="/aspire-seal.png"
          alt="Aspire Academy Official Seal"
          className={`${sealSizes} object-contain drop-shadow-sm block`}
          loading="eager"
        />
      </div>

      {/* Styled Brand Typography */}
      <div className="flex flex-col justify-center text-left leading-none whitespace-nowrap flex-shrink-0">
        <div className={`font-black tracking-tight ${titleSizes} flex items-center gap-1.5 whitespace-nowrap`}>
          <span className={isLight ? 'text-white' : 'text-slate-900'}>
            ASPIRE
          </span>
          <span className={isLight ? 'text-sky-400' : 'text-[#046BD2]'}>
            ACADEMY
          </span>
        </div>

        {showTagline && (
          <div
            className={`font-bold tracking-wider mt-1 flex items-center gap-1.5 whitespace-nowrap ${subtitleSizes} ${
              isLight ? 'text-amber-400' : 'text-amber-600'
            }`}
          >
            <span className="font-semibold">विद्या यशः</span>
            <span className="opacity-50 text-[8px]">•</span>
            <span className="tracking-wider uppercase text-[8.5px] sm:text-[9.5px]">
              Accelerate Your Success
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

