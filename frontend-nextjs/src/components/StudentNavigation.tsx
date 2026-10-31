'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Compass,
  Bot,
  FlaskConical,
  Target,
  Trophy,
  Bookmark,
  Sparkles
} from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'My Learning', href: '/', icon: LayoutDashboard },
  { label: 'Subjects', href: '/subjects', icon: BookOpen },
  { label: 'Learning Journey', href: '/journey', icon: Compass },
  { label: 'AI Tutor', href: '/curriculum', icon: Bot },
  { label: 'Discovery Lab', href: '/discovery', icon: FlaskConical },
  { label: 'Practice Arena', href: '/practice', icon: Target },
  { label: 'Achievements', href: '/achievements', icon: Trophy },
  { label: 'My Library', href: '/library', icon: Bookmark },
];

export function StudentNavigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0 z-40 hidden md:flex">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
          G
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base flex items-center gap-1.5">
            GURUKUL <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">AI</span>
          </h1>
          <p className="text-xs text-slate-400">Class 5 NCERT Companion</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-white border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Class 5 Active Scope Tag */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-950/60 border border-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Scope
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px]">Active</span>
        </div>
        <p className="text-xs text-slate-400">Grade 5 NCERT Curriculum</p>
      </div>
    </aside>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 px-2 py-2 flex items-center justify-around">
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium ${
              isActive ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </div>
  );
}
