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

  const totalXp = (completedCount * 100) + (quizzesCompleted * 50) + (streak * 20);
  const currentLevel = Math.floor(totalXp / 300) + 1;
  const xpInLevel = totalXp % 300;

  const achievementList = [
    {
      title: 'First Chapter Completed',
      desc: 'Complete your first NCERT Class 5 lesson chapter.',
      unlocked: completedCount >= 1,
      icon: BookOpen,
      color: 'text-teal-400 bg-teal-500/20'
    },
    {
      title: 'Practice Pro',
      desc: 'Mark 3 chapters for dedicated revision practice.',
      unlocked: (progress.practiceMarked || []).length >= 3,
      icon: Target,
      color: 'text-amber-400 bg-amber-500/20'
    },
    {
      title: 'Quiz Champion',
      desc: 'Complete your first interactive chapter quiz.',
      unlocked: quizzesCompleted > 0,
      icon: Trophy,
      color: 'text-purple-400 bg-purple-500/20'
    },
    {
      title: 'Curious Explorer',
      desc: 'Maintain a continuous 3-day learning streak.',
      unlocked: streak >= 3,
      icon: Flame,
      color: 'text-orange-400 bg-orange-500/20'
    }
  ];

  const unlockedCount = achievementList.filter(a => a.unlocked).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" /> Achievements
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your progress, earn badges and celebrate your learning.</p>
      </div>

      {/* Summary Level & Metrics Row (Matching Reference Screenshot 08) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 font-bold uppercase">Level {currentLevel}</div>
              <div className="text-base font-black text-white">Curious Learner</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{xpInLevel} / 300 XP</span>
              <span>{totalXp} Total XP</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full" style={{ width: `${Math.min(100, (xpInLevel / 300) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 1: Chapters Completed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{completedCount}</div>
            <div className="text-xs text-slate-400 font-semibold">Chapters Completed</div>
          </div>
        </div>

        {/* Metric 2: Challenges Won */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{quizzesCompleted}</div>
            <div className="text-xs text-slate-400 font-semibold">Challenges Won</div>
          </div>
        </div>

        {/* Metric 3: Badges Earned */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{unlockedCount} / 4</div>
            <div className="text-xs text-slate-400 font-semibold">Badges Earned</div>
          </div>
        </div>
      </div>

      {/* Badges Grid (Matching Reference Screenshot 08) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-400" /> My Badges
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievementList.map((a, idx) => {
            const Icon = a.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border flex flex-col items-center text-center space-y-3 transition-all shadow-xl ${
                  a.unlocked
                    ? 'bg-slate-900 border-teal-500/40'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${a.unlocked ? a.color : 'bg-slate-800 text-slate-500'}`}>
                  {a.unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                </div>
                <h3 className="font-bold text-white text-base">{a.title}</h3>
                <p className="text-xs text-slate-400">{a.desc}</p>
                <span className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold ${a.unlocked ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-500'}`}>
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
