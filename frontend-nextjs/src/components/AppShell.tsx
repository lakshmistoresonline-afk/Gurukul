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
        {/* Sticky Top Header Bar (Ultra-Compact for Maximum Learning Area) */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-8 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-black border border-teal-300/80 shadow-2xs font-mono">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>Class {selectedGrade}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-black font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{streakDays} Day Streak</span>
            </span>

            <button
              onClick={() => setShowLevelUpModal(true)}
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100/80 hover:bg-indigo-200 border border-indigo-300/80 text-indigo-900 text-xs font-black font-mono transition-all cursor-pointer"
              title="Click to view Academic Level & Badges"
            >
              <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>{xpPoints} XP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all items-center gap-1.5 cursor-pointer"
              title="Parent & Teacher Progress Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Analytics</span>
            </button>

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

        {/* Parent & Teacher Analytics Modal */}
        {showAnalyticsModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Parent & Teacher Analytics</h3>
                    <p className="text-xs text-slate-500 font-semibold">Class {selectedGrade} • {studentName}&apos;s Learning Report</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <div className="text-[10px] font-mono text-teal-700 font-black uppercase">STUDY STREAK</div>
                  <div className="text-xl font-black text-teal-950 flex items-center gap-1">
                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500" /> {streakDays} Days
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <div className="text-[10px] font-mono text-indigo-700 font-black uppercase">ACADEMIC XP</div>
                  <div className="text-xl font-black text-indigo-950 flex items-center gap-1">
                    <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" /> {xpPoints} XP
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Subject Mastery Status</span>
                  <span className="text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> High Accuracy</span>
                </div>

                <div className="space-y-2 text-xs font-bold">
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Mathematics</span>
                      <span className="font-mono text-teal-700">88% Mastery</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Science</span>
                      <span className="font-mono text-indigo-700">92% Mastery</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>English &amp; Languages</span>
                      <span className="font-mono text-amber-700">95% Mastery</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md transition-all"
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gamified Level-Up Celebration Modal */}
        {showLevelUpModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <Award className="w-16 h-16 text-amber-500 fill-amber-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-wider">Academic Milestone</span>
                <h3 className="text-2xl font-black text-slate-900 pt-2">{academicLevel}</h3>
                <p className="text-xs text-slate-600 font-semibold">You have accumulated <strong className="text-indigo-700 font-mono text-sm">{xpPoints} XP</strong> through lesson reading &amp; practice quizzes!</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold space-y-1 text-left">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Next Level Target:
                </div>
                <p>{xpPoints >= 1000 ? 'Highest Level Achieved! Keep maintaining your daily streak!' : `Earn ${1000 - xpPoints} more XP to reach Level 3: Master Scholar!`}</p>
              </div>

              <button
                onClick={() => setShowLevelUpModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Continue Learning 🎉
              </button>
            </div>
          </div>
        )}

        {/* Page Body */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      <MobileBottomNavigation />
    </div>
  );
}
