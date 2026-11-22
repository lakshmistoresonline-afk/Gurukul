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
import { getStudentProgress, syncStudentProgressFromFirestore, saveSelectedGradePreference } from '../lib/studentProgressStore';
import { getCurriculumHierarchy } from '../lib/curriculumClient';
import LoginScreen from './LoginScreen';

export const NAV_ITEMS = [
  { label: 'My Learning', href: '/', icon: LayoutDashboard },
  { label: 'Subjects', href: '/subjects', icon: BookOpen },
  { label: 'Learning Journey', href: '/journey', icon: Compass },
  { label: 'AI Tutor', href: '/tutor', icon: Bot },
  { label: 'Practice Arena', href: '/practice', icon: Target },
];

export function StudentNavigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [availableGrades, setAvailableGrades] = useState<string[]>(['5', '6', '7', '8', '9']);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadHierarchyGrades() {
      try {
        const hier = await getCurriculumHierarchy();
        if (hier && hier.length > 0) {
          const grades = hier.map((h: any) => String(h.grade)).sort();
          if (grades.length > 0) setAvailableGrades(grades);
        }
      } catch (e) {
        console.warn('Failed to load hierarchy grades for navigation:', e);
      }
    }
    loadHierarchyGrades();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      setSelectedGrade(synced.selectedGrade || '5');
    });
    return () => unsubscribe();
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    const targetUid = currentUser ? currentUser.uid : 'guest';
    await saveSelectedGradePreference(g, targetUid);
    window.dispatchEvent(new CustomEvent('gradeChanged', { detail: { uid: targetUid, grade: g } }));
  };

  return (
    <aside className="group w-16 hover:w-64 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white flex flex-col h-screen sticky top-0 z-40 hidden md:flex shadow-2xl shrink-0 border-r border-white/10 rounded-r-3xl my-0 transition-all duration-300 ease-in-out overflow-hidden">
      {/* Brand Header */}
      <div className="p-3 group-hover:p-6 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-500/20 border border-white/20 shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h1 className="font-black text-white tracking-wide text-lg flex items-center gap-1.5">
              Gurukul <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/25 text-teal-200 font-mono border border-teal-300/30">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NCERT Digital Companion</p>
          </div>
        </div>
      </div>

      {/* Authoritative Student Assigned Class Badge */}
      <div className="px-3 group-hover:px-5 py-3 border-b border-white/10 bg-black/20 space-y-1.5 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-black uppercase tracking-wider whitespace-nowrap">
          <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-teal-400 shrink-0" /> <span className="hidden group-hover:inline">AUTHORITATIVE CLASS:</span></span>
          <span className="text-teal-300 font-mono font-black text-xs px-2 py-0.5 bg-teal-500/20 rounded-md border border-teal-400/30">C{selectedGrade}</span>
        </div>

        {currentUser?.email?.includes('admin') ? (
          <div className="hidden group-hover:grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-xl border border-white/10 mt-1">
            {availableGrades.map((g) => (
              <button
                key={g}
                onClick={() => handleGradeSelect(g)}
                className={`py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Class {g}
              </button>
            ))}
          </div>
        ) : (
          <p className="hidden group-hover:block text-[10px] text-slate-400 font-medium">Assigned by Firestore Student Profile</p>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 group-hover:p-4 space-y-1.5 overflow-y-auto no-scrollbar">
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
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3.5 px-3.5 group-hover:px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 border border-teal-300/40'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Student Profile & Auth Status */}
      <div className="p-4 border-t border-white/10 bg-black/20 rounded-br-3xl">
        {(currentUser || (typeof window !== 'undefined' && localStorage.getItem('gurukul_dev_logged_in') === 'true')) ? (
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-2.5 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-200 flex items-center justify-center shrink-0 border border-teal-300/30 font-black">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate capitalize">
                {currentUser?.displayName || (typeof window !== 'undefined' && localStorage.getItem('gurukul_active_user_email') ? localStorage.getItem('gurukul_active_user_email')?.split('@')[0] : 'Learner')}
              </p>
              <p className="text-[10px] text-slate-300 truncate font-mono">
                {currentUser?.email || (typeof window !== 'undefined' && localStorage.getItem('gurukul_active_user_email')) || 'Logged In'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-200 px-1 font-medium">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-300" /> Guest Learner</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 font-mono font-bold border border-teal-300/30">Class {selectedGrade}</span>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-300/30"
            >
              <UserIcon className="w-4 h-4 text-white" />
              <span>Sign In / Login</span>
            </button>
          </div>
        )}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              aria-label="Close Login Modal"
            >
              <X className="w-5 h-5" />
            </button>
            <LoginScreen onLoginSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </aside>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [availableGrades, setAvailableGrades] = useState<string[]>(['5', '6', '7']);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      setSelectedGrade(prog.selectedGrade || '5');
    });
    return () => unsubscribe();
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    const targetUid = currentUser ? currentUser.uid : 'guest';
    await saveSelectedGradePreference(g, targetUid);
    window.dispatchEvent(new CustomEvent('gradeChanged', { detail: { uid: targetUid, grade: g } }));
  };

  const handleLogOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gurukul_dev_logged_in');
        localStorage.removeItem('gurukul_active_user_email');
        localStorage.removeItem('gurukul_active_grade');
        window.dispatchEvent(new Event('dev_login_event'));
      }
      await signOut(auth);
      setMoreOpen(false);
    } catch (e) {
      console.error('Failed to log out:', e);
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 text-white border-t border-white/10 z-50 px-1 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
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
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition-all min-w-[56px] text-center ${
                isActive ? 'text-teal-300 bg-white/15 shadow-2xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile More Sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#0F172A] border-t border-white/20 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-teal-300" />
                <span className="text-xs font-bold">{currentUser ? (currentUser.displayName || currentUser.email) : 'Guest Mode'}</span>
              </div>
              <button onClick={() => setMoreOpen(false)} aria-label="Close menu" className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Select Class:</label>
              <div className="grid grid-cols-3 gap-2">
                {availableGrades.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGradeSelect(g)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedGrade === g
                        ? 'bg-teal-500 text-white border-teal-300'
                        : 'bg-white/10 text-slate-200 border-white/10'
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

            {currentUser && (
              <button
                onClick={handleLogOut}
                className="w-full mt-2 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
