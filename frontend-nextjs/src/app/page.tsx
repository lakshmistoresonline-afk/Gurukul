'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl, CurriculumApiClient } from '../lib/curriculumClient';
import {
  getStudentProgress,
  StudentProgressState,
  syncStudentProgressFromFirestore,
  saveSelectedGradePreference,
  recordFlashcardReviewEvent
} from '../lib/studentProgressStore';

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
    eventsLedger: [],
    selectedGrade: '5'
  });

  // Grade Selector Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  // Dynamic Real Flashcards State
  const [realFlashcards, setRealFlashcards] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState<boolean>(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);
  const [flashcardIdx, setFlashcardIdx] = useState<number>(0);

  const reqIdRef = useRef<number>(0);

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

  // Selected Grade Source of Truth
  const selectedGrade = progress.selectedGrade || '5';
  const isGradeInHierarchy = hierarchy.some((item: any) => String(item.grade) === String(selectedGrade));
  const gradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  const rawSubjects = gradeData?.subjects || [];

  // Validate lastActivity against hierarchy
  const lastAct = progress.lastActivity;
  let isValidLastActivity = false;
  let continueUrl = '/subjects';
  let continueSubjectTitle = '';
  let continueChapterTitle = '';

  if (lastAct && lastAct.grade && lastAct.subject && lastAct.chapter_id && rawSubjects.length > 0) {
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
          grade: String(lastAct.grade),
          subject: lastAct.subject,
          book: lastAct.book || 'main',
          part: lastAct.part || 'main',
          unit: lastAct.unit || 'U01',
          chapter_id: lastAct.chapter_id
        });
      }
    }
  }

  // Load Real Flashcards dynamically for validated active chapter
  useEffect(() => {
    async function loadRealFlashcards() {
      if (!isValidLastActivity || !lastAct) {
        setRealFlashcards([]);
        setFlashcardError(null);
        return;
      }

      const currentToken = ++reqIdRef.current;
      try {
        setLoadingFlashcards(true);
        setFlashcardError(null);
        const res = await CurriculumApiClient.fetchContent({
          grade: String(lastAct.grade),
          subject: lastAct.subject,
          book: lastAct.book || 'main',
          part: lastAct.part || 'main',
          unit: lastAct.unit || 'U01',
          chapter_id: lastAct.chapter_id,
          content_type: 'flashcards'
        });

        // Stale response protection
        if (currentToken !== reqIdRef.current) return;

        let cards: any[] = [];
        if (Array.isArray(res.data)) {
          cards = res.data;
        } else if (res.data && Array.isArray(res.data.flashcards)) {
          cards = res.data.flashcards;
        } else if (res.data && (res.data.front || res.data.back)) {
          cards = [res.data];
        }

        // Validate front and back fields
        const validCards = cards.filter(c => c && (c.front || c.word || c.term) && (c.back || c.definition || c.meaning));
        setRealFlashcards(validCards);
        setFlashcardIdx(0);
        setFlashcardFlipped(false);
      } catch (e: any) {
        if (currentToken === reqIdRef.current) {
          setRealFlashcards([]);
          setFlashcardError(e.message || 'Failed to load chapter flashcards.');
        }
      } finally {
        if (currentToken === reqIdRef.current) {
          setLoadingFlashcards(false);
        }
      }
    }
    loadRealFlashcards();
  }, [isValidLastActivity, lastAct]);

  const handleGradeChange = async (newGrade: string) => {
    const targetUid = currentUser?.uid || 'guest';
    const updated = await saveSelectedGradePreference(newGrade, targetUid);
    setProgress(updated.state);
    setGradeModalOpen(false);
  };

  // Real Student Profile & Goal Progress Calculation (Local Calendar Date)
  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';
  const todayLocalDateStr = new Date().toLocaleDateString('en-CA');

  // Filter & deduplicate genuine events for today
  const validEventIds = new Set<string>();
  const todayValidEvents = (progress.eventsLedger || []).filter((e: any) => {
    if (!e || !e.timestamp || isNaN(new Date(e.timestamp).getTime())) return false;
    const eventDate = new Date(e.timestamp).toLocaleDateString('en-CA');
    if (eventDate !== todayLocalDateStr) return false;

    // Deduplicate by event_id
    const key = e.event_id || `${e.type}_${e.chapter_id}_${e.timestamp}`;
    if (validEventIds.has(key)) return false;
    validEventIds.add(key);

    return ['quiz_completion', 'chapter_completion', 'flashcard_review'].includes(e.type);
  });

  const todayEventsCount = todayValidEvents.length;
  const currentCard = realFlashcards.length > 0 ? realFlashcards[flashcardIdx] : null;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Learning Dashboard</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">A focused home for the learner — real progress, real content, clear next steps.</p>
      </div>

      {/* Student Welcome Banner with Class Selector */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 via-teal-50 to-indigo-50 border border-sky-200/80 p-6 sm:p-8 shadow-2xs">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-teal-800 font-mono">
              GOOD MORNING, {studentName}
            </div>

            <button
              onClick={() => setGradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-teal-800 text-xs font-extrabold border border-teal-200 shadow-2xs hover:bg-teal-50 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" /> Class {selectedGrade} • Change class
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your next learning adventure starts here.
          </h2>
          <p className="text-slate-600 text-xs font-semibold">
            Selected class: Class {selectedGrade} • {isGradeInHierarchy ? 'Authoritative Curriculum Active' : 'Loading Registry'}
          </p>
        </div>
      </div>

      {/* Class Selector Modal */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Select Grade / Class</h3>
              <button onClick={() => setGradeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {['5', '6', '7'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeChange(g)}
                  className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                    String(selectedGrade) === g
                      ? 'bg-teal-50 border-teal-300 text-teal-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>NCERT Class {g}</span>
                  {String(selectedGrade) === g && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            {isValidLastActivity ? (
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                  {continueSubjectTitle}
                </p>
                <p className="text-sm font-black text-slate-900 leading-snug">
                  {continueChapterTitle}
                </p>
                <p className="text-xs text-slate-500 font-medium">Resume at the last validated chapter</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Curriculum Selection</p>
                <p className="text-sm font-bold text-slate-700">No active chapter session saved yet.</p>
              </div>
            )}

            <Link
              href={continueUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs shadow-sm transition-all mt-1"
            >
              {isValidLastActivity ? 'Continue chapter' : 'Browse Subjects'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            📖
          </div>
        </div>
      </div>

      {/* Quick Revision Flashcard Widget */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900">QUICK REVISION</h3>
            <p className="text-xs text-slate-500 font-medium">
              {isValidLastActivity ? `Flashcards loaded from ${continueSubjectTitle} • ${lastAct?.chapter_id}` : 'Flashcards loaded from the active chapter'}
            </p>
          </div>

          {realFlashcards.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                Card {flashcardIdx + 1} of {realFlashcards.length}
              </span>
              <button
                onClick={() => {
                  setFlashcardFlipped(false);
                  setFlashcardIdx((prev) => (prev - 1 + realFlashcards.length) % realFlashcards.length);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                title="Previous Flashcard"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFlashcardFlipped(false);
                  setFlashcardIdx((prev) => (prev + 1) % realFlashcards.length);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                title="Next Flashcard"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {loadingFlashcards && (
          <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-xs font-bold">Loading chapter flashcards from curriculum...</span>
          </div>
        )}

        {flashcardError && !loadingFlashcards && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{flashcardError}</span>
          </div>
        )}

        {!loadingFlashcards && !flashcardError && !currentCard && (
          <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">If no chapter or flashcards exist, show an honest empty state — never sample content.</p>
          </div>
        )}

        {!loadingFlashcards && !flashcardError && currentCard && (
          <div
            tabIndex={0}
            role="button"
            aria-label="Flashcard word. Press Space or Enter to flip."
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlashcardFlipped(!flashcardFlipped);
              } else if (e.key === 'ArrowRight' && realFlashcards.length > 1) {
                setFlashcardFlipped(false);
                setFlashcardIdx((prev) => (prev + 1) % realFlashcards.length);
              } else if (e.key === 'ArrowLeft' && realFlashcards.length > 1) {
                setFlashcardFlipped(false);
                setFlashcardIdx((prev) => (prev - 1 + realFlashcards.length) % realFlashcards.length);
              }
            }}
            onClick={() => {
              setFlashcardFlipped(!flashcardFlipped);
              if (lastAct && currentUser) {
                recordFlashcardReviewEvent(lastAct.chapter_id, currentUser.uid);
              }
            }}
            className="p-10 rounded-2xl bg-[#F8FAFC] border border-blue-200/80 text-center cursor-pointer hover:border-teal-400 transition-all select-none min-h-[140px] flex flex-col items-center justify-center space-y-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {!flashcardFlipped ? (
              <div className="space-y-1">
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide uppercase">
                  {currentCard.front || currentCard.word || currentCard.term}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">Tap or press Space to reveal the explanation</p>
              </div>
            ) : (
              <div className="space-y-1 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-slate-900 leading-relaxed max-w-xl mx-auto">
                  {currentCard.back || currentCard.definition || currentCard.meaning}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Press Space to flip back</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
