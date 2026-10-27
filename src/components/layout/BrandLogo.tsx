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
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-9 h-9 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-15 sm:h-15',
  }[size];

  // Sizing for main title typography
  const titleSizes = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base lg:text-lg',
    lg: 'text-lg sm:text-xl',
  }[size];

  // Sizing for motto subtitle
  const subtitleSizes = {
    sm: 'text-[7.5px] sm:text-[8.5px]',
    md: 'text-[8.5px] sm:text-[9.5px]',
    lg: 'text-[10px] sm:text-xs',
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
            className={`font-bold tracking-wider mt-0.5 flex items-center gap-1.5 whitespace-nowrap ${subtitleSizes} ${
              isLight ? 'text-amber-400' : 'text-amber-600'
            }`}
          >
            <span className="font-semibold">विद्या यशः</span>
            <span className="opacity-50 text-[8px]">•</span>
            <span className="tracking-wider uppercase text-[0.9em]">
              Accelerate Your Success
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

