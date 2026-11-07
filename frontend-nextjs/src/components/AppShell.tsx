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
  Bell
} from 'lucide-react';
import {
  getStudentProgress,
  syncStudentProgressFromFirestore,
  getAuthoritativeClassForUser
} from '../lib/studentProgressStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [streakDays, setStreakDays] = useState<number>(1);
  const [xpPoints, setXpPoints] = useState<number>(350);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setInitializing(false);

      if (user) {
        syncStudentProgressFromFirestore(user.uid).then((synced) => {
          const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, user.uid);
          setSelectedGrade(authGrade);
          setStreakDays(synced.streakDays || 1);
          setXpPoints((synced.completedChapters.length * 100) + (synced.quizScores.length * 50) + 100);
        }).catch(() => {
          const authGrade = getAuthoritativeClassForUser(user, user.uid);
          setSelectedGrade(authGrade);
        });
      } else {
        const local = getStudentProgress('guest');
        setSelectedGrade(local.selectedGrade || '5');
      }
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid);
      setSelectedGrade(authGrade);
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
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

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => setInitializing(false)} />;
  }

  const studentName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-teal-500 selection:text-white">
      {/* Curved Sidebar Navigation */}
      <StudentNavigation />

      {/* Main Container with Top App Header Bar */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-black border border-teal-300/80 shadow-2xs font-mono">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>NCERT Class {selectedGrade}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-black font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{streakDays} Day Streak</span>
            </span>

            <span className="hidden lg:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100/80 border border-indigo-300/80 text-indigo-900 text-xs font-black font-mono">
              <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>{xpPoints} XP</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-100/80 p-1.5 pl-3 rounded-2xl border border-slate-200/80">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-black text-slate-800 hidden sm:inline capitalize">{studentName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      <MobileBottomNavigation />
    </div>
  );
}
