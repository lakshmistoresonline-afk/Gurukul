'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Sparkles,
  Flame,
  Award,
  ArrowRight,
  PlayCircle,
  BrainCircuit,
  Compass,
  CheckCircle2,
  Clock,
  Target,
  Video,
  Image as ImageIcon,
  Zap,
  HelpCircle,
  RotateCw,
  MapPin,
  Flag
} from 'lucide-react';
import { getCurriculumHierarchy, buildCurriculumUrl } from '../lib/curriculumClient';
import { getStudentProgress, StudentProgressState, syncStudentProgressFromFirestore } from '../lib/studentProgressStore';

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [progress, setProgress] = useState<StudentProgressState>({
    completedChapters: [],
    lastActivity: null,
    quizScores: [],
    streakDays: 0,
    lastActiveDate: null,
    bookmarks: [],
    practiceMarked: []
  });

  // Daily Quick Flashcard State
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);

  const sampleFlashcards = [
    { word: 'Spectacles', meaning: 'Eyeglasses used to assist and correct vision.', subject: 'English' },
    { word: 'Amphibian', meaning: 'Cold-blooded animal living both on land and in water.', subject: 'Science' },
    { word: 'Metamorphosis', meaning: 'Biological process of tadpoles transforming into adult frogs.', subject: 'Science' },
    { word: 'Dribble', meaning: 'Maneuvering a hockey ball with short, controlled stick taps.', subject: 'English' },
    { word: 'Tanka', meaning: 'Traditional underground rainwater harvesting cistern in Rajasthan.', subject: 'English' }
  ];

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
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load curriculum hierarchy:', e);
      }
    }
    loadData();
  }, []);

  const class5Data = hierarchy.find((item: any) => String(item.grade) === '5');

  const rawSubjects = class5Data?.subjects || [
    { subject: 'English', canonical_subject: 'english', books: [{ book_id: 'english', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-ENG-U01-C01', chapter_title: "Papa's Spectacles" }] }] }] },
    { subject: 'Hindi', canonical_subject: 'hindi', books: [{ book_id: 'hindi', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-HIN-U01-C01', chapter_title: 'किरन कविता' }] }] }] },
    { subject: 'Mathematics', canonical_subject: 'maths', books: [{ book_id: 'maths', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-MAT-U01-C01', chapter_title: 'Travel Odometer' }] }] }] },
    { subject: 'Science', canonical_subject: 'science', books: [{ book_id: 'science', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-SCI-U01-C01', chapter_title: 'Water Cycle' }] }] }] }
  ];

  const realmThemes: Record<string, { realm: string; tagline: string; icon: string; border: string; bg: string; badge: string }> = {
    english: {
      realm: '🌴 Santoor Island',
      tagline: 'Coastal Storybook & Language Mastery',
      icon: '🌊',
      border: 'border-blue-500/40 hover:border-blue-400',
      bg: 'from-blue-950/80 via-slate-900 to-indigo-950',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    },
    hindi: {
      realm: '🌺 Veena Realm',
      tagline: 'भाषा, कविता, कहानी एवं व्याकरण',
      icon: '🪕',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'from-amber-950/80 via-slate-900 to-orange-950',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    maths: {
      realm: '📐 Maths Mela Kingdom',
      tagline: 'Numbers, Shapes, Fractions & Puzzles',
      icon: '🏰',
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'from-purple-950/80 via-slate-900 to-violet-950',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    mathematics: {
      realm: '📐 Maths Mela Kingdom',
      tagline: 'Numbers, Shapes, Fractions & Puzzles',
      icon: '🏰',
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'from-purple-950/80 via-slate-900 to-violet-950',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    science: {
      realm: '🧪 Wondrous World Lab',
      tagline: 'Ecosystems, Animals & Experiments',
      icon: '🌳',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'from-emerald-950/80 via-slate-900 to-teal-950',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  };

  const processedSubjects = rawSubjects.map((s: any) => {
    const canonicalName = s.canonical_subject || s.subject.toLowerCase();
    const books = s.books || [];
    let chapterCount = 0;
    let firstChapterId = `G5-${canonicalName.slice(0, 3).toUpperCase()}-U01-C01`;
    let firstChapterTitle = `${s.subject} Chapter 1`;

    books.forEach((b: any) => {
      (b.units || []).forEach((u: any) => {
        const chs = u.chapters || [];
        chapterCount += chs.length;
        if (chs.length > 0 && !firstChapterId) {
          firstChapterId = chs[0].chapter_id;
          firstChapterTitle = chs[0].chapter_title;
        }
      });
    });

    const completedInSubj = progress.completedChapters.filter((id: string) =>
      id.toLowerCase().includes(canonicalName.slice(0, 3))
    ).length;

    const theme = realmThemes[canonicalName] || realmThemes.english;

    return {
      name: s.subject,
      canonical: canonicalName,
      totalChapters: chapterCount || 10,
      completedChapters: completedInSubj,
      firstChapterId,
      firstChapterTitle,
      bookId: books[0]?.book_id || canonicalName,
      part: books[0]?.part || 'main',
      theme
    };
  });

  const totalClass5Chapters = processedSubjects.reduce((acc: number, s: any) => acc + s.totalChapters, 0);

  const quizAccuracy = progress.quizScores.length > 0
    ? Math.round(progress.quizScores.reduce((acc: number, q: any) => acc + (q.score / q.total) * 100, 0) / progress.quizScores.length)
    : 0;

  const resumeActivity = progress.lastActivity;
  const continueUrl = resumeActivity
    ? buildCurriculumUrl({
        grade: '5',
        subject: resumeActivity.subject,
        book: resumeActivity.book,
        part: resumeActivity.part,
        unit: resumeActivity.unit,
        chapter_id: resumeActivity.chapter_id
      })
    : buildCurriculumUrl({
        grade: '5',
        subject: 'english',
        book: 'english',
        part: 'main',
        unit: 'U01',
        chapter_id: 'G5-ENG-U01-C01'
      });

  const studentName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';
  const currentCard = sampleFlashcards[flashcardIdx];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Student Welcome & Continue Learning Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/60 via-indigo-950 to-slate-900 border border-teal-500/30 p-8 shadow-2xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Option 1: Interactive Learning World Map
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Welcome to Gurukul World, {studentName}!
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            {resumeActivity
              ? `Resume your study of ${resumeActivity.subject.toUpperCase()} (${resumeActivity.chapter_id}). Progress is isolated to your Firebase account.`
              : 'Begin your NCERT Class 5 curriculum across English, Hindi, Mathematics, and Science with interactive lessons, 3D flashcards, and hotspot diagrams.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href={continueUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:brightness-110 transition-all"
            >
              <PlayCircle className="w-4 h-4" /> {resumeActivity ? 'Resume Chapter' : 'Start First Lesson'}
            </Link>
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <Compass className="w-4 h-4 text-teal-400" /> View 5-Step Journey
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{progress.streakDays} Days</div>
            <div className="text-xs text-slate-400 font-medium">Learning Streak</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{progress.completedChapters.length} / {totalClass5Chapters}</div>
            <div className="text-xs text-slate-400 font-medium">Chapters Mastered</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{quizAccuracy > 0 ? `${quizAccuracy}%` : 'N/A'}</div>
            <div className="text-xs text-slate-400 font-medium">Quiz Accuracy</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{progress.completedChapters.length > 0 ? 'Unlocked' : '0 Badges'}</div>
            <div className="text-xs text-slate-400 font-medium">Achievements</div>
          </div>
        </div>
      </div>

      {/* Interactive 10-Second Daily Revision Widget */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">10-Second Quick Flashcard Revision</h3>
              <p className="text-xs text-slate-400">Click card to reveal definition • Flip daily to sharpen memory</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFlashcardFlipped(false);
              setFlashcardIdx((prev) => (prev + 1) % sampleFlashcards.length);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" /> Next Word
          </button>
        </div>

        <div
          onClick={() => setFlashcardFlipped(!flashcardFlipped)}
          className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center cursor-pointer hover:border-amber-500/40 transition-all select-none min-h-[120px] flex flex-col items-center justify-center space-y-2 shadow-inner"
        >
          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded bg-slate-900 text-amber-300">
            {currentCard.subject} Vocabulary
          </span>
          {!flashcardFlipped ? (
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-white">{currentCard.word}</h4>
              <p className="text-xs text-amber-400/80 font-medium">💡 Click to reveal definition</p>
            </div>
          ) : (
            <div className="space-y-1 animate-in fade-in duration-200">
              <p className="text-sm font-semibold text-teal-200 leading-relaxed max-w-lg mx-auto">{currentCard.meaning}</p>
              <p className="text-[10px] text-slate-500 font-mono">Click to return to word</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive World Map Section (Option 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" /> Class 5 Interactive Subject World Map
          </h2>
          <span className="text-xs text-slate-400 font-mono">4 Subject Realms Connected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedSubjects.map((subj: any) => {
            const openUrl = buildCurriculumUrl({
              grade: '5',
              subject: subj.canonical,
              book: subj.bookId,
              part: subj.part,
              unit: 'U01',
              chapter_id: subj.firstChapterId
            });

            return (
              <div
                key={subj.canonical}
                className={`group relative rounded-3xl bg-gradient-to-br ${subj.theme.bg} border ${subj.theme.border} p-6 flex flex-col justify-between space-y-6 shadow-2xl transition-all hover:scale-[1.01]`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase font-mono px-3 py-1 rounded-full border ${subj.theme.badge}`}>
                      {subj.theme.realm}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {subj.totalChapters} Chapters
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-white text-2xl group-hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span>{subj.theme.icon}</span> <span>{subj.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{subj.theme.tagline}</p>
                  </div>

                  {/* Asset Availability Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-indigo-300 flex items-center gap-1">
                      <Video className="w-3 h-3 text-indigo-400" /> Studio Videos
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-teal-300 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-teal-400" /> 16:9 Diagrams
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> 3D Flashcards
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-purple-300 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-purple-400" /> MCQ Quizzes
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold truncate max-w-[200px]">Chapter 1: {subj.firstChapterTitle}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{Math.round((subj.completedChapters / subj.totalChapters) * 100)}% Mastered</span>
                  </div>

                  <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subj.completedChapters / subj.totalChapters) * 100)}%` }}
                    />
                  </div>

                  <Link
                    href={openUrl}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-extrabold text-xs transition-all group-hover:border-teal-500/50"
                  >
                    Enter {subj.name} Realm <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
