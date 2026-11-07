'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Layers,
  Search,
  AlertCircle,
  Loader2,
  GraduationCap,
  Calculator,
  FlaskConical,
  Globe,
  Feather
} from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl } from '../../lib/curriculumClient';
import {
  getStudentProgress,
  syncStudentProgressFromFirestore,
  saveSelectedGradePreference,
  getAuthoritativeClassForUser
} from '../../lib/studentProgressStore';

interface SubjectTheme {
  icon: any;
  emoji: string;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  pillBg: string;
  pillHoverBg: string;
  pillText: string;
  pillBorder: string;
  btnBg: string;
  btnHoverBg: string;
  accentText: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  english: {
    icon: BookOpen,
    emoji: '📘',
    bgGradient: 'from-indigo-50/90 via-purple-50/40 to-white',
    borderColor: 'border-indigo-200/90 hover:border-indigo-400',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    pillBg: 'bg-indigo-50/80',
    pillHoverBg: 'hover:bg-indigo-600 hover:text-white',
    pillText: 'text-indigo-950',
    pillBorder: 'border-indigo-200/80 hover:border-indigo-500',
    btnBg: 'bg-indigo-600',
    btnHoverBg: 'hover:bg-indigo-500',
    accentText: 'text-indigo-700'
  },
  hindi: {
    icon: Feather,
    emoji: '📜',
    bgGradient: 'from-amber-50/90 via-orange-50/40 to-white',
    borderColor: 'border-amber-200/90 hover:border-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    pillBg: 'bg-amber-50/80',
    pillHoverBg: 'hover:bg-amber-600 hover:text-white',
    pillText: 'text-amber-950',
    pillBorder: 'border-amber-200/80 hover:border-amber-500',
    btnBg: 'bg-amber-600',
    btnHoverBg: 'hover:bg-amber-500',
    accentText: 'text-amber-800'
  },
  mathematics: {
    icon: Calculator,
    emoji: '📐',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-white',
    borderColor: 'border-emerald-200/90 hover:border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    pillBg: 'bg-emerald-50/80',
    pillHoverBg: 'hover:bg-emerald-600 hover:text-white',
    pillText: 'text-emerald-950',
    pillBorder: 'border-emerald-200/80 hover:border-emerald-500',
    btnBg: 'bg-emerald-600',
    btnHoverBg: 'hover:bg-emerald-500',
    accentText: 'text-emerald-800'
  },
  maths: {
    icon: Calculator,
    emoji: '📐',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-white',
    borderColor: 'border-emerald-200/90 hover:border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    pillBg: 'bg-emerald-50/80',
    pillHoverBg: 'hover:bg-emerald-600 hover:text-white',
    pillText: 'text-emerald-950',
    pillBorder: 'border-emerald-200/80 hover:border-emerald-500',
    btnBg: 'bg-emerald-600',
    btnHoverBg: 'hover:bg-emerald-500',
    accentText: 'text-emerald-800'
  },
  science: {
    icon: FlaskConical,
    emoji: '🧪',
    bgGradient: 'from-cyan-50/90 via-sky-50/40 to-white',
    borderColor: 'border-cyan-200/90 hover:border-cyan-400',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    pillBg: 'bg-cyan-50/80',
    pillHoverBg: 'hover:bg-cyan-600 hover:text-white',
    pillText: 'text-cyan-950',
    pillBorder: 'border-cyan-200/80 hover:border-cyan-500',
    btnBg: 'bg-cyan-600',
    btnHoverBg: 'hover:bg-cyan-500',
    accentText: 'text-cyan-800'
  },
  socialscience: {
    icon: Globe,
    emoji: '🌍',
    bgGradient: 'from-rose-50/90 via-pink-50/40 to-white',
    borderColor: 'border-rose-200/90 hover:border-rose-400',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    pillBg: 'bg-rose-50/80',
    pillHoverBg: 'hover:bg-rose-600 hover:text-white',
    pillText: 'text-rose-950',
    pillBorder: 'border-rose-200/80 hover:border-rose-500',
    btnBg: 'bg-rose-600',
    btnHoverBg: 'hover:bg-rose-500',
    accentText: 'text-rose-800'
  }
};

