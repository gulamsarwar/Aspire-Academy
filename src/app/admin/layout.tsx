'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { isAuthorizedAdminEmail } from '@/lib/auth/admin';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Video,
  FileText,
  Users,
  CreditCard,
  Shield,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  LogOut,
  Settings,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, role, logout, isAuthReady } = useAuth();

  const navItems: { label: string; href: string; icon: any; badge?: string }[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Courses', href: '/admin/courses', icon: BookOpen },
    { label: 'Batches', href: '/admin/batches', icon: Calendar },
    { label: 'Students & Enrollments', href: '/admin/students', icon: Users },
    { label: 'Orders & Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Quizzes & Tests', href: '/admin/quizzes', icon: FileText },
    { label: 'Live Classes', href: '/admin/live', icon: Video },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/courses' && pathname.startsWith('/admin/lessons')) return true;
    return pathname.startsWith(href);
  };

  const handleAdminSignOut = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsVerifiedAdmin(true);
      return;
    }

    let isMounted = true;
    async function checkServerAdmin() {
      try {
        if (user && isAuthorizedAdminEmail(user.email)) {
          if (isMounted) setIsVerifiedAdmin(true);
          return;
        }

        const res = await fetch('/api/admin/auth/verify', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.authorized && isMounted) {
            setIsVerifiedAdmin(true);
            return;
          }
        }
        if (isMounted) setIsVerifiedAdmin(false);
      } catch {
        if (isMounted) setIsVerifiedAdmin(false);
      }
    }

    if (isAuthReady) {
      checkServerAdmin();
    }

    return () => {
      isMounted = false;
    };
  }, [pathname, isAuthReady, user]);

  // If user is accessing the login page itself, always allow rendering without admin session
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // While authentication state is hydrating or verifying server-side, show loader
  if (!isAuthReady || isVerifiedAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Verifying Administrator Session...
        </p>
      </div>
    );
  }

  // If user is not authorized administrator, deny access securely
  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 text-white shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight">
              Administrator Privileges Required
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This area is strictly restricted to authorized academy administrators and faculty.
              Students and unauthorized visitors cannot access this control center.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/admin/login"
              className="block w-full py-3.5 px-4 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
            >
              Sign in with Administrator Credentials →
            </Link>
            <Link
              href="/dashboard"
              className="block text-xs font-bold text-slate-400 hover:text-white transition pt-1"
            >
              ← Return to Student Dashboard
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
        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  active ? 'bg-[#046BD2] text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white ml-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleAdminSignOut}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition flex-shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
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
            ● Authorized Faculty
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
                    ? 'bg-[#046BD2] text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white shadow-sm">
                    {item.badge}
                  </span>
                ) : active ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Student View Shortcut & Admin Sign Out */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <span>View Student Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleAdminSignOut}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold bg-slate-950/80 hover:bg-red-950/60 hover:text-red-400 text-slate-400 border border-slate-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out (Admin)</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
