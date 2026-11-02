'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle, Sparkles, ChevronRight, Layers, Search, AlertCircle, Loader2, GraduationCap } from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl } from '../../lib/curriculumClient';
import { getStudentProgress, saveSelectedGradePreference } from '../../lib/studentProgressStore';

export default function SubjectsPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('5');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setHierarchyError(null);
        const data = await getCurriculumHierarchy();
        if (data && data.length > 0) {
          setHierarchy(data);
        } else {
          setHierarchy([]);
          setHierarchyError('Curriculum hierarchy data is currently unavailable.');
        }

        const prog = getStudentProgress('guest');
        setSelectedGrade(prog.selectedGrade || '5');
      } catch (e) {
        console.error('Failed to load hierarchy on subjects page:', e);
        setHierarchyError('Failed to connect to authoritative curriculum registry.');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const handleGradeChanged = () => {
      const prog = getStudentProgress('guest');
      setSelectedGrade(prog.selectedGrade || '5');
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => window.removeEventListener('gradeChanged', handleGradeChanged);
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    await saveSelectedGradePreference(g, 'guest');
  };

  const selectedGradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  const rawSubjects = selectedGradeData?.subjects || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header & Class Switcher */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> NCERT Authoritative Curriculum
            </div>
            <h1 className="text-3xl font-black text-slate-900">Subject Explorer — Class {selectedGrade}</h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">Browse the authoritative curriculum hierarchy for Class {selectedGrade}. Select any chapter below to enter its workspace directly.</p>
          </div>

          {/* Search / Filter Chapters */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or topics..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>
        </div>

        {/* Class Switcher Toggle Bar */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-teal-600" /> Select Class:
          </span>
          {['5', '6', '7'].map((g) => (
            <button
              key={g}
              onClick={() => handleGradeSelect(g)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedGrade === g
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Class {g}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-xs font-bold">Loading Class {selectedGrade} curriculum hierarchy...</span>
        </div>
      )}

      {hierarchyError && !loading && (
        <div className="p-8 text-center text-slate-600 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Curriculum Hierarchy Unavailable</h3>
          <p className="text-xs text-slate-500">{hierarchyError}</p>
        </div>
      )}

      {!loading && !hierarchyError && rawSubjects.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold">No subjects currently available for Class {selectedGrade} hierarchy.</p>
        </div>
      )}

      {!loading && !hierarchyError && rawSubjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rawSubjects.map((subjectObj: any) => {
            const canonSubj = subjectObj.canonical_subject || subjectObj.subject.toLowerCase();
            const displayName = subjectObj.subject || canonSubj;
            const books = subjectObj.books || [];

            const allChapters: any[] = [];
            let firstChapterItem: any = null;

            books.forEach((bookObj: any) => {
              const bookId = bookObj.book_id || canonSubj;
              const partId = bookObj.part || 'main';

              (bookObj.units || []).forEach((unitObj: any) => {
                const unitId = unitObj.unit || 'U01';

                (unitObj.chapters || []).forEach((chObj: any) => {
                  const chItem = {
                    grade: String(selectedGrade),
                    subject: canonSubj,
                    book: bookId,
                    part: partId,
                    unit: unitId,
                    chapter_id: chObj.chapter_id,
                    chapter_number: chObj.chapter_number,
                    chapter_title: chObj.chapter_title || chObj.chapter_id
                  };
                  allChapters.push(chItem);
                  if (!firstChapterItem) {
                    firstChapterItem = chItem;
                  }
                });
              });
            });

            const filteredChs = searchQuery.trim()
              ? allChapters.filter((c) =>
                  c.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.chapter_id.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : allChapters;

            const launchUrl = firstChapterItem
              ? buildCurriculumUrl(firstChapterItem)
              : null;

            return (
              <div
                key={canonSubj}
                className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 capitalize flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-teal-600" /> Class {selectedGrade} {displayName}
                    </h2>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200">
                      {allChapters.length} Chapters
                    </span>
                  </div>

                  {/* Interactive Chapter Selector Buttons */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-600" /> Select a Chapter to Open Directly:
                    </h3>
                    {filteredChs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredChs.map((ch) => {
                          const chapterUrl = buildCurriculumUrl(ch);
                          return (
                            <Link
                              key={ch.chapter_id}
                              href={chapterUrl}
                              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition-all flex items-center gap-1.5 group shadow-2xs shrink-0"
                            >
                              <span className="font-mono text-teal-700 font-bold">{ch.chapter_number || ch.chapter_id.slice(-2)}.</span>
                              <span className="font-semibold group-hover:underline">{ch.chapter_title}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic">No chapters matching &ldquo;{searchQuery}&rdquo;</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> {allChapters.length} Learning Modules Ready
                  </div>
                  {launchUrl ? (
                    <Link
                      href={launchUrl}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all"
                    >
                      Launch Chapter 1 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button disabled className="px-5 py-2.5 rounded-2xl bg-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed">
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
