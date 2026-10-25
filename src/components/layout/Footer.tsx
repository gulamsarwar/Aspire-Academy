'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-[#0B192C] text-slate-300 border-t border-slate-800">
      {/* Top Value Banner */}
      <div className="border-b border-slate-800/80 bg-[#071326] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sky-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">NCERT Concept Mastery</h4>
                <p className="text-xs text-slate-400">Targeted for Bihar Board & NEET success</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Verified UPI Checkout</h4>
                <p className="text-xs text-slate-400">Instant batch activation with Razorpay</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Personal Mentor Support</h4>
                <p className="text-xs text-slate-400">Weekly doubt clearing with {settings.lead_faculty || 'Shekhar Sir'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="light" size="md" />
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              {settings.description}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Admissions</span>
              </a>
            </div>
          </div>

          {/* Core Programs */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Popular Programs
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/courses/class-12-biology"
                  className="hover:text-white transition-colors"
                >
                  Class 12 Biology ({settings.lead_faculty || 'Shekhar Sir'})
                </Link>
              </li>
              <li>
                <Link
                  href="/courses/class-12-physics"
                  className="hover:text-white transition-colors"
                >
                  Class 12 Physics (Derivations)
                </Link>
              </li>
              <li>
                <Link
                  href="/courses/class-12-chemistry"
                  className="hover:text-white transition-colors"
                >
                  Class 12 Chemistry
                </Link>
              </li>
              <li>
                <Link
                  href="/courses/class-10-board-foundation"
                  className="hover:text-white transition-colors"
                >
                  Class 10 Board Topper Batch
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sky-400 hover:text-sky-300 font-semibold">
                  View All Courses →
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Learning Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Student Hub
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/live" className="hover:text-white transition-colors">
                  YouTube Live Classes
                </Link>
              </li>
              <li>
                <Link href="/batches" className="hover:text-white transition-colors">
                  Batch Timetables
                </Link>
              </li>
              <li>
                <Link href="/notes" className="hover:text-white transition-colors">
                  Free PDF Study Notes
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Student Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              Contact Academy
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>{settings.office_hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Policy Links */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p suppressHydrationWarning>© 2026 {settings.academy_name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refund-policy" className="hover:text-slate-300 transition-colors">
              Refund Policy
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
