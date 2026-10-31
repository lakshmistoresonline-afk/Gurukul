'use client';

import React from 'react';
import Link from 'next/link';
import { Target, HelpCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PracticeArenaPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Target className="w-8 h-8 text-amber-400" /> Practice Arena
        </h1>
        <p className="text-slate-400 text-sm mt-1">Test your mastery with chapter quizzes and model examination papers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Interactive Quizzes</h2>
          <p className="text-xs text-slate-400">Timed practice items with hints, step-by-step solution keys, and detailed feedback.</p>
          <Link
            href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Start Quiz Arena <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Model Question Papers</h2>
          <p className="text-xs text-slate-400">Categorized short/long examination question banks matching NCERT board pattern.</p>
          <Link
            href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs"
          >
            View Question Papers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
