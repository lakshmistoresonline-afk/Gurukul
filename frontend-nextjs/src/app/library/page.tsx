'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Bookmark, Target, ArrowRight } from 'lucide-react';
import { getStudentProgress, StudentProgressState, syncStudentProgressFromFirestore } from '../../lib/studentProgressStore';
import { buildCurriculumUrl } from '../../lib/curriculumClient';

export default function LibraryPage() {
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
      if (user) {
        const synced = await syncStudentProgressFromFirestore(user.uid);
        setProgress(synced);
      } else {
        setProgress(getStudentProgress('guest'));
      }
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-teal-400" /> My Personal Library
        </h1>
        <p className="text-slate-400 text-sm mt-1">Access your saved bookmarks and marked-for-practice chapters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookmarks Section */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-teal-400" />
            <h2 className="text-lg font-bold text-white">Bookmarked Chapters</h2>
          </div>
          <p className="text-xs text-slate-400">Chapters saved for quick reading and revision.</p>

          {progress.bookmarks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No bookmarks saved yet. Click &quot;Bookmark&quot; while reading any chapter!</p>
          ) : (
            <div className="space-y-2">
              {progress.bookmarks.map((key) => {
                const ident = parseIdentityKey(key);
                if (!ident) return null;
                return (
                  <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase">{ident.subject} ({ident.chapter_id})</span>
                    <Link
                      href={buildCurriculumUrl(ident)}
                      className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Practice Markers Section */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Marked for Practice</h2>
          </div>
          <p className="text-xs text-slate-400">Chapters flagged during reading for extra practice.</p>

          {progress.practiceMarked.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No chapters marked for practice yet.</p>
          ) : (
            <div className="space-y-2">
              {progress.practiceMarked.map((key) => {
                const ident = parseIdentityKey(key);
                if (!ident) return null;
                return (
                  <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase">{ident.subject} ({ident.chapter_id})</span>
                    <Link
                      href={buildCurriculumUrl(ident)}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Practice <ArrowRight className="w-3 h-3" />
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
