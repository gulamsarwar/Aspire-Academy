'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import {
  Menu,
  X,
  BookOpen,
  Video,
  UserCheck,
  Shield,
  PhoneCall,
  LogOut,
  ChevronDown,
  Sparkles,
  Eye,
} from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'Batches', href: '/batches' },
    { label: 'Live Classes', href: '/dashboard/live' },
    { label: 'Free Notes', href: '/notes' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Dedicated streamlined header for Admin Console (no public clutter or announcement bars)
  if (pathname.startsWith('/admin')) {
    return (
      <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Logo + Admin Badge */}
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="light" size="sm" showTagline={false} />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Admin Console</span>
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Public Site ↗</span>
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 transition border border-sky-800/60"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Student Dashboard</span>
                <span className="sm:hidden">Student Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Announcement Bar - PhysicsWallah / Unacademy Style */}
      {settings.announcement_active && (
        <div className="bg-gradient-to-r from-[#0352A0] via-[#046BD2] to-[#0284C7] text-white px-4 py-2 text-xs font-semibold shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] shadow-sm">
                {settings.announcement_tag}
              </span>
              <span className="hidden sm:inline text-white/95 font-medium">
                {settings.announcement_text}
              </span>
            </div>

            <div className="flex items-center gap-4 text-white/90">
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-white" />
                <span>{settings.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="glass-header">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <BrandLogo variant="dark" size="md" />
            </div>

            {/* Desktop Navigation Links (Always 1 single line with whitespace-nowrap) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-lg text-[13px] xl:text-sm font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                      active
                        ? 'text-[#046BD2] bg-blue-50/80 font-bold'
                        : 'text-slate-700 hover:text-[#046BD2] hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              {pathname.startsWith('/admin') ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Public Website</span>
                </Link>
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md shadow-blue-500/20 transition-all whitespace-nowrap"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>My Dashboard</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Logout from Student Account"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 xl:gap-2">
                  <Link
                    href="/auth/login"
                    className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#046BD2] hover:bg-blue-50/60 rounded-xl transition whitespace-nowrap flex-shrink-0"
                  >
                    Student Login
                  </Link>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 px-3.5 xl:px-5 py-2 xl:py-2.5 rounded-xl text-xs xl:text-sm font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md shadow-blue-500/25 transition-all hover:scale-105 whitespace-nowrap flex-shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore Courses</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-base font-semibold ${
                    isActive(link.href)
                      ? 'text-[#046BD2] bg-blue-50 font-bold'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold bg-[#046BD2] text-white text-sm"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>My Dashboard ({user.full_name})</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl font-semibold text-red-600 bg-red-50 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl font-bold border border-slate-300 text-slate-800 text-sm hover:bg-slate-50"
                  >
                    Student Login
                  </Link>
                  <Link
                    href="/courses"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl font-bold bg-[#046BD2] text-white text-sm"
                  >
                    Explore Courses
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
