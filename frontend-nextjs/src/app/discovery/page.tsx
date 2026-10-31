'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Play, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { fetchSubjectMedia, buildCurriculumUrl } from '../../lib/curriculumClient';

export default function DiscoveryLabPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [mediaData, setMediaData] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        const res = await fetchSubjectMedia(selectedSubject, '5');
        setMediaData(res.media_directory || null);
        setVideoData(res.studio_video_links || null);
      } catch (e) {
        console.error('Error loading discovery assets:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, [selectedSubject]);

  const diagrams: any[] = mediaData?.diagrams || mediaData?.items || [];
  const videos: any[] = videoData?.videos || videoData?.items || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-teal-400" /> Discovery Lab
        </h1>
        <p className="text-slate-400 text-sm mt-1">Discover interactive hotspot diagrams, mindmap concept trees, and studio explainer videos.</p>
      </div>

      {/* Subject Filter */}
      <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        {['english', 'hindi', 'maths', 'science'].map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedSubject === subj
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Asset Explorer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagrams & Hotspots Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-400" /> Interactive Diagram Maps
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300">
              {diagrams.length} Diagrams
            </span>
          </div>

          {loading && <p className="text-xs text-slate-500">Loading media index...</p>}
          {!loading && diagrams.length === 0 && (
            <p className="text-xs text-slate-500">Diagram maps available inside chapter workspace.</p>
          )}

          <div className="space-y-3">
            {diagrams.map((d: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{d.title || d.image_filename}</p>
                  <p className="text-[10px] text-slate-400">Hotspots: {d.hotspots?.length || 0} overlays</p>
                </div>
                <Link
                  href={buildCurriculumUrl({
                    grade: '5',
                    subject: selectedSubject,
                    book: selectedSubject,
                    part: 'main',
                    unit: 'U01',
                    chapter_id: `G5-${selectedSubject.slice(0,3).toUpperCase()}-U01-C01`,
                    content_type: 'mindmaps'
                  })}
                  className="text-teal-400 hover:underline font-semibold"
                >
                  View Map
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Video Lessons Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" /> Studio Explainer Videos
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
              {videos.length} Videos
            </span>
          </div>

          {loading && <p className="text-xs text-slate-500">Loading video index...</p>}
          {!loading && videos.length === 0 && (
            <p className="text-xs text-slate-500">Video lessons available in chapter workspace.</p>
          )}

          <div className="space-y-3">
            {videos.map((v: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{v.title || v.video_id}</p>
                  <p className="text-[10px] text-slate-400">Duration: {v.duration_seconds || 180}s</p>
                </div>
                <button className="text-indigo-400 font-semibold hover:underline">
                  Play Video
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
