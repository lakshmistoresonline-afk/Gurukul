'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Flame,
  Award,
  ArrowRight,
  PlayCircle,
  BrainCircuit,
  Compass,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { getCurriculumHierarchy } from '../lib/curriculumClient';

export default function StudentDashboard() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load curriculum hierarchy:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const class5Data = hierarchy.find((item: any) => item.grade === '5') || {
    subjects: [
      { subject: 'English', canonical_subject: 'english' },
      { subject: 'Hindi', canonical_subject: 'hindi' },
      { subject: 'Mathematics', canonical_subject: 'maths' },
      { subject: 'Science', canonical_subject: 'science' }
    ]
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/60 via-indigo-950 to-slate-900 border border-teal-500/30 p-8 shadow-2xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Welcome Back, Student!
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Class 5 Learning Command Center
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Continue your NCERT mastery journey across English, Hindi, Mathematics, and Science. Your progress is synced across all devices.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:brightness-110 transition-all"
            >
              <PlayCircle className="w-4 h-4" /> Continue Learning
            </Link>
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <Compass className="w-4 h-4 text-teal-400" /> View Learning Journey
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics & Streak Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">5 Days</div>
            <div className="text-xs text-slate-400 font-medium">Learning Streak</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">12 / 40</div>
            <div className="text-xs text-slate-400 font-medium">Chapters Mastered</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">85%</div>
            <div className="text-xs text-slate-400 font-medium">Quiz Accuracy</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">4 Badges</div>
            <div className="text-xs text-slate-400 font-medium">Achievements</div>
          </div>
        </div>
      </div>

      {/* Class 5 Subject Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" /> Class 5 NCERT Subjects
          </h2>
          <Link href="/subjects" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
            Explore All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'English',
              code: 'english',
              color: 'from-blue-600 to-indigo-700',
              chapters: '10 Chapters',
              desc: 'Santoor textbook stories, poems, & grammar activities'
            },
            {
              name: 'Hindi',
              code: 'hindi',
              color: 'from-orange-600 to-amber-700',
              chapters: '12 Chapters',
              desc: 'हिन्दी पाठ्यपुस्तक, कविताएँ एवं व्याकरण'
            },
            {
              name: 'Mathematics',
              code: 'maths',
              color: 'from-teal-600 to-emerald-700',
              chapters: '15 Chapters',
              desc: 'Maths Mela, fraction strips, tessellations & logic'
            },
            {
              name: 'Science / EVS',
              code: 'science',
              color: 'from-emerald-600 to-teal-700',
              chapters: '10 Chapters',
              desc: 'Water cycle, root bridges, digestion & ecosystem'
            }
          ].map((subj) => (
            <div
              key={subj.code}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-teal-500/50 hover:shadow-xl transition-all"
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${subj.color} flex items-center justify-center text-white font-bold`}>
                  {subj.name[0]}
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-teal-300 transition-colors">
                  {subj.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{subj.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {subj.chapters}</span>
                <Link
                  href={`/curriculum?grade=5&subject=${subj.code}&book=${subj.code}&part=main&unit=U01&chapter_id=G5-${subj.code.toUpperCase().slice(0,3)}-U01-C01`}
                  className="font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
