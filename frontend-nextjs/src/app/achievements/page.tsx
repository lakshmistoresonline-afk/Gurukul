'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Trophy, Award, Flame, Star, Lock, BookOpen, Target, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getStudentProgress, StudentProgressState, syncStudentProgressFromFirestore } from '../../lib/studentProgressStore';

export default function AchievementsPage() {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const synced = await syncStudentProgressFromFirestore(user.uid);
        setProgress(synced);
      } else {
        setProgress(getStudentProgress('guest'));
      }
    });
    return () => unsubscribe();
  }, []);

  const completedCount = progress.completedChapters.length;
  const streak = progress.streakDays;
  const quizzesCompleted = progress.quizScores.length;
  const verifiedEventsCount = (progress.eventsLedger || []).length;

  const achievementList = [
    {
      title: 'First Chapter Completed',
      desc: 'Complete your first NCERT Class 5 lesson chapter.',
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" /> Achievements
        </h1>
        <p className="text-slate-600 text-sm mt-1">Track your progress, earn badges and celebrate your learning.</p>
      </div>

      {/* Summary Level & Metrics Row (Light-Theme Reference Design - Screenshot 08) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500 font-bold uppercase">Academic Level</div>
              <div className="text-base font-black text-slate-900">Curious Learner</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-600">
              <span>{completedCount} Chapters Mastered</span>
              <span>{streak} Day Streak</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-teal-500 to-indigo-600 h-full" style={{ width: `${Math.min(100, (completedCount / 47) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 1: Chapters Completed */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{completedCount}</div>
            <div className="text-xs text-slate-500 font-semibold">Chapters Completed</div>
          </div>
        </div>

        {/* Metric 2: Verified Activity Events */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{verifiedEventsCount}</div>
            <div className="text-xs text-slate-500 font-semibold">Learning Events Logged</div>
          </div>
        </div>

        {/* Metric 3: Badges Earned */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{unlockedCount} / 4</div>
            <div className="text-xs text-slate-500 font-semibold">Badges Earned</div>
          </div>
        </div>
      </div>

      {/* Badges Grid (Light-Theme Reference Design - Screenshot 08) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" /> My Badges
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievementList.map((a, idx) => {
            const Icon = a.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border flex flex-col items-center text-center space-y-3 transition-all shadow-sm ${
                  a.unlocked
                    ? 'bg-white border-teal-200 ring-1 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${a.unlocked ? a.color : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                  {a.unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                <p className="text-xs text-slate-600">{a.desc}</p>
                <span className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold ${a.unlocked ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-slate-200 text-slate-600'}`}>
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
