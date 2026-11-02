'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  BookOpen,
  LayoutDashboard,
  Compass,
  Bot,
  FlaskConical,
  Target,
  Trophy,
  Bookmark,
  Sparkles,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'My Learning', href: '/', icon: LayoutDashboard },
  { label: 'Subjects', href: '/subjects', icon: BookOpen },
  { label: 'Learning Journey', href: '/journey', icon: Compass },
  { label: 'AI Tutor', href: '/tutor', icon: Bot },
  { label: 'Discovery Lab', href: '/discovery', icon: FlaskConical },
  { label: 'Practice Arena', href: '/practice', icon: Target },
  { label: 'Achievements', href: '/achievements', icon: Trophy },
  { label: 'My Library', href: '/library', icon: Bookmark },
];

export function StudentNavigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Failed to sign out:', e);
    }
  };

  return (
    <aside className="w-64 bg-[#244B91] text-white flex flex-col h-screen sticky top-0 z-40 hidden md:flex shadow-2xl shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-inner border border-white/20">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-black text-white tracking-wide text-lg flex items-center gap-1.5">
            Gurukul <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-400/30 text-indigo-100 font-mono border border-indigo-300/30">AI</span>
          </h1>
          <p className="text-[11px] text-blue-200/80 font-medium">NCERT Digital Companion</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.href === '/') {
            isActive = pathname === '/';
          } else if (item.label === 'AI Tutor') {
            isActive = pathname === '/tutor';
          } else {
            isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg border border-white/30 backdrop-blur-md'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-300' : 'text-blue-200/80'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Student Profile & Auth Status */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        {currentUser ? (
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-teal-400/20 text-teal-200 flex items-center justify-center shrink-0 border border-teal-300/30">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.displayName || currentUser.email?.split('@')[0] || 'Student'}</p>
                <p className="text-[10px] text-blue-200/80 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-blue-200 hover:text-rose-300 hover:bg-white/10 transition-all shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-blue-100/90 p-2 font-medium">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-300" /> Guest Learner</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 font-mono font-bold border border-teal-300/30">Active</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#244B91] text-white border-t border-white/10 z-50 px-2 py-2 flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.href === '/') {
            isActive = pathname === '/';
          } else if (item.label === 'AI Tutor') {
            isActive = pathname === '/tutor';
          } else {
            isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold ${
                isActive ? 'text-teal-300 bg-white/15' : 'text-blue-100/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold text-blue-100/80 hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>

      {/* Mobile More Sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#244B91] border-t border-white/20 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <h3 className="font-bold text-white text-base">All Navigation Destinations</h3>
              <button onClick={() => setMoreOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 transition-all"
                  >
                    <Icon className="w-4 h-4 text-teal-300" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
