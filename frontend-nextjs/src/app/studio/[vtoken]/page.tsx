'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Lock, Sparkles, Video, ExternalLink } from 'lucide-react';
import { unmaskVideoUrl, isNotebookLmVideo, isYoutubeVideo } from '../../../lib/videoSecurity';

export default function StudioMaskedVideoPage() {
  const params = useParams();
  const vtoken = (params?.vtoken as string) || '';

  const [unmaskedUrl, setUnmaskedUrl] = useState<string>('');
  const [isNotebookLm, setIsNotebookLm] = useState<boolean>(false);
  const [isYoutube, setIsYoutube] = useState<boolean>(false);

  useEffect(() => {
    if (vtoken) {
      const realUrl = unmaskVideoUrl(vtoken);
      setUnmaskedUrl(realUrl);
      setIsNotebookLm(isNotebookLmVideo(vtoken));
      setIsYoutube(isYoutubeVideo(vtoken));
    }
  }, [vtoken]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Studio Header Bar */}
      <header className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/subjects"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Learning
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-teal-300 font-mono uppercase tracking-wider">
              Gurukul AI • Secure Studio Session
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 font-bold">
          <Lock className="w-3.5 h-3.5 text-teal-400" />
          <span>Encrypted Stream Channel</span>
        </div>
      </header>

      {/* Main Studio Workspace Player */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-slate-900 border border-teal-500/30 rounded-3xl overflow-hidden shadow-2xl space-y-0">
          <div className="p-4 bg-slate-950 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-teal-300 font-black">
              <Sparkles className="w-4 h-4 text-amber-400" /> Gurukul AI Interactive Video Studio
            </span>
            <span className="font-mono text-[10px] text-slate-500">ID: {vtoken.slice(0, 20)}...</span>
          </div>

          <div className="relative aspect-video w-full bg-black flex flex-col items-center justify-center">
            {isNotebookLm ? (
              <div className="w-full h-full p-8 sm:p-12 bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-4xl shadow-xl border border-teal-400/30">
                  ✨
                </div>
                <div className="space-y-2 max-w-lg">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Google NotebookLM Gemini Studio Lesson
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-200/90 font-medium leading-relaxed">
                    Interactive AI Audio &amp; Video Lesson Workspace prepared authoritatively for Gurukul AI K-12 NCERT curriculum.
                  </p>
                </div>

                <a
                  href={unmaskedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-2xl transition-all flex items-center gap-2 cursor-pointer border border-white/20 transform hover:-translate-y-0.5"
                >
                  <span>Open Interactive Studio Lesson 🔒</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : isYoutube ? (
              <iframe
                src={unmaskedUrl.replace('watch?v=', 'embed/')}
                title="Gurukul AI Secure Video Lesson"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : unmaskedUrl ? (
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                preload="metadata"
                className="w-full h-full object-contain"
                poster="/illustrations/chapter-learning.svg"
              >
                <source src={unmaskedUrl} type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
                <Video className="w-8 h-8 text-slate-600" />
                <span>Initializing secure video stream token...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
