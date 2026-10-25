'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { MessageCircle, Phone, X, Sparkles, Send } from 'lucide-react';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);

  // Hide on admin routes to prevent UI clutter
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const rawPhone = (settings.whatsapp || settings.phone || '919123456789').replace(/[^0-9]/g, '');
  const cleanNumber = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  const defaultMessage = encodeURIComponent(
    `Namaste Shekhar Sir, I have an admission enquiry regarding Aspire Academy batches.`
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Expanded Quick Chat Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow">
                  SS
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <span>Shekhar Sir & Helpdesk</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h4>
                <p className="text-[11px] text-emerald-300 font-medium">
                  Online • Typically replies in 5 mins
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-slate-50 space-y-3 text-xs text-slate-700">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <p className="font-semibold text-slate-800">
                👋 Namaste! Welcome to Aspire Academy.
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Need help choosing the right batch for <strong>Bihar Board Class 12 / 10</strong> or have questions about syllabus & handwritten notes?
              </p>
            </div>

            <div className="text-[10px] text-slate-500 text-center font-semibold">
              Connect directly on WhatsApp or Call
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
              <Send className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={`tel:${cleanNumber}`}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center"
              title="Call Helpline"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Contact Shekhar Sir on WhatsApp"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-[#25D366] rounded-full animate-ping" />
        </div>
        <span className="hidden sm:inline text-xs font-black tracking-wide pr-1">
          {isOpen ? 'Close' : 'Chat with Shekhar Sir'}
        </span>
      </button>
    </div>
  );
}
