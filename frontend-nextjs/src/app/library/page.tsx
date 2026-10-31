'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Target, ArrowRight } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-teal-400" /> My Personal Library
        </h1>
        <p className="text-slate-400 text-sm mt-1">Access your saved bookmarks, marked-for-practice chapters, and offline lessons.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-teal-400" />
            <h2 className="text-lg font-bold text-white">Bookmarked Chapters</h2>
          </div>
          <p className="text-xs text-slate-400">Chapters saved for quick reading and revision.</p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-medium text-white">Class 5 English — Papa&apos;s Spectacles</span>
            <Link href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01" className="text-teal-400 hover:underline flex items-center gap-1">
              Read <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Marked for Practice</h2>
          </div>
          <p className="text-xs text-slate-400">Topics flagged during lessons for revision.</p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-medium text-white">Class 5 Science — Water Cycle &amp; Digestion</span>
            <Link href="/curriculum?grade=5&subject=science&book=science&part=main&unit=U01&chapter_id=G5-SCI-U01-C01" className="text-teal-400 hover:underline flex items-center gap-1">
              Practice <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
