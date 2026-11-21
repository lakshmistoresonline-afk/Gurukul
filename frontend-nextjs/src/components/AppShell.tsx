'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { StudentNavigation, MobileBottomNavigation } from './StudentNavigation';
import LoginScreen from './LoginScreen';
import {
  Search,
  Sparkles,
  Flame,
  Star,
  GraduationCap,
  User as UserIcon,
  LogOut,
  Bell,
  BarChart3,
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  getStudentProgress,
  syncStudentProgressFromFirestore,
  getAuthoritativeClassForUser
} from '../lib/studentProgressStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDevLoggedIn, setIsDevLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gurukul_dev_logged_in') === 'true';
    }
    return false;
  });
  const [initializing, setInitializing] = useState<boolean>(true);
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const activeEmail = localStorage.getItem('gurukul_active_user_email');
      const activeGrade = localStorage.getItem('gurukul_active_grade');
      if (activeGrade) return activeGrade;
      if (activeEmail) return getAuthoritativeClassForUser({ email: activeEmail }, 'guest');
    }
    return '5';
  });
  const [streakDays, setStreakDays] = useState<number>(0);
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);

  const academicLevel = xpPoints >= 1000 ? 'Level 3: Master Scholar 🎓' : xpPoints >= 300 ? 'Level 2: Curious Explorer 🏆' : 'Level 1: Novice Scholar ⭐';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setInitializing(false);

      if (user) {
        syncStudentProgressFromFirestore(user.uid).then((synced) => {
          const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, user.uid);
          setSelectedGrade(authGrade);
          setStreakDays(synced.streakDays || 0);
          const realXp = (synced.completedChapters.length * 100) + (synced.quizScores.length * 50) + ((synced.eventsLedger || []).length * 20);
          setXpPoints(realXp);
        }).catch(() => {
          const authGrade = getAuthoritativeClassForUser(user, user.uid);
          setSelectedGrade(authGrade);
        });
      } else {
        const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_user_email') : null;
        const mockUser = activeEmail ? { email: activeEmail } : null;
        const local = getStudentProgress('guest');
        const authGrade = local.selectedGrade || (mockUser ? getAuthoritativeClassForUser(mockUser, 'guest') : '5');
        setSelectedGrade(authGrade);
        setStreakDays(local.streakDays || 0);
        setXpPoints((local.completedChapters.length * 100) + (local.quizScores.length * 50));
      }
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_user_email') : null;
      const mockUser = authUser || (activeEmail ? { email: activeEmail } : null);
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(mockUser, targetUid);
      setSelectedGrade(authGrade);
    };

    const handleDevLogin = () => {
      setIsDevLoggedIn(true);
      setInitializing(false);
      const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_user_email') : null;
      const mockUser = activeEmail ? { email: activeEmail } : null;
      if (mockUser) {
        const authGrade = getAuthoritativeClassForUser(mockUser, 'guest');
        setSelectedGrade(authGrade);
      }
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    window.addEventListener('dev_login_event', handleDevLogin);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
      window.removeEventListener('dev_login_event', handleDevLogin);
    };
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center text-slate-900">
        <div className="flex items-center gap-3 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-black tracking-wide text-slate-800">Opening Gurukul AI Workspace...</span>
        </div>
      </div>
    );
  }

  if (!currentUser && !isDevLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('gurukul_dev_logged_in', 'true');
          }
          setIsDevLoggedIn(true);
        }}
      />
    );
  }

  const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_user_email') : null;
  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || (activeEmail ? (activeEmail.includes('admin') ? 'System Admin' : `Student ${getAuthoritativeClassForUser({ email: activeEmail }, 'guest')}`) : 'Student 10');

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-teal-500 selection:text-white">
      {/* Curved Sidebar Navigation */}
      <StudentNavigation />

      {/* Main Container with Top App Header Bar */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Sticky Top Header Bar (100% Focused on Learning Area) */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-8 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-black border border-teal-300/80 shadow-2xs font-mono">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>NCERT Class {selectedGrade}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100/80 p-1 pl-2.5 rounded-xl border border-slate-200/80">
              <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-black text-slate-800 hidden sm:inline capitalize">{studentName}</span>
            </div>

            {/* Prominent Log Out Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('gurukul_dev_logged_in');
                  localStorage.removeItem('gurukul_active_user_email');
                  localStorage.removeItem('gurukul_active_grade');
                  window.dispatchEvent(new Event('dev_login_event'));
                }
                setIsDevLoggedIn(false);
                setCurrentUser(null);
                auth.signOut().catch(() => {});
              }}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              title="Log Out of Gurukul AI"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Page Body - 100% Focused on Learning Area */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      <MobileBottomNavigation />
    </div>
  );
}
