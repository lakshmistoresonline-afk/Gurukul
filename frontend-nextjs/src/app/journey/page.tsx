'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Compass, Sparkles, ArrowRight, BookOpen, AlertCircle, GraduationCap, CheckCircle2, Star } from 'lucide-react';
import {
  getStudentProgress,
  StudentProgressState,
  syncStudentProgressFromFirestore,
  saveSelectedGradePreference,
  getAuthoritativeClassForUser
} from '../../lib/studentProgressStore';
import { buildCurriculumUrl } from '../../lib/curriculumClient';

export default function LearningJourneyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setProgress(synced);
      setSelectedGrade(authGrade);
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid);
      setSelectedGrade(authGrade);
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

  const lastAct = progress.lastActivity;
  const hasActiveChapter = !!(lastAct && lastAct.subject && lastAct.chapter_id);

  const journeyStages = [
    { stage: 1, emoji: '🔎', name: 'Discover', contentType: 'overview', module: 'Chapter Overview', desc: 'Explore chapter storyboards, central themes, and learning goals.', color: 'text-amber-800 bg-amber-100 border-amber-300' },
    { stage: 2, emoji: '📖', name: 'Learn', contentType: 'notes', module: 'Comprehensive Notes', desc: 'Master pedagogical summaries, role-plays, and STEM drawers.', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' },
    { stage: 3, emoji: '🧠', name: 'Understand', contentType: 'foundational', module: 'Foundational Drills', desc: 'Practice language drills, sorting matrices, and core concepts.', color: 'text-teal-800 bg-teal-100 border-teal-300' },
    { stage: 4, emoji: '🧩', name: 'Explore', contentType: 'mindmaps', module: 'Visual Mindmaps', desc: 'Interact with visual concept trees and interactive diagrams.', color: 'text-cyan-800 bg-cyan-100 border-cyan-300' },
    { stage: 5, emoji: '⚡', name: 'Practise', contentType: 'flashcards', module: 'Flashcards & Quiz', desc: 'Active recall flashcards and timed interactive quizzes.', color: 'text-purple-800 bg-purple-100 border-purple-300' },
    { stage: 6, emoji: '🏆', name: 'Challenge', contentType: 'master', module: 'Master Practice', desc: 'Solve higher-order challenge problems and test comprehension.', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    { stage: 7, emoji: '🎓', name: 'Master', contentType: 'question_papers', module: 'Exam Question Papers', desc: 'Test exam readiness with model question papers and step-by-step keys.', color: 'text-rose-800 bg-rose-100 border-rose-300' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 7-Stage Interactive Pathway
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Compass className="w-8 h-8 text-teal-600" /> Class {selectedGrade} Learning Journey
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Follow our 7-stage interactive pathway mapping every Class {selectedGrade} chapter from initial discovery to exam mastery.
            </p>
          </div>

          {/* Class Switcher Badge */}
          {currentUser?.email?.includes('admin') ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-black text-slate-600 px-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-600" /> Admin Class:
              </span>
              {['5', '6', '7'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeSelect(g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
      </div>

      {!hasActiveChapter && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">Please select a Class {selectedGrade} chapter from the Subject Explorer to launch the 7-stage journey.</span>
          </div>
          <Link
            href="/subjects"
            className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-sm transition-all"
          >
            Select Chapter
          </Link>
        </div>
      )}

      {hasActiveChapter && lastAct && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" /> Active Chapter: <strong className="text-slate-900 uppercase font-mono">{lastAct.subject}</strong> ({lastAct.chapter_id})
          </span>
          <Link href="/subjects" className="text-teal-700 hover:underline font-black">Switch Chapter</Link>
        </div>
      )}

      {/* 7-Stage Roadmap Visual Timeline */}
      <div className="space-y-4 relative">
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
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-2xs shrink-0 ${s.color}`}>
                  <span>{s.emoji}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Stage {s.stage}: {s.name}
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">{s.module}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">{s.desc}</p>
                </div>
              </div>

              <Link
                href={stageUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition-all shrink-0 shadow-md cursor-pointer"
              >
                <span>Start Stage {s.stage}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
