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
  Calendar,
  Video,
  FileText,
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
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const pathname = usePathname();
  const { user, role, loginAsStudent, loginAsAdmin, logout } = useAuth();
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

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Announcement Bar */}
      {settings.announcement_active && (
        <div className="bg-[#0B192C] text-white px-4 py-1.5 text-xs font-medium border-b border-white/10">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                {settings.announcement_tag}
              </span>
              <span className="hidden sm:inline text-slate-300">
                {settings.announcement_text}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                <span>{settings.phone}</span>
              </a>

            {/* Role quick switcher for testing */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition text-sky-200"
                title="Switch between student and admin preview"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Mode: <strong className="uppercase text-white">{role}</strong></span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                    Test Mode Switcher
                  </div>
                  <button
                    onClick={() => {
                      loginAsStudent();
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                      role === 'student' ? 'text-sky-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>Student (Priyanshu)</span>
                    {role === 'student' && <span className="text-sky-400">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      loginAsAdmin();
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                      role === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>Admin (Shekhar Sir)</span>
                    {role === 'admin' && <span className="text-amber-400">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Navigation Bar */}
      <div className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <BrandLogo variant="dark" size="md" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
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
            <div className="hidden lg:flex items-center gap-2.5">
              {!pathname.startsWith('/admin') ? (
                <>
                  <Link
                    href="/admin/lessons"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all whitespace-nowrap"
                    title="Paste YouTube video link for courses"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>📹 Paste Video Link</span>
                  </Link>

                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all whitespace-nowrap"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Public Website</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-sm transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <span>My Dashboard</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-sm shadow-blue-500/20 transition-all hover:scale-105"
                  >
                    <BookOpen className="w-4 h-4" />
                    Explore Courses
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
              <Link
                href="/admin/lessons"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold bg-rose-600 text-white text-sm shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>📹 Paste YouTube Video Link</span>
              </Link>

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold bg-amber-500 text-slate-950 text-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold bg-[#0B192C] text-white text-sm"
                  >
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    My Dashboard ({user.full_name})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl font-semibold text-red-600 bg-red-50 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl font-bold border border-slate-300 text-slate-800 text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/courses"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl font-bold bg-[#046BD2] text-white text-sm"
                  >
                    Enroll Now
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
