'use client';

import React from 'react';
import { Trophy, Award, Flame, Star, CheckCircle } from 'lucide-react';

export default function AchievementsPage() {
  const badges = [
    { title: 'Class 5 Pioneer', desc: 'Completed 5 chapters in English & Science.', date: 'Unlocked Oct 2026', icon: Trophy, color: 'text-amber-400 bg-amber-500/20' },
    { title: 'Streak Champion', desc: 'Maintained a 5-day learning streak.', date: 'Unlocked Oct 2026', icon: Flame, color: 'text-orange-400 bg-orange-500/20' },
    { title: 'Quiz Master', desc: 'Scored 100% in Class 5 Science Quiz.', date: 'Unlocked Oct 2026', icon: Star, color: 'text-teal-400 bg-teal-500/20' },
    { title: 'Vocab Scholar', desc: 'Reviewed 50 English flashcards with SM-2.', date: 'Unlocked Oct 2026', icon: Award, color: 'text-indigo-400 bg-indigo-500/20' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" /> My Achievements & Badges
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your academic milestones and engagement badges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${b.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-white text-base">{b.title}</h3>
              <p className="text-xs text-slate-400">{b.desc}</p>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 font-mono">
                {b.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
