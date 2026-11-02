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
  X,
  GraduationCap
} from 'lucide-react';
import { getStudentProgress, saveSelectedGradePreference } from '../lib/studentProgressStore';

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
  const [selectedGrade, setSelectedGrade] = useState<string>('5');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const prog = getStudentProgress(user?.uid || 'guest');
      setSelectedGrade(prog.selectedGrade || '5');
    });
    return () => unsubscribe();
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    await saveSelectedGradePreference(g, currentUser?.uid || 'guest');
    window.dispatchEvent(new Event('gradeChanged'));
  };

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
      <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-black text-lg border border-white/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-white tracking-wide text-base flex items-center gap-1.5">
              Gurukul <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-400/30 text-indigo-100 font-mono border border-indigo-300/30">AI</span>
            </h1>
            <p className="text-[10px] text-blue-200/80 font-medium">NCERT Digital Companion</p>
          </div>
        </div>
      </div>

      {/* Global Grade Selector Toggle */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/10 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-blue-200/90 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-teal-300" /> Active Class:</span>
          <span className="text-teal-300 font-mono">Class {selectedGrade}</span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl border border-white/10">
          {['5', '6', '7'].map((g) => (
            <button
              key={g}
              onClick={() => handleGradeSelect(g)}
              className={`py-1 rounded-lg text-xs font-black transition-all ${
                selectedGrade === g
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-blue-100/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Class {g}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white/20 text-white shadow-md border border-white/30 backdrop-blur-md'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-blue-200/80'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Student Profile & Auth Status */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        {currentUser ? (
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-hidden">
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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 font-mono font-bold border border-teal-300/30">Class {selectedGrade}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');

  useEffect(() => {
    const prog = getStudentProgress('guest');
    setSelectedGrade(prog.selectedGrade || '5');
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    await saveSelectedGradePreference(g, 'guest');
    window.dispatchEvent(new Event('gradeChanged'));
  };

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
              <h3 className="font-bold text-white text-base">Select Class &amp; Destination</h3>
              <button onClick={() => setMoreOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-200">Active Class:</label>
              <div className="grid grid-cols-3 gap-2">
                {['5', '6', '7'].map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGradeSelect(g)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedGrade === g
                        ? 'bg-teal-500 text-white border-teal-300'
                        : 'bg-white/10 text-blue-100 border-white/10'
                    }`}
                  >
                    Class {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
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
