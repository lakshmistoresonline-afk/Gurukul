'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle, Sparkles, ChevronRight, Layers } from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl } from '../../lib/curriculumClient';

export default function SubjectsPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load hierarchy on subjects page:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const class5Data = hierarchy.find((item: any) => String(item.grade) === '5');
  const rawSubjects = class5Data?.subjects || [];

  const subjectMeta: Record<string, { name: string; bookName: string; color: string; canonical: string }> = {
    english: {
      name: 'Class 5 English',
      bookName: 'Santoor',
      color: 'border-blue-500/40 bg-blue-950/20',
      canonical: 'english'
    },
    hindi: {
      name: 'Class 5 Hindi',
      bookName: 'Veena (हिंदी)',
      color: 'border-amber-500/40 bg-amber-950/20',
      canonical: 'hindi'
    },
    maths: {
      name: 'Class 5 Mathematics',
      bookName: 'Maths Mela',
      color: 'border-purple-500/40 bg-purple-950/20',
      canonical: 'maths'
    },
    mathematics: {
      name: 'Class 5 Mathematics',
      bookName: 'Maths Mela',
      color: 'border-purple-500/40 bg-purple-950/20',
      canonical: 'maths'
    },
    science: {
      name: 'Class 5 Science / EVS',
      bookName: 'Our Wondrous World',
      color: 'border-emerald-500/40 bg-emerald-950/20',
      canonical: 'science'
    }
  };

  const defaultSubjects = [
    {
      id: 'english',
      name: 'Class 5 English (Santoor)',
      canonical: 'english',
      color: 'border-blue-500/40 bg-blue-950/20',
      chapters: [
        { id: 'G5-ENG-U01-C01', num: 1, title: "Papa's Spectacles" },
        { id: 'G5-ENG-U01-C02', num: 2, title: "The Scooter Race" },
        { id: 'G5-ENG-U01-C03', num: 3, title: "Rainbow Spectrum" },
        { id: 'G5-ENG-U01-C04', num: 4, title: "The Wise Parrot" },
        { id: 'G5-ENG-U01-C05', num: 5, title: "Frog Metamorphosis" },
        { id: 'G5-ENG-U01-C06', num: 6, title: "Rooftop Tanka" },
        { id: 'G5-ENG-U01-C07', num: 7, title: "Gilli Danda" },
        { id: 'G5-ENG-U01-C08', num: 8, title: "Panchayat Court" },
        { id: 'G5-ENG-U01-C09', num: 9, title: "Vocation" },
        { id: 'G5-ENG-U01-C10', num: 10, title: "Glass Bangle Craft" }
      ]
    },
    {
      id: 'hindi',
      name: 'Class 5 Hindi (Veena)',
      canonical: 'hindi',
      color: 'border-amber-500/40 bg-amber-950/20',
      chapters: [
        { id: 'G5-HIN-U01-C01', num: 1, title: "किरन कविता" },
        { id: 'G5-HIN-U01-C02', num: 2, title: "न्याय की कुर्सी" },
        { id: 'G5-HIN-U01-C03', num: 3, title: "चाँद का कुर्ता" },
        { id: 'G5-HIN-U01-C04', num: 4, title: "संगकेन" },
        { id: 'G5-HIN-U01-C05', num: 5, title: "सुंदरिया" },
        { id: 'G5-HIN-U01-C06', num: 6, title: "चतुर चित्रकार" },
        { id: 'G5-HIN-U01-C07', num: 7, title: "मेरा बचपन" },
        { id: 'G5-HIN-U01-C08', num: 8, title: "काजीरंगा" },
        { id: 'G5-HIN-U01-C09', num: 9, title: "न्याय" },
        { id: 'G5-HIN-U01-C10', num: 10, title: "तीन मछलियाँ" }
      ]
    },
    {
      id: 'maths',
      name: 'Class 5 Mathematics (Maths Mela)',
      canonical: 'maths',
      color: 'border-purple-500/40 bg-purple-950/20',
      chapters: [
        { id: 'G5-MAT-U01-C01', num: 1, title: "Travel Odometer" },
        { id: 'G5-MAT-U01-C02', num: 2, title: "Fraction Strips" },
        { id: 'G5-MAT-U01-C03', num: 3, title: "Clock Angles" },
        { id: 'G5-MAT-U01-C04', num: 4, title: "Column Regrouping" },
        { id: 'G5-MAT-U01-C05', num: 5, title: "Metric Scale" },
        { id: 'G5-MAT-U01-C06', num: 6, title: "Partial Products" },
        { id: 'G5-MAT-U01-C07', num: 7, title: "Tessellations" },
        { id: 'G5-MAT-U01-C08', num: 8, title: "Pan Balance" },
        { id: 'G5-MAT-U01-C09', num: 9, title: "Division Matrix" },
        { id: 'G5-MAT-U01-C10', num: 10, title: "Symmetry" }
      ]
    },
    {
      id: 'science',
      name: 'Class 5 Science (Our Wondrous World)',
      canonical: 'science',
      color: 'border-emerald-500/40 bg-emerald-950/20',
      chapters: [
        { id: 'G5-SCI-U01-C01', num: 1, title: "Water Cycle" },
        { id: 'G5-SCI-U01-C02', num: 2, title: "River Journey" },
        { id: 'G5-SCI-U01-C03', num: 3, title: "Human Digestion" },
        { id: 'G5-SCI-U01-C04', num: 4, title: "Green School" },
        { id: 'G5-SCI-U01-C05', num: 5, title: "India Diversity" },
        { id: 'G5-SCI-U01-C06', num: 6, title: "Living Root Bridge" },
        { id: 'G5-SCI-U01-C07', num: 7, title: "Clean Energy" },
        { id: 'G5-SCI-U01-C08', num: 8, title: "Loom Weaving" },
        { id: 'G5-SCI-U01-C09', num: 9, title: "Sundial Shadows" },
        { id: 'G5-SCI-U01-C10', num: 10, title: "Web of Life" }
      ]
    }
  ];

  const processedSubjects = rawSubjects.length > 0
    ? rawSubjects.map((s: any) => {
        const canonicalKey = s.canonical_subject || s.subject.toLowerCase();
        const meta = subjectMeta[canonicalKey] || subjectMeta.english;
        const books = s.books || [];
        const chList: any[] = [];

        books.forEach((b: any) => {
          (b.units || []).forEach((u: any) => {
            (u.chapters || []).forEach((ch: any) => {
              chList.push({
                id: ch.chapter_id,
                num: ch.chapter_number || chList.length + 1,
                title: ch.chapter_title || ch.chapter_id
              });
            });
          });
        });

        return {
          id: meta.canonical,
          name: `${meta.name} (${meta.bookName})`,
          canonical: meta.canonical,
          color: meta.color,
          chapters: chList.length > 0 ? chList : (defaultSubjects.find(ds => ds.canonical === meta.canonical)?.chapters || [])
        };
      })
    : defaultSubjects;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> NCERT Class 5 Interactive Curriculum
        </div>
        <h1 className="text-3xl font-extrabold text-white">Class 5 Subject Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">Select any chapter below to enter its workspace directly or launch Chapter 1 of the subject.</p>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs font-bold">Loading curriculum subjects and chapters...</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedSubjects.map((subject: any) => {
            const firstCh = subject.chapters[0] || { id: `G5-${subject.canonical.slice(0, 3).toUpperCase()}-U01-C01` };
            const launchUrl = buildCurriculumUrl({
              grade: '5',
              subject: subject.canonical,
              book: subject.canonical,
              part: 'main',
              unit: 'U01',
              chapter_id: firstCh.id
            });

            return (
              <div
                key={subject.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 ${subject.color} shadow-xl hover:border-teal-500/40 transition-all`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-teal-400" /> {subject.name}
                    </h2>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-teal-300 font-mono font-bold border border-slate-800">
                      {subject.chapters.length} Chapters
                    </span>
                  </div>

                  {/* Interactive Chapter Selector Buttons */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" /> Select a Chapter to Open Directly:
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                      {subject.chapters.map((ch: any) => {
                        const chapterUrl = buildCurriculumUrl({
                          grade: '5',
                          subject: subject.canonical,
                          book: subject.canonical,
                          part: 'main',
                          unit: 'U01',
                          chapter_id: ch.id
                        });

                        return (
                          <Link
                            key={ch.id}
                            href={chapterUrl}
                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 border border-slate-800 hover:border-teal-500/50 transition-all flex items-center gap-1.5 group shadow-sm shrink-0"
                          >
                            <span className="font-mono text-teal-400 font-bold">{ch.num}.</span>
                            <span className="font-medium group-hover:underline">{ch.title}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-teal-400 transition-colors" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-teal-300 font-medium">
                    <CheckCircle className="w-4 h-4" /> 10 Learning Modules Ready
                  </div>
                  <Link
                    href={launchUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-teal-500/20 transition-all"
                  >
                    Launch Chapter 1 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
