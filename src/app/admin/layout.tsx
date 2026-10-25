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
  Users,
  CreditCard,
  Shield,
  ChevronRight,
  ExternalLink,
  LogOut,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, role, loginAsAdmin } = useAuth();

  const navItems = [
    { label: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Academy Settings', href: '/admin/settings', icon: Settings },
    { label: 'Courses Management', href: '/admin/courses', icon: BookOpen },
    { label: 'Batch Management', href: '/admin/batches', icon: Calendar },
    { label: 'Lesson Video & PDF', href: '/admin/lessons', icon: FileText },
    { label: 'Live Stream Scheduler', href: '/admin/live', icon: Video },
    { label: 'Student Management', href: '/admin/students', icon: Users },
    { label: 'Payments & Orders', href: '/admin/payments', icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // If user is not admin, provide friendly preview switch
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-5 text-white shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Admin Privileges Required</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This area is strictly restricted to administrator accounts (e.g. Shekhar Sir).
              You are currently viewing in student mode.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={loginAsAdmin}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-md"
            >
              Switch to Administrator Session (Shekhar Sir)
            </button>
            <Link
              href="/"
              className="inline-block text-xs font-semibold text-slate-400 hover:text-white pt-2"
            >
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Sub-nav */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between overflow-x-auto space-x-2 border-b border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                active ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 space-y-6 flex-shrink-0 text-white min-h-[calc(100vh-80px)]">
        {/* Admin Header */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Aspire Admin Console</span>
          </div>
          <div className="text-xs text-slate-300 font-semibold truncate">
            {user ? user.full_name : 'Shekhar Sir (Admin)'}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold block">
            ● Master Access Control
          </span>
        </div>

        {/* Navigation */}
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
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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

        {/* Student View Shortcut */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <span>View Student Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
