'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              Aspire Academy — System Notice
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected system error occurred while loading the application.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs transition shadow-md"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
