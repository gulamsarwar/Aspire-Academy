'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  Users,
  CheckSquare,
  User,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide mobile bottom nav during full-screen video learn sessions or admin routes
  const isLearnPlayer = pathname.includes('/learn') || pathname.startsWith('/admin');
  if (isLearnPlayer) {
    return null;
  }

  const tabs = [
    {
      id: 'study',
      label: 'Home',
      href: '/dashboard',
      icon: GraduationCap,
      isActive: (p: string) =>
        p === '/dashboard' ||
        p === '/dashboard/classes' ||
        p === '/dashboard/schedule',
    },
    {
      id: 'courses',
      label: 'My Courses',
      href: '/dashboard/courses',
      icon: BookOpen,
      isActive: (p: string) => p.startsWith('/dashboard/courses') || p === '/courses',
    },
    {
      id: 'batches',
      label: 'Batches',
      href: '/dashboard/batches',
      icon: Users,
      isActive: (p: string) => p.startsWith('/dashboard/batches') || p.startsWith('/batches'),
    },
    {
      id: 'test',
      label: 'Tests',
      href: '/dashboard/tests',
      icon: CheckSquare,
      isActive: (p: string) => p.startsWith('/dashboard/tests'),
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      isActive: (p: string) => p.startsWith('/dashboard/profile'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] transition-all"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.35rem)',
      }}
    >
      <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive(pathname);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition duration-150 select-none ${
                active
                  ? 'text-[#046BD2] dark:text-sky-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
              </div>

              <span className={`text-[10px] mt-1 tracking-tight leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>

              {active && (
                <span className="absolute -bottom-0.5 w-5 h-0.5 rounded-full bg-[#046BD2] dark:bg-sky-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
