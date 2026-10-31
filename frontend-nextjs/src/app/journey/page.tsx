'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LearningJourneyPage() {
  const journeyStages = [
    { stage: 1, name: 'Discover', module: 'Overview.json', desc: 'Explore chapter storyboards, central themes, and learning goals.', color: 'text-amber-400 bg-amber-500/20' },
    { stage: 2, name: 'Learn', module: 'Notes.json', desc: 'Master comprehensive pedagogical summaries, role-plays, and STEM drawers.', color: 'text-blue-400 bg-blue-500/20' },
    { stage: 3, name: 'Understand', module: 'Foundational.json', desc: 'Practice language drills, sorting matrices, and core concepts.', color: 'text-teal-400 bg-teal-500/20' },
    { stage: 4, name: 'Explore', module: 'Mindmaps.json & media_directory.json', desc: 'Interact with 16:9 hotspot diagrams and visual concept trees.', color: 'text-indigo-400 bg-indigo-500/20' },
    { stage: 5, name: 'Practise', module: 'Flashcards.json & Quiz.json', desc: '3D active recall flashcards with SuperMemo-2 (SM-2) and timed quizzes.', color: 'text-purple-400 bg-purple-500/20' },
    { stage: 6, name: 'Challenge', module: 'Master.json', desc: 'Solve higher-order challenge problems and log portfolio achievements.', color: 'text-emerald-400 bg-emerald-500/20' },
    { stage: 7, name: 'Master', module: 'Question_Papers.json', desc: 'Test exam readiness with model question papers and step-by-step keys.', color: 'text-rose-400 bg-rose-500/20' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> NCERT 7-Stage Pathway
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Compass className="w-8 h-8 text-teal-400" /> Class 5 Learning Journey
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Follow our 7-stage interactive pathway mapping every Class 5 chapter from initial discovery to exam mastery.
        </p>
      </div>

      <div className="space-y-4">
        {journeyStages.map((s) => (
          <div
            key={s.stage}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-500/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${s.color}`}>
                {s.stage}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Stage {s.stage}: {s.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{s.module}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>

            <Link
              href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition-all shrink-0"
            >
              Start Stage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
