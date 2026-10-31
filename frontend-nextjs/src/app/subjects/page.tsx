'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function SubjectsPage() {
  const class5Subjects = [
    {
      id: 'english',
      name: 'Class 5 English (Santoor)',
      chapters: 10,
      topics: ['Papa\'s Spectacles', 'The Scooter Race', 'Rainbow Spectrum', 'The Wise Parrot', 'Frog Metamorphosis', 'Rooftop Tanka', 'Gilli Danda', 'Panchayat Court', 'Vocation', 'Glass Bangle Craft'],
      color: 'border-blue-500/40 bg-blue-950/20'
    },
    {
      id: 'hindi',
      name: 'Class 5 Hindi (हिंदी)',
      chapters: 12,
      topics: ['किरन कविता', 'न्याय की कुर्सी', 'चाँद का कुर्ता', 'संगकेन', 'सुंदरिया', 'चतुर चित्रकार', 'मेरा बचपन', 'काजीरंगा', 'न्याय', 'तीन मछलियाँ'],
      color: 'border-amber-500/40 bg-amber-950/20'
    },
    {
      id: 'maths',
      name: 'Class 5 Mathematics (Maths Mela)',
      chapters: 15,
      topics: ['Travel Odometer', 'Fraction Strips', 'Clock Angles', 'Column Regrouping', 'Metric Scale', 'Partial Products', 'Tessellations', 'Pan Balance', 'Division Matrix', 'Symmetry'],
      color: 'border-teal-500/40 bg-teal-950/20'
    },
    {
      id: 'science',
      name: 'Class 5 Science / EVS',
      chapters: 10,
      topics: ['Water Cycle', 'River Journey', 'Human Digestion', 'Green School', 'India Diversity', 'Living Root Bridge', 'Clean Energy', 'Loom Weaving', 'Sundial Shadows', 'Web of Life'],
      color: 'border-emerald-500/40 bg-emerald-950/20'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> NCERT Class 5 Curriculum
        </div>
        <h1 className="text-3xl font-extrabold text-white">Class 5 Subject Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">Explore all 4 core Class 5 subjects and access all 10 canonical learning modules per subject.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {class5Subjects.map((subject) => (
          <div
            key={subject.id}
            className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 ${subject.color}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-teal-400" /> {subject.name}
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {subject.chapters} Chapters
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Curriculum Topics Covered</h3>
                <div className="flex flex-wrap gap-1.5">
                  {subject.topics.map((t, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-teal-300">
                <CheckCircle className="w-4 h-4" /> 10 Learning Modules Ready
              </div>
              <Link
                href={`/curriculum?grade=5&subject=${subject.id}&book=${subject.id}&part=main&unit=U01&chapter_id=G5-${subject.id.toUpperCase().slice(0,3)}-U01-C01`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all"
              >
                Launch Subject <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
