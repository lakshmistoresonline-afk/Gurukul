'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Compass,
  Target,
  Zap,
  RotateCw,
  HelpCircle,
  AlertCircle,
  Loader2,
  Bookmark
} from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl, CurriculumApiClient } from '../lib/curriculumClient';
import { getStudentProgress, StudentProgressState, syncStudentProgressFromFirestore } from '../lib/studentProgressStore';

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(true);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

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

  // Dynamic Real Flashcards State
  const [realFlashcards, setRealFlashcards] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState<boolean>(false);
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);
  const [flashcardIdx, setFlashcardIdx] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const synced = await syncStudentProgressFromFirestore(user.uid);
        setProgress(synced);
      } else {
        setProgress(getStudentProgress('guest'));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingHierarchy(true);
        setHierarchyError(null);
        const data = await getCurriculumHierarchy();
        if (data && data.length > 0) {
          setHierarchy(data);
        } else {
          setHierarchy([]);
          setHierarchyError('Curriculum hierarchy data is currently unavailable.');
        }
      } catch (e: any) {
        console.error('Failed to load curriculum hierarchy:', e);
        setHierarchyError('Failed to connect to authoritative curriculum registry.');
      } finally {
        setLoadingHierarchy(false);
      }
    }
    loadData();
  }, []);

  // Filter grade data from hierarchy
  const currentGrade = currentUser ? '5' : '5';
  const gradeData = hierarchy.find((item: any) => String(item.grade) === currentGrade);
  const rawSubjects = gradeData?.subjects || [];

  // Validate lastActivity against hierarchy
  const lastAct = progress.lastActivity;
  let isValidLastActivity = false;
  let continueUrl = '/subjects';
  let continueSubjectTitle = '';
  let continueChapterTitle = '';

  if (lastAct && lastAct.subject && lastAct.chapter_id && rawSubjects.length > 0) {
    const subjMatch = rawSubjects.find((s: any) =>
      s.subject?.toLowerCase() === lastAct.subject.toLowerCase() ||
      s.canonical_subject?.toLowerCase() === lastAct.subject.toLowerCase()
    );
    if (subjMatch) {
      let foundCh: any = null;
      (subjMatch.books || []).forEach((b: any) => {
        (b.units || []).forEach((u: any) => {
          const ch = (u.chapters || []).find((c: any) => c.chapter_id === lastAct.chapter_id);
          if (ch) foundCh = ch;
        });
      });

      if (foundCh) {
        isValidLastActivity = true;
        continueSubjectTitle = subjMatch.subject || lastAct.subject;
        continueChapterTitle = foundCh.chapter_title || foundCh.chapter_id;
        continueUrl = buildCurriculumUrl({
          grade: String(lastAct.grade || currentGrade),
          subject: lastAct.subject,
          book: lastAct.book || 'main',
          part: lastAct.part || 'main',
          unit: lastAct.unit || 'U01',
          chapter_id: lastAct.chapter_id
        });
      }
    }
  }

  // Load Real Flashcards dynamically for active chapter
  useEffect(() => {
    async function loadRealFlashcards() {
      if (!isValidLastActivity || !lastAct) {
        setRealFlashcards([]);
        return;
      }
      try {
        setLoadingFlashcards(true);
        const res = await CurriculumApiClient.fetchContent({
          grade: String(lastAct.grade || currentGrade),
          subject: lastAct.subject,
          book: lastAct.book || 'main',
          part: lastAct.part || 'main',
          unit: lastAct.unit || 'U01',
          chapter_id: lastAct.chapter_id,
          content_type: 'flashcards'
        });
        const cards = Array.isArray(res.data) ? res.data : res.data?.flashcards || [];
        setRealFlashcards(cards);
        setFlashcardIdx(0);
        setFlashcardFlipped(false);
      } catch (e) {
        setRealFlashcards([]);
      } finally {
        setLoadingFlashcards(false);
      }
    }
    loadRealFlashcards();
  }, [isValidLastActivity, lastAct, currentGrade]);

  // Real Student Profile & Goal Progress Calculation (Local Calendar Date)
  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';
  const todayLocalDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone
  const todayEventsCount = (progress.eventsLedger || []).filter((e: any) => {
    if (!e.timestamp) return false;
    const eventLocalDateStr = new Date(e.timestamp).toLocaleDateString('en-CA');
    return eventLocalDateStr === todayLocalDateStr;
  }).length;

  const currentCard = realFlashcards.length > 0 ? realFlashcards[flashcardIdx] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 via-teal-50 to-indigo-50 border border-sky-200/80 p-8 shadow-sm">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-teal-800 text-xs font-bold border border-teal-200 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-teal-600" /> Class {currentGrade}
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Good Morning, {studentName} !
          </h1>
          <p className="text-slate-600 max-w-2xl text-sm sm:text-base font-semibold">
            Ready for a new learning adventure?
          </p>
        </div>
      </div>

      {/* Loading / Error States for Hierarchy */}
      {loadingHierarchy && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-sm font-bold">Loading authoritative curriculum hierarchy...</span>
        </div>
      )}

      {hierarchyError && !loadingHierarchy && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{hierarchyError}</span>
        </div>
      )}

      {/* Two Column Grid: Today's Learning Goal & Continue Learning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Learning Goal Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Today&apos;s Learning Goal</h3>
              <p className="text-xs text-slate-500 font-medium">Complete 2 learning activities daily</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-mono font-bold">
              <span>Daily Activities Completed</span>
              <span>{Math.min(2, todayEventsCount)} / 2</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayEventsCount / 2) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Continue Learning Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">Continue Learning</h3>
            {isValidLastActivity ? (
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                  {continueSubjectTitle}
                </p>
                <p className="text-sm font-black text-slate-900 leading-snug">
                  {continueChapterTitle}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Curriculum Selection</p>
                <p className="text-sm font-bold text-slate-700">Select a subject below to begin</p>
              </div>
            )}

            <Link
              href={continueUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all mt-2"
            >
              {isValidLastActivity ? 'Continue Chapter' : 'Explore Subjects'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            📖
          </div>
        </div>
      </div>

      {/* Dynamic Canonical Flashcard Revision Widget */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">10-Second Daily Flashcard Revision</h3>
              <p className="text-xs text-slate-500">Press Space or Enter to flip • Loaded from active NCERT chapter</p>
            </div>
          </div>
          {realFlashcards.length > 1 && (
            <button
              onClick={() => {
                setFlashcardFlipped(false);
                setFlashcardIdx((prev) => (prev + 1) % realFlashcards.length);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <RotateCw className="w-3.5 h-3.5" /> Next Word
            </button>
          )}
        </div>

        {loadingFlashcards && (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span className="text-xs font-bold">Loading chapter flashcards from curriculum...</span>
          </div>
        )}

        {!loadingFlashcards && !currentCard && (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No active chapter flashcards loaded.</p>
            <p className="text-[11px] text-slate-400">Open a chapter from the Subject Explorer to load interactive flashcards.</p>
          </div>
        )}

        {!loadingFlashcards && currentCard && (
          <div
            tabIndex={0}
            role="button"
            aria-label="Flashcard word. Press Space or Enter to flip."
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlashcardFlipped(!flashcardFlipped);
              }
            }}
            onClick={() => setFlashcardFlipped(!flashcardFlipped)}
            className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center cursor-pointer hover:border-amber-400 transition-all select-none min-h-[130px] flex flex-col items-center justify-center space-y-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
              {lastAct?.subject || 'NCERT'} Flashcard
            </span>
            {!flashcardFlipped ? (
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">{currentCard.front || currentCard.word || currentCard.term}</h4>
                <p className="text-xs text-amber-700 font-bold">💡 Press Space or click to reveal definition</p>
              </div>
            ) : (
              <div className="space-y-1 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-slate-900 leading-relaxed max-w-lg mx-auto">{currentCard.back || currentCard.definition || currentCard.meaning}</p>
                <p className="text-[10px] text-slate-500 font-mono">Press Space to flip back</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Subjects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" /> My Subjects
          </h2>
          <Link href="/subjects" className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {rawSubjects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rawSubjects.map((s: any) => {
              const canonSubj = s.canonical_subject || s.subject.toLowerCase();
              const firstBook = s.books?.[0] || {};
              const firstUnit = firstBook.units?.[0] || {};
              const firstCh = firstUnit.chapters?.[0] || {};

              const openUrl = buildCurriculumUrl({
                grade: String(currentGrade),
                subject: canonSubj,
                book: firstBook.book_id || canonSubj,
                part: firstBook.part || 'main',
                unit: firstUnit.unit || 'U01',
                chapter_id: firstCh.chapter_id || `G5-${canonSubj.slice(0, 3).toUpperCase()}-U01-C01`
              });

              return (
                <Link
                  key={canonSubj}
                  href={openUrl}
                  className="p-5 rounded-3xl border bg-white border-slate-200 hover:border-teal-400 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">📖</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 capitalize">{s.subject || canonSubj}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{firstBook.book_title || canonSubj}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            <p className="text-xs font-bold">No subjects currently loaded from hierarchy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
