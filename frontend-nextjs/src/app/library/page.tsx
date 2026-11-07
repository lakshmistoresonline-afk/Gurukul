'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Bookmark, Target, ArrowRight, Sparkles, GraduationCap, BookOpen, Layers } from 'lucide-react';
import {
  getStudentProgress,
  StudentProgressState,
  syncStudentProgressFromFirestore,
  getAuthoritativeClassForUser
} from '../../lib/studentProgressStore';
import { buildCurriculumUrl } from '../../lib/curriculumClient';

export default function LibraryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
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
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setProgress(synced);
      setSelectedGrade(authGrade);
    });
    return () => unsubscribe();
  }, []);

  const parseIdentityKey = (key: string) => {
    const parts = key.split(':');
    if (parts.length >= 6) {
      return {
        grade: parts[0],
        subject: parts[1],
        book: parts[2],
        part: parts[3],
        unit: parts[4],
        chapter_id: parts[5]
      };
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Personal Study Library
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Bookmark className="w-8 h-8 text-teal-600" /> My Personal Library
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Access your saved bookmarks, chapter notes, and marked-for-practice Class {selectedGrade} study modules!
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-teal-200 text-teal-900 text-xs font-extrabold shadow-2xs">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>Assigned Class: <strong className="font-mono text-teal-700">Class {selectedGrade}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookmarks Section */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black border border-teal-200 shadow-2xs">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Bookmarked Chapters</h2>
                <p className="text-xs text-slate-500 font-semibold">Saved for quick reading and revision</p>
              </div>
            </div>
            <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {progress.bookmarks.length} Saved
            </span>
          </div>

          {progress.bookmarks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="text-xs font-extrabold text-slate-600">No bookmarks saved yet.</p>
              <p className="text-[11px] text-slate-400 font-medium">Click &ldquo;Bookmark&rdquo; while reading any chapter workspace to save it here!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {progress.bookmarks.map((key) => {
                const ident = parseIdentityKey(key);
                if (!ident) return null;
                return (
                  <div key={key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-teal-300 transition-all">
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-900 capitalize block">{ident.subject}</span>
                      <span className="font-mono text-[10px] text-teal-700 font-bold">{ident.chapter_id}</span>
                    </div>
                    <Link
                      href={buildCurriculumUrl(ident)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Practice Markers Section */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black border border-amber-200 shadow-2xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Marked for Practice</h2>
                <p className="text-xs text-slate-500 font-semibold">Flagged for extra revision & practice</p>
              </div>
            </div>
            <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {progress.practiceMarked.length} Flagged
            </span>
          </div>

          {progress.practiceMarked.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="text-xs font-extrabold text-slate-600">No chapters marked for practice yet.</p>
              <p className="text-[11px] text-slate-400 font-medium">Flag any chapter while practicing to keep track of revision goals!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {progress.practiceMarked.map((key) => {
                const ident = parseIdentityKey(key);
                if (!ident) return null;
                return (
                  <div key={key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-amber-300 transition-all">
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-900 capitalize block">{ident.subject}</span>
                      <span className="font-mono text-[10px] text-amber-700 font-bold">{ident.chapter_id}</span>
                    </div>
                    <Link
                      href={buildCurriculumUrl(ident)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>Start Practice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
