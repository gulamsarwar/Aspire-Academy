'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { AlertTriangle, RotateCw, Home, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Log error securely
    console.error('Application runtime error caught by boundary:', error);
  }, [error]);

  const rawPhone = (settings.whatsapp || settings.phone || '9123456789').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo variant="dark" size="lg" />
        </div>

        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kuch Takniki Samasya Aayi Hai
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hume khed hai. Page load karte samay ek anapekshit samasya aayi. Kripya niche diye gaye button se dobara prayas karein.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#046BD2] text-white font-bold text-xs hover:bg-[#0352A0] transition shadow-md"
          >
            <RotateCw className="w-4 h-4" />
            <span>Dobara Prayas Karein (Retry)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-xs hover:bg-slate-100 transition shadow-sm"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Home Page</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-200/80">
          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              'Namaste Shekhar Sir, Aspire Academy website par page load nahi ho raha hai. Kripya sahayata karein.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Shekhar Sir Se WhatsApp Par Sampark Karein</span>
          </a>
        </div>
      </div>
    </div>
  );
}

