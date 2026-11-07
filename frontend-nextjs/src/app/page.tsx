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
  Flame,
  Trophy,
  Bot,
  FlaskConical,
  HelpCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  GraduationCap,
  Calculator,
  Feather,
  Globe,
  Layers,
  Star,
  Zap,
  CheckCircle2,
  Award
} from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl, CurriculumApiClient } from '../lib/curriculumClient';
import {
  getStudentProgress,
  StudentProgressState,
  syncStudentProgressFromFirestore,
  saveSelectedGradePreference,
  recordFlashcardReviewEvent,
  getAuthoritativeClassForUser
} from '../lib/studentProgressStore';

interface SubjectTheme {
  icon: any;
  emoji: string;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  btnHoverBg: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  english: {
    icon: BookOpen,
    emoji: '📘',
    bgGradient: 'from-indigo-50/90 via-purple-50/40 to-white',
    borderColor: 'border-indigo-200/90 hover:border-indigo-400',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    btnBg: 'bg-indigo-600',
    btnHoverBg: 'hover:bg-indigo-500'
  },
  hindi: {
    icon: Feather,
    emoji: '📜',
    bgGradient: 'from-amber-50/90 via-orange-50/40 to-white',
    borderColor: 'border-amber-200/90 hover:border-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    btnBg: 'bg-amber-600',
    btnHoverBg: 'hover:bg-amber-500'
  },
  mathematics: {
    icon: Calculator,
    emoji: '📐',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-white',
    borderColor: 'border-emerald-200/90 hover:border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    btnBg: 'bg-emerald-600',
    btnHoverBg: 'hover:bg-emerald-500'
  },
  maths: {
    icon: Calculator,
    emoji: '📐',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-white',
    borderColor: 'border-emerald-200/90 hover:border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    btnBg: 'bg-emerald-600',
    btnHoverBg: 'hover:bg-emerald-500'
  },
  science: {
    icon: FlaskConical,
    emoji: '🧪',
    bgGradient: 'from-cyan-50/90 via-sky-50/40 to-white',
    borderColor: 'border-cyan-200/90 hover:border-cyan-400',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    btnBg: 'bg-cyan-600',
    btnHoverBg: 'hover:bg-cyan-500'
  },
  socialscience: {
    icon: Globe,
    emoji: '🌍',
    bgGradient: 'from-rose-50/90 via-pink-50/40 to-white',
    borderColor: 'border-rose-200/90 hover:border-rose-400',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    btnBg: 'bg-rose-600',
    btnHoverBg: 'hover:bg-rose-500'
  }
};

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
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setProgress({
        ...synced,
        selectedGrade: authGrade
      });
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid);
      setProgress((prev) => ({ ...prev, selectedGrade: authGrade }));
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
    };
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

        if (currentToken !== reqIdRef.current) return;

        let cards: any[] = [];
        if (Array.isArray(res.data)) {
          cards = res.data;
        } else if (res.data && Array.isArray(res.data.flashcards)) {
          cards = res.data.flashcards;
        } else if (res.data && (res.data.front || res.data.back)) {
          cards = [res.data];
        }

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
    window.dispatchEvent(new Event('gradeChanged'));
  };

  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Learner';
  const todayLocalDateStr = new Date().toLocaleDateString('en-CA');

  const validEventIds = new Set<string>();
  const todayValidEvents = (progress.eventsLedger || []).filter((e: any) => {
    if (!e || !e.timestamp || isNaN(new Date(e.timestamp).getTime())) return false;
    const eventDate = new Date(e.timestamp).toLocaleDateString('en-CA');
    if (eventDate !== todayLocalDateStr) return false;

    const key = e.event_id || `${e.type}_${e.chapter_id}_${e.timestamp}`;
    if (validEventIds.has(key)) return false;
    validEventIds.add(key);

    return ['quiz_completion', 'chapter_completion', 'flashcard_review'].includes(e.type);
  });

  const todayEventsCount = todayValidEvents.length;
  const currentCard = realFlashcards.length > 0 ? realFlashcards[flashcardIdx] : null;

  // Gamification Metrics
  const xpPoints = (progress.completedChapters.length * 100) + (progress.quizScores.length * 50) + (todayEventsCount * 20);
  const currentLevel = Math.floor(xpPoints / 250) + 1;
  const levelProgressXp = xpPoints % 250;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Student Gamified Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-teal-100">
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>WELCOME BACK, {studentName.toUpperCase()}!</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-black">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{progress.streakDays || 1} Day Streak</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/25 border border-teal-300/40 text-teal-100 text-xs font-black">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Level {currentLevel} • {xpPoints} XP</span>
              </div>

              {currentUser?.email?.includes('admin') ? (
                <button
                  onClick={() => setGradeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-teal-900 text-xs font-black shadow-md hover:bg-teal-50 transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-teal-600" /> Class {selectedGrade} • Switch
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/30">
                  <GraduationCap className="w-4 h-4 text-teal-300" />
                  <span>Class {selectedGrade} Student</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready for your next Class {selectedGrade} learning adventure?
            </h2>
            <p className="text-teal-100/90 text-xs sm:text-sm font-semibold mt-1 max-w-2xl">
              Explore your interactive NCERT subjects, complete daily missions, or get instant help from your AI Tutor!
            </p>
          </div>

          {/* Quick Access Action Shortcuts */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/subjects"
              className="px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Explore Subjects</span>
            </Link>

            <Link
              href="/tutor"
              className="px-4 py-2 bg-teal-500/30 hover:bg-teal-500/50 text-white font-black text-xs rounded-xl border border-white/25 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-teal-200" />
              <span>Ask AI Tutor</span>
            </Link>

            <Link
              href="/practice"
              className="px-4 py-2 bg-teal-500/30 hover:bg-teal-500/50 text-white font-black text-xs rounded-xl border border-white/25 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-4 h-4 text-amber-300" />
              <span>Practice Arena</span>
            </Link>

            <Link
              href="/journey"
              className="px-4 py-2 bg-teal-500/30 hover:bg-teal-500/50 text-white font-black text-xs rounded-xl border border-white/25 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Learning Roadmap</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Class Selector Modal for Admin */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Select Admin Grade</h3>
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
          <span className="text-sm font-bold">Loading Class {selectedGrade} curriculum modules...</span>
        </div>
      )}

      {hierarchyError && !loadingHierarchy && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{hierarchyError}</span>
        </div>
      )}

      {/* Class Subject Workspaces Quick Access Grid */}
      {!loadingHierarchy && rawSubjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" /> CLASS {selectedGrade} SUBJECT WORKSPACES
            </h3>

            <Link href="/subjects" className="text-xs font-black text-teal-700 hover:underline flex items-center gap-1">
              <span>View All Subjects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rawSubjects.map((subjObj: any) => {
              const canonSubj = (subjObj.canonical_subject || subjObj.subject || '').toLowerCase().replace(/\s+/g, '');
              const displayName = subjObj.subject || canonSubj;
              const theme = SUBJECT_THEMES[canonSubj] || SUBJECT_THEMES['english'];

              return (
                <Link
                  key={canonSubj}
                  href="/subjects"
                  className={`p-4 rounded-3xl border ${theme.borderColor} bg-gradient-to-br ${theme.bgGradient} flex items-center gap-3 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${theme.badgeBg} flex items-center justify-center text-2xl shadow-2xs shrink-0`}>
                    <span>{theme.emoji}</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-900 capitalize truncate">{displayName}</p>
                    <p className={`text-[10px] font-extrabold ${theme.badgeText} truncate`}>
                      {(subjObj.books || []).reduce((acc: number, b: any) => acc + (b.units || []).reduce((uAcc: number, u: any) => uAcc + (u.chapters || []).length, 0), 0)} Chapters
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Three Column Grid: Gamified Today's Quests, Level Progress & Resume Learning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Mission Quests Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-600" /> DAILY QUESTS
              </h3>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                +100 XP
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${todayEventsCount > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Complete 1 Chapter Lesson</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-amber-600">+50 XP</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${todayEventsCount > 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Practice Arena Quiz</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-amber-600">+30 XP</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${todayEventsCount > 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Ask AI Tutor 1 Question</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-amber-600">+20 XP</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-500">
              <span>Goal Progress</span>
              <span>{Math.min(100, Math.round((todayEventsCount / 2) * 100))}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayEventsCount / 2) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scholar Level & XP Progress Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" /> SCHOLAR LEVEL
              </h3>
              <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Level {currentLevel}
              </span>
            </div>

            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                🏆
              </div>
              <h4 className="text-lg font-black text-slate-900 mt-2">Class {selectedGrade} Scholar</h4>
              <p className="text-xs text-slate-500 font-semibold">{levelProgressXp} / 250 XP to Level {currentLevel + 1}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-500">
              <span>Next Level Progress</span>
              <span>{Math.round((levelProgressXp / 250) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-500"
                style={{ width: `${Math.round((levelProgressXp / 250) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Continue Learning Resume Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-600" /> CONTINUE LEARNING
            </h3>

            {isValidLastActivity ? (
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-1">
                <p className="text-[11px] font-black text-teal-700 uppercase tracking-wider font-mono">
                  {continueSubjectTitle}
                </p>
                <p className="text-sm font-black text-slate-900 leading-snug">
                  {continueChapterTitle}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">Resume at the last validated chapter workspace</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Curriculum Workspace</p>
                <p className="text-xs font-black text-slate-800">Select any subject above to enter a chapter!</p>
              </div>
            )}
          </div>

          <Link
            href={continueUrl}
            className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isValidLastActivity ? 'Continue Chapter' : 'Browse Subjects'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Revision Flashcard Widget */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">QUICK REVISION FLASHCARDS</h3>
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
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all"
                title="Previous Flashcard"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFlashcardFlipped(false);
                  setFlashcardIdx((prev) => (prev + 1) % realFlashcards.length);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all"
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
            <p className="text-xs font-bold text-slate-600">Select any subject chapter above to load interactive quick revision flashcards!</p>
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
            className="p-10 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/20 to-indigo-50/30 border border-teal-200/80 text-center cursor-pointer hover:border-teal-400 transition-all select-none min-h-[150px] flex flex-col items-center justify-center space-y-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed max-w-xl mx-auto">
                  {currentCard.back || currentCard.definition || currentCard.meaning}
                </p>
                <p className="text-[10px] text-slate-500 font-mono font-bold">Press Space to flip back</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
