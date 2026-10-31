'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
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
  Clock,
  Target
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

  // Filter Class 5 hierarchy node
  const class5Data = hierarchy.find((item: any) => String(item.grade) === '5');

  // Compute dynamic subject data from API hierarchy
  const rawSubjects = class5Data?.subjects || [
    { subject: 'English', canonical_subject: 'english', books: [{ book_id: 'english', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-ENG-U01-C01', chapter_title: "Papa's Spectacles" }] }] }] },
    { subject: 'Hindi', canonical_subject: 'hindi', books: [{ book_id: 'hindi', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-HIN-U01-C01', chapter_title: 'किरन कविता' }] }] }] },
    { subject: 'Mathematics', canonical_subject: 'maths', books: [{ book_id: 'maths', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-MAT-U01-C01', chapter_title: 'Travel Odometer' }] }] }] },
    { subject: 'Science', canonical_subject: 'science', books: [{ book_id: 'science', part: 'main', units: [{ unit_id: 'U01', chapters: [{ chapter_id: 'G5-SCI-U01-C01', chapter_title: 'Water Cycle' }] }] }] }
  ];

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

    return {
      name: s.subject,
      canonical: canonicalName,
      totalChapters: chapterCount || 10,
      completedChapters: completedInSubj,
      firstChapterId,
      firstChapterTitle,
      bookId: books[0]?.book_id || canonicalName,
      part: books[0]?.part || 'main'
    };
  });

  const totalClass5Chapters = processedSubjects.reduce((acc: number, s: any) => acc + s.totalChapters, 0);

  // Calculate real average quiz accuracy from student progress
  const quizAccuracy = progress.quizScores.length > 0
    ? Math.round(progress.quizScores.reduce((acc: number, q: any) => acc + (q.score / q.total) * 100, 0) / progress.quizScores.length)
    : 0;

  // Last valid activity resume link
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Student Welcome & Continue Learning Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/60 via-indigo-950 to-slate-900 border border-teal-500/30 p-8 shadow-2xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Authentic Class 5 Student Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Welcome, {studentName}!
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
              <Compass className="w-4 h-4 text-teal-400" /> View 7-Stage Journey
            </Link>
          </div>
        </div>
      </div>

      {/* Authenticated Real Student Metrics Bar */}
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

      {/* Today's Learning Goal Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Today&apos;s Learning Goal</h3>
            <p className="text-xs text-slate-400">Complete 1 chapter section and review 5 flashcards to maintain your streak.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="text-xs font-mono text-teal-400">
            {progress.completedChapters.length > 0 ? '1/1 Goal Met 🎉' : '0/1 In Progress'}
          </div>
        </div>
      </div>

      {/* Dynamic Class 5 Subject Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" /> Class 5 NCERT Subjects (Hierarchy Driven)
          </h2>
          <Link href="/subjects" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
            Explore Subjects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-teal-500/50 hover:shadow-xl transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {subj.name[0]}
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-teal-300 transition-colors">
                    {subj.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{subj.totalChapters} Authoritative Chapters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subj.completedChapters / subj.totalChapters) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{subj.completedChapters} Completed</span>
                    <span>{Math.round((subj.completedChapters / subj.totalChapters) * 100)}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[140px]">{subj.firstChapterTitle}</span>
                  <Link
                    href={openUrl}
                    className="font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 shrink-0"
                  >
                    Open <ArrowRight className="w-3 h-3" />
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
