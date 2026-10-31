'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Video,
  FileText,
  CreditCard,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  Shield,
  PlayCircle,
  CheckSquare,
  HelpCircle,
  Clock,
  Bookmark,
  Download,
  Brain,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
    { label: 'My Batches', href: '/dashboard/batches', icon: Calendar },
    { label: 'All Classes', href: '/dashboard/classes', icon: PlayCircle },
    { label: 'Live Classes', href: '/dashboard/live', icon: Video },
    { label: 'All Tests', href: '/dashboard/tests', icon: CheckSquare },
    { label: 'Neuron AI', href: '/dashboard/neuron', icon: Brain },
    { label: 'PDF Bank', href: '/dashboard/materials', icon: FileText },
    { label: 'Ask Doubts', href: '/dashboard/doubts', icon: HelpCircle },
    { label: 'Weekly Schedule', href: '/dashboard/schedule', icon: Clock },
    { label: 'Bookmarks', href: '/dashboard/bookmarks', icon: Bookmark },
    { label: 'My Downloads', href: '/dashboard/downloads', icon: Download },
    { label: 'Purchase History', href: '/dashboard/purchases', icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/neuron' && (pathname === '/dashboard/neuron' || pathname === '/dashboard/pi')) return true;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
      {/* Mobile Top Sub-nav - Solid White & Clean Scroll */}
      <div className="lg:hidden bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center overflow-x-auto space-x-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                active
                  ? 'bg-[#046BD2] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-6 flex-shrink-0 min-h-[calc(100vh-80px)]">
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-sky-300">
              {user ? user.full_name.charAt(0) : 'S'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold truncate">
                {user ? user.full_name : 'Guest Student'}
              </h4>
              <p className="text-[11px] text-sky-300 capitalize font-medium">
                {role} Account
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10">
            <span>Enrolled Student</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#046BD2] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#046BD2]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Shortcut if Admin */}
        {role === 'admin' && (
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
            >
              <Shield className="w-4 h-4" />
              <span>Switch to Admin Panel</span>
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl w-full transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