export default function SubjectsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
      } catch (e) {
        console.error('Failed to load hierarchy on subjects page:', e);
        setHierarchyError('Failed to connect to authoritative curriculum registry.');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setSelectedGrade(authGrade);
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      setSelectedGrade(prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid));
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
    };
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    const targetUid = currentUser ? currentUser.uid : 'guest';
    await saveSelectedGradePreference(g, targetUid);
  };

  const selectedGradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  const rawSubjects = selectedGradeData?.subjects || [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header & Class Badge */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300/80 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> NCERT Interactive Curriculum
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Subject Explorer — Class {selectedGrade}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Explore your Class {selectedGrade} subjects and tap any chapter to start learning immediately!
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or topics..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Class Badge */}
        {currentUser?.email?.includes('admin') ? (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs w-fit">
            <span className="text-xs font-black text-slate-600 px-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-teal-600" /> Admin Class Switcher:
            </span>
            {['5', '6', '7'].map((g) => (
              <button
                key={g}
                onClick={() => handleGradeSelect(g)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Class {g}
              </button>
            ))}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-teal-200 text-teal-900 text-xs font-extrabold shadow-2xs">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>Assigned Class: <strong className="font-mono text-teal-700">Class {selectedGrade}</strong></span>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          <span className="text-sm font-black text-slate-700">Loading Class {selectedGrade} Subject Workspaces...</span>
        </div>
      )}

      {hierarchyError && !loading && (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-black text-slate-800">Curriculum Hierarchy Unavailable</h3>
          <p className="text-xs text-slate-500 font-medium">{hierarchyError}</p>
        </div>
      )}

      {!loading && !hierarchyError && rawSubjects.length === 0 && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm font-extrabold text-slate-700">No subjects currently available for Class {selectedGrade} hierarchy.</p>
        </div>
      )}

      {!loading && !hierarchyError && rawSubjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rawSubjects.map((subjectObj: any) => {
            const canonSubj = (subjectObj.canonical_subject || subjectObj.subject || '').toLowerCase().replace(/\s+/g, '');
            const displayName = subjectObj.subject || canonSubj;
            const books = subjectObj.books || [];

            const theme = SUBJECT_THEMES[canonSubj] || SUBJECT_THEMES['english'];

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
                className={`rounded-3xl border bg-gradient-to-br ${theme.bgGradient} ${theme.borderColor} p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${theme.badgeBg} flex items-center justify-center text-2xl shadow-sm border border-black/5`}>
                        <span>{theme.emoji}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize flex items-center gap-2">
                          Class {selectedGrade} {displayName}
                        </h2>
                        <p className={`text-xs font-bold ${theme.accentText}`}>NCERT Standard Study Track</p>
                      </div>
                    </div>

                    <span className={`text-xs px-3.5 py-1 rounded-full font-black border border-black/5 shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}>
                      {allChapters.length} Chapters
                    </span>
                  </div>

                  {/* Chapter Selector Grid */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-600" /> SELECT A CHAPTER TO STUDY:
                    </h3>

                    {filteredChs.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                        {filteredChs.map((ch) => {
                          const chapterUrl = buildCurriculumUrl(ch);
                          const chNumDisplay = ch.chapter_number || ch.chapter_id.slice(-2);
                          return (
                            <Link
                              key={ch.chapter_id}
                              href={chapterUrl}
                              className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 group shadow-2xs shrink-0 cursor-pointer ${theme.pillBg} ${theme.pillBorder} ${theme.pillHoverBg} ${theme.pillText}`}
                            >
                              <span className="font-mono font-black">{chNumDisplay}.</span>
                              <span className="group-hover:underline">{ch.chapter_title}</span>
                              <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold italic p-2">No chapters matching &ldquo;{searchQuery}&rdquo;</p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{allChapters.length} Modules Ready</span>
                  </div>

                  {launchUrl ? (
                    <Link
                      href={launchUrl}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ${theme.btnBg} ${theme.btnHoverBg} text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer`}
                    >
                      <span>Start Chapter 1</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button disabled className="px-5 py-2.5 rounded-2xl bg-slate-200 text-slate-400 font-black text-xs cursor-not-allowed">
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
