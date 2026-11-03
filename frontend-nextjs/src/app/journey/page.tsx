'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Compass, Sparkles, ArrowRight, BookOpen, AlertCircle, GraduationCap } from 'lucide-react';
import { getStudentProgress, StudentProgressState, syncStudentProgressFromFirestore, saveSelectedGradePreference } from '../../lib/studentProgressStore';
import { buildCurriculumUrl } from '../../lib/curriculumClient';

export default function LearningJourneyPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const targetUid = user ? user.uid : 'guest';
      const prog = user ? await syncStudentProgressFromFirestore(user.uid) : getStudentProgress('guest');
      setProgress(prog);
      setSelectedGrade(prog.selectedGrade || '5');
    });

    const handleGradeChanged = () => {
      const prog = getStudentProgress('guest');
      setSelectedGrade(prog.selectedGrade || '5');
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
    };
  }, []);

  const handleGradeSelect = async (g: string) => {
    setSelectedGrade(g);
    await saveSelectedGradePreference(g, 'guest');
  };

  const lastAct = progress.lastActivity;
  const hasActiveChapter = !!(lastAct && lastAct.subject && lastAct.chapter_id);

  const journeyStages = [
    { stage: 1, name: 'Discover', contentType: 'overview', module: 'Overview', desc: 'Explore chapter storyboards, central themes, and learning goals.', color: 'text-amber-800 bg-amber-100 border-amber-300' },
    { stage: 2, name: 'Learn', contentType: 'notes', module: 'Notes', desc: 'Master comprehensive pedagogical summaries, role-plays, and STEM drawers.', color: 'text-blue-800 bg-blue-100 border-blue-300' },
    { stage: 3, name: 'Understand', contentType: 'foundational', module: 'Foundational', desc: 'Practice language drills, sorting matrices, and core concepts.', color: 'text-teal-800 bg-teal-100 border-teal-300' },
    { stage: 4, name: 'Explore', contentType: 'mindmaps', module: 'Mindmaps', desc: 'Interact with visual concept trees and interactive diagrams.', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' },
    { stage: 5, name: 'Practise', contentType: 'flashcards', module: 'Flashcards & Quiz', desc: 'Active recall flashcards and timed interactive quizzes.', color: 'text-purple-800 bg-purple-100 border-purple-300' },
    { stage: 6, name: 'Challenge', contentType: 'master', module: 'Master Practice', desc: 'Solve higher-order challenge problems and test comprehension.', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    { stage: 7, name: 'Master', contentType: 'question_papers', module: 'Question Papers', desc: 'Test exam readiness with model question papers and step-by-step keys.', color: 'text-rose-800 bg-rose-100 border-rose-300' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header & Class Switcher */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> NCERT 7-Stage Pathway
            </div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Compass className="w-8 h-8 text-teal-600" /> Class {selectedGrade} Learning Journey
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              Follow our 7-stage interactive pathway mapping every Class {selectedGrade} chapter from initial discovery to exam mastery.
            </p>
          </div>

          {/* Class Switcher Toggle */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-teal-600" /> Select Class:
            </span>
            {['5', '6', '7'].map((g) => (
              <button
                key={g}
                onClick={() => handleGradeSelect(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
      </div>

      {!hasActiveChapter && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Please select a Class {selectedGrade} chapter from the Subject Explorer to launch the 7-stage journey.</span>
          </div>
          <Link
            href="/subjects"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Select Chapter
          </Link>
        </div>
      )}

      {hasActiveChapter && lastAct && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" /> Active Chapter: <strong className="text-slate-900 uppercase">{lastAct.subject}</strong> ({lastAct.chapter_id})
          </span>
          <Link href="/subjects" className="text-teal-700 hover:underline font-bold">Switch Chapter</Link>
        </div>
      )}

      <div className="space-y-4">
        {journeyStages.map((s) => {
          const stageUrl = hasActiveChapter && lastAct
            ? buildCurriculumUrl({
                grade: String(lastAct.grade || selectedGrade),
                subject: lastAct.subject,
                book: lastAct.book || 'main',
                part: lastAct.part || 'main',
                unit: lastAct.unit || 'U01',
                chapter_id: lastAct.chapter_id,
                content_type: s.contentType
              })
            : '/subjects';

          return (
            <div
              key={s.stage}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-400 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${s.color}`}>
                  {s.stage}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Stage {s.stage}: {s.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">{s.module}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{s.desc}</p>
                </div>
              </div>

              <Link
                href={stageUrl}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition-all shrink-0 shadow-sm cursor-pointer"
              >
                Launch Stage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
