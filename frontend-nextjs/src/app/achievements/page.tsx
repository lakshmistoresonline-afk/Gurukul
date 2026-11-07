'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Trophy, Award, Flame, Star, Lock, BookOpen, Target, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import {
  getStudentProgress,
  StudentProgressState,
  syncStudentProgressFromFirestore,
  saveSelectedGradePreference,
  getAuthoritativeClassForUser
} from '../../lib/studentProgressStore';
import { getCurriculumHierarchy } from '../../lib/curriculumClient';

export default function AchievementsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [progress, setProgress] = useState<StudentProgressState>({
    completedChapters: [],
    lastActivity: null,
    quizScores: [],
    streakDays: 0,
    lastActiveDate: null,
    bookmarks: [],
    practiceMarked: [],
    eventsLedger: []
  });

  useEffect(() => {
    async function loadHierarchyData() {
      try {
        const hier = await getCurriculumHierarchy();
        setHierarchy(hier || []);
      } catch (e) {
        console.error('Failed to load hierarchy for achievements:', e);
      }
    }
    loadHierarchyData();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setProgress(synced);
      setSelectedGrade(authGrade);
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

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    const targetUid = currentUser ? currentUser.uid : 'guest';
    await saveSelectedGradePreference(g, targetUid);
  };

  const selectedGradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  let totalGradeChapters = 0;
  (selectedGradeData?.subjects || []).forEach((s: any) => {
    (s.books || []).forEach((b: any) => {
      (b.units || []).forEach((u: any) => {
        totalGradeChapters += (u.chapters || []).length;
      });
    });
  });
  if (totalGradeChapters === 0) totalGradeChapters = selectedGrade === '5' ? 47 : selectedGrade === '6' ? 64 : 305;

  const completedCount = progress.completedChapters.length;
  const streak = progress.streakDays;
  const quizzesCompleted = progress.quizScores.length;
  const verifiedEventsCount = (progress.eventsLedger || []).length;

  const achievementList = [
    {
      title: 'First Chapter Completed',
      desc: `Complete your first NCERT Class ${selectedGrade} lesson chapter.`,
      unlocked: completedCount >= 1,
      icon: BookOpen,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      title: 'Practice Pro',
      desc: 'Mark 3 chapters for dedicated revision practice.',
      unlocked: (progress.practiceMarked || []).length >= 3,
      icon: Target,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Quiz Champion',
      desc: 'Complete your first interactive chapter quiz.',
      unlocked: quizzesCompleted > 0,
      icon: Trophy,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      title: 'Curious Explorer',
      desc: 'Maintain a continuous 3-day learning streak.',
      unlocked: streak >= 3,
      icon: Flame,
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    }
  ];

  const unlockedCount = achievementList.filter(a => a.unlocked).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Gamified Rewards & Badges
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" /> Achievements — Class {selectedGrade}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Track your verified progress, earn badges, and celebrate your Class {selectedGrade} milestones!
            </p>
          </div>

          {/* Class Switcher Badge */}
          {currentUser?.email?.includes('admin') ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-black text-slate-600 px-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-600" /> Admin Class:
              </span>
              {['5', '6', '7'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeSelect(g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Class {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-teal-200 text-teal-900 text-xs font-extrabold shadow-2xs">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>Assigned Class: <strong className="font-mono text-teal-700">Class {selectedGrade}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Level & Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 font-extrabold uppercase">ACADEMIC LEVEL</div>
              <div className="text-base font-black text-slate-900">Curious Learner</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-600 font-bold">
              <span>{completedCount} / {totalGradeChapters} Chapters</span>
              <span>{streak} Day Streak</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-teal-500 to-indigo-600 h-full" style={{ width: `${Math.min(100, (completedCount / totalGradeChapters) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 1: Chapters Completed */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{completedCount}</div>
            <div className="text-xs text-slate-500 font-extrabold">Chapters Completed</div>
          </div>
        </div>

        {/* Metric 2: Verified Activity Events */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{verifiedEventsCount}</div>
            <div className="text-xs text-slate-500 font-extrabold">Learning Events Logged</div>
          </div>
        </div>

        {/* Metric 3: Badges Earned */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{unlockedCount} / 4</div>
            <div className="text-xs text-slate-500 font-extrabold">Badges Earned</div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" /> Class {selectedGrade} Badges
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievementList.map((a, idx) => {
            const Icon = a.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border flex flex-col items-center text-center space-y-3 transition-all shadow-sm ${
                  a.unlocked
                    ? 'bg-white border-teal-300 ring-1 ring-teal-500/20 shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xs ${a.unlocked ? a.color : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                  {a.unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                </div>
                <h3 className="font-black text-slate-900 text-base">{a.title}</h3>
                <p className="text-xs text-slate-600 font-semibold">{a.desc}</p>
                <span className={`text-[10px] px-3.5 py-1 rounded-full font-mono font-black ${a.unlocked ? 'bg-teal-100 text-teal-900 border border-teal-300' : 'bg-slate-200 text-slate-600'}`}>
                  {a.unlocked ? 'Unlocked 🎉' : 'Locked 🔒'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
