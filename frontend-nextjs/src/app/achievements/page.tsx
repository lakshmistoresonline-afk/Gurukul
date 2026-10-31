'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Flame, Star, CheckCircle, Lock } from 'lucide-react';
import { getStudentProgress, StudentProgressState } from '../../lib/studentProgressStore';

export default function AchievementsPage() {
  const [progress, setProgress] = useState<StudentProgressState>({
    completedChapters: [],
    lastActivity: null,
    quizScores: [],
    streakDays: 0,
    lastActiveDate: null,
    bookmarks: [],
    practiceMarked: []
  });

  useEffect(() => {
    setProgress(getStudentProgress());
  }, []);

  const completedCount = progress.completedChapters.length;
  const streak = progress.streakDays;
  const quizzesCompleted = progress.quizScores.length;

  const achievementList = [
    {
      title: 'First Lesson Started',
      desc: 'Start reading your first Class 5 NCERT chapter.',
      unlocked: progress.lastActivity !== null,
      icon: Star,
      color: 'text-amber-400 bg-amber-500/20'
    },
    {
      title: 'Streak Starter',
      desc: 'Maintain a 3-day continuous learning streak.',
      unlocked: streak >= 3,
      icon: Flame,
      color: 'text-orange-400 bg-orange-500/20'
    },
    {
      title: 'Quiz Conqueror',
      desc: 'Complete your first interactive chapter quiz.',
      unlocked: quizzesCompleted > 0,
      icon: Trophy,
      color: 'text-teal-400 bg-teal-500/20'
    },
    {
      title: 'Class 5 Scholar',
      desc: 'Master 5 chapters across Class 5 curriculum.',
      unlocked: completedCount >= 5,
      icon: Award,
      color: 'text-indigo-400 bg-indigo-500/20'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" /> My Badges &amp; Achievements
        </h1>
        <p className="text-slate-400 text-sm mt-1">Authentic academic achievements unlocked as you complete NCERT Class 5 lessons and quizzes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievementList.map((a, idx) => {
          const Icon = a.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border flex flex-col items-center text-center space-y-3 transition-all ${
                a.unlocked
                  ? 'bg-slate-900 border-teal-500/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${a.unlocked ? a.color : 'bg-slate-800 text-slate-500'}`}>
                {a.unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              </div>
              <h3 className="font-bold text-white text-base">{a.title}</h3>
              <p className="text-xs text-slate-400">{a.desc}</p>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono ${a.unlocked ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-500'}`}>
                {a.unlocked ? 'Unlocked 🎉' : 'Locked 🔒'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
