'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  FlaskConical,
  Play,
  Image as ImageIcon,
  Sparkles,
  GraduationCap,
  Loader2,
  BookOpen,
  Feather,
  Calculator,
  Globe,
  ChevronRight
} from 'lucide-react';
import { fetchSubjectMedia, buildCurriculumUrl } from '../../lib/curriculumClient';
import { syncStudentProgressFromFirestore, getAuthoritativeClassForUser, getStudentProgress } from '../../lib/studentProgressStore';

export default function DiscoveryLabPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [mediaData, setMediaData] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
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

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        const res = await fetchSubjectMedia(selectedSubject, selectedGrade);
        setMediaData(res.media_directory || null);
        setVideoData(res.studio_video_links || null);
      } catch (e) {
        console.error('Error loading discovery assets:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, [selectedSubject, selectedGrade]);

  const diagrams: any[] = mediaData?.diagrams || mediaData?.items || [];
  const videos: any[] = videoData?.videos || videoData?.items || [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F6F8] min-h-screen">
      {/* Header Banner */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold border border-teal-300 mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Interactive Visual Simulations
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-teal-600" /> Discovery Lab
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-semibold">
              Discover interactive hotspot diagrams, mindmap concept trees, and studio explainer videos for Class {selectedGrade}!
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-teal-200 text-teal-900 text-xs font-extrabold shadow-2xs">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>Assigned Class: <strong className="font-mono text-teal-700">Class {selectedGrade}</strong></span>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        {[
          { id: 'english', label: 'English', emoji: '📘' },
          { id: 'hindi', label: 'Hindi', emoji: '📜' },
          { id: 'maths', label: 'Mathematics', emoji: '📐' },
          { id: 'science', label: 'Science', emoji: '🧪' }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSubject(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedSubject === s.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Asset Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagrams & Hotspots Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-600" /> Interactive Diagram Maps
            </h2>
            <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {diagrams.length} Diagrams
            </span>
          </div>

          {loading && (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <span className="text-xs font-bold">Loading media index...</span>
            </div>
          )}

          {!loading && diagrams.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-extrabold text-slate-600">Diagram maps available inside Class {selectedGrade} chapter workspaces.</p>
            </div>
          )}

          <div className="space-y-3">
            {diagrams.map((d: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-teal-300 transition-all">
                <div>
                  <p className="font-black text-slate-900">{d.title || d.filename}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Hotspots: {d.hotspots?.length || 1} overlays</p>
                </div>
                <Link
                  href={buildCurriculumUrl({
                    grade: selectedGrade,
                    subject: selectedSubject,
                    book: selectedSubject,
                    part: 'main',
                    unit: 'U01',
                    chapter_id: `G${selectedGrade}-${selectedSubject.slice(0, 3).toUpperCase()}-U01-C01`,
                    content_type: 'mindmaps'
                  })}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>View Map</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Video Lessons Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-600" /> Studio Explainer Videos
            </h2>
            <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              {videos.length} Videos
            </span>
          </div>

          {loading && (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <span className="text-xs font-bold">Loading video index...</span>
            </div>
          )}

          {!loading && videos.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-extrabold text-slate-600">Video lessons available inside Class {selectedGrade} chapter workspaces.</p>
            </div>
          )}

          <div className="space-y-3">
            {videos.map((v: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:border-indigo-300 transition-all">
                <div>
                  <p className="font-black text-slate-900">{v.title || v.filename}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Duration: {v.duration_seconds || 180}s</p>
                </div>
                <Link
                  href={buildCurriculumUrl({
                    grade: selectedGrade,
                    subject: selectedSubject,
                    book: selectedSubject,
                    part: 'main',
                    unit: 'U01',
                    chapter_id: `G${selectedGrade}-${selectedSubject.slice(0, 3).toUpperCase()}-U01-C01`,
                    content_type: 'notes'
                  })}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>Play Video</span>
                  <Play className="w-3.5 h-3.5 fill-white" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
