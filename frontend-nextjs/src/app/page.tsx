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
  Loader2
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
  const currentGrade = '5';
  const gradeData = hierarchy.find((item: any) => String(item.grade) === currentGrade);
  const rawSubjects = gradeData?.subjects || [];

  // Validate lastActivity against hierarchy
  const lastAct = progress.lastActivity;
  let isValidLastActivity = false;
  let continueUrl = '/subjects';
  let continueSubjectTitle = 'Science';
  let continueChapterTitle = 'Water Cycle';

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
  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'LEARNER';
  const todayLocalDateStr = new Date().toLocaleDateString('en-CA');
  const todayEventsCount = (progress.eventsLedger || []).filter((e: any) => {
    if (!e.timestamp) return false;
    const eventLocalDateStr = new Date(e.timestamp).toLocaleDateString('en-CA');
    return eventLocalDateStr === todayLocalDateStr;
  }).length;

  const currentCard = realFlashcards.length > 0 ? realFlashcards[flashcardIdx] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Page Header (Matching Audit Reference Screenshot 1) */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Learning Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1 font-medium">A focused home for the learner — real progress, real content, clear next steps.</p>
      </div>

      {/* Student Welcome Banner (Matching Audit Reference Screenshot 1) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#EAF3FF] border border-blue-200/80 p-8 shadow-2xs">
        <div className="relative z-10 space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-teal-800 font-mono">
            GOOD MORNING, {studentName}
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Your next learning adventure starts here.
          </h2>
          <p className="text-slate-600 text-xs font-semibold">
            Selected class: Class 5 • <Link href="/subjects" className="text-teal-700 hover:underline">Change class</Link>
          </p>
        </div>
      </div>

      {/* Loading / Error States */}
      {loadingHierarchy && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-sm font-bold">Loading curriculum data...</span>
        </div>
      )}

      {hierarchyError && !loadingHierarchy && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{hierarchyError}</span>
        </div>
      )}

      {/* Two Column Grid: Today's Learning Goal & Continue Learning (Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Learning Goal Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">TODAY&apos;S LEARNING GOAL</h3>
            <p className="text-2xl font-black text-slate-900">{Math.min(2, todayEventsCount)} of 2 activities completed</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className="bg-teal-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (todayEventsCount / 2) * 100)}%` }}
            />
          </div>
        </div>

        {/* Continue Learning Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">CONTINUE LEARNING</h3>
            <p className="text-xl font-black text-slate-900 leading-snug">
              {continueSubjectTitle} • {continueChapterTitle}
            </p>
            <p className="text-xs text-slate-500 font-medium">Resume at the last validated chapter</p>

            <Link
              href={continueUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs shadow-sm transition-all mt-1"
            >
              Continue chapter <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            💧
          </div>
        </div>
      </div>

      {/* Quick Revision Flashcard Widget (Screenshot 1) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">QUICK REVISION</h3>
            <p className="text-xs text-slate-500 font-medium">Flashcards loaded from the active chapter</p>
          </div>
          {realFlashcards.length > 1 && (
            <button
              onClick={() => {
                setFlashcardFlipped(false);
                setFlashcardIdx((prev) => (prev + 1) % realFlashcards.length);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <RotateCw className="w-3.5 h-3.5" /> Next Flashcard
            </button>
          )}
        </div>

        {loadingFlashcards && (
          <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-xs font-bold">Loading chapter flashcards from curriculum...</span>
          </div>
        )}

        {!loadingFlashcards && !currentCard && (
          <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">If no chapter or flashcards exist, show an honest empty state — never sample content.</p>
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
            className="p-10 rounded-2xl bg-[#F8FAFC] border border-blue-200/80 text-center cursor-pointer hover:border-teal-400 transition-all select-none min-h-[140px] flex flex-col items-center justify-center space-y-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {!flashcardFlipped ? (
              <div className="space-y-1">
                <h4 className="text-3xl font-black text-slate-900 tracking-wide uppercase">{currentCard.front || currentCard.word || currentCard.term}</h4>
                <p className="text-xs text-slate-500 font-semibold">Tap or press Space to reveal the explanation</p>
              </div>
            ) : (
              <div className="space-y-1 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-slate-900 leading-relaxed max-w-xl mx-auto">{currentCard.back || currentCard.definition || currentCard.meaning}</p>
                <p className="text-[10px] text-slate-500 font-mono">Press Space to flip back</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
