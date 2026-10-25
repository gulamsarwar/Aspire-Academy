'use client';

import React from 'react';
import Link from 'next/link';

export function BrandLogo({
  variant = 'dark',
  size = 'md',
}: {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}) {
  const isLight = variant === 'light';

  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-12 sm:h-14',
  }[size];

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 group outline-none focus:outline-none focus-visible:outline-none select-none"
      title="Aspire Academy - Home"
    >
      <div
        className={`transition-transform duration-200 group-hover:scale-105 ${
          isLight ? 'bg-white px-3 py-1.5 rounded-xl shadow-sm' : ''
        }`}
      >
        <img
          src="/aspire-logo.png"
          alt="Aspire Academy"
          className={`${sizeClasses} w-auto object-contain block`}
        />
      </div>
    </Link>
  );
}
