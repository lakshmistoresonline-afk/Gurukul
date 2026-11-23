import React, { useState } from 'react';
import { renderSafeText } from './safeRender';
import { maskVideoUrl, unmaskVideoUrl, isNotebookLmVideo, isYoutubeVideo } from '../../lib/videoSecurity';

interface OverviewProps {
  data: any;
  chapterTitle?: string;
  unitTitle?: string;
  subject?: string;
}

export default React.memo(function OverviewComponent({ data, chapterTitle, unitTitle, subject }: OverviewProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('summary');
  const [reflectionAnswer, setReflectionAnswer] = useState<string | null>(null);
  const [showStudioModal, setShowStudioModal] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-600 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <span>Overview Ready</span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Chapter Overview</h3>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
          No overview content is available for this chapter yet.
        </p>
      </div>
    );
  }

  const summary = data.summary || data.overview || data.core_summary || data.description || '';
  const theme = data.centralTheme || data.theme_and_moral || data.central_theme || (summary ? summary.slice(0, 120) + '...' : chapterTitle) || 'Chapter Core Concept';
  const objectives = data.learningObjectives || data.pedagogical_objectives || data.key_concepts || [];
  const takeaways = data.importantTakeaways || data.key_takeaways || [];
  const terms = data.keyTerminology || data.vocabulary || data.key_terms || [];

  const rawVideo = data.video_url || data.video_link || data.video || data.video_path || '';
  const maskedToken = maskVideoUrl(rawVideo);
  const unmaskedUrl = unmaskVideoUrl(maskedToken);
  const isNotebookLm = isNotebookLmVideo(maskedToken);
  const isYoutube = isYoutubeVideo(maskedToken);

  const subjLower = (subject || '').toLowerCase();
  const subjectIllustration = subjLower.includes('sci')
    ? '/illustrations/science_plant_growth.svg'
    : subjLower.includes('mat')
    ? '/illustrations/maths_fraction_learning.svg'
    : '/illustrations/chapter_overview.svg';

  return (
    <div className="space-y-6">
      {/* Sub-Section Selector Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📖 Summary & Theme
          </button>
          {objectives.length > 0 && (
            <button
              onClick={() => setActiveSubTab('objectives')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'objectives' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              🎯 Learning Objectives ({objectives.length})
            </button>
          )}
          {takeaways.length > 0 && (
            <button
              onClick={() => setActiveSubTab('takeaways')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'takeaways' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              💡 Key Takeaways ({takeaways.length})
            </button>
          )}
          {terms.length > 0 && (
            <button
              onClick={() => setActiveSubTab('vocabulary')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'vocabulary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              📚 Vocabulary ({terms.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Summary & Theme (Contains the Chapter Hero Gradient Card with Learning-First Illustration) */}
      {activeSubTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-8 sm:p-10 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white shadow-xl space-y-4 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <span>{unitTitle || 'Curriculum Unit'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{chapterTitle || 'Chapter Overview'}</h2>
              {summary && (
                <blockquote className="border-l-4 border-teal-400 pl-4 py-1 text-indigo-100 text-base sm:text-lg leading-relaxed opacity-90 font-medium">
                  {renderSafeText(summary)}
                </blockquote>
              )}
            </div>
            <div className="hidden lg:block w-44 h-36 shrink-0 opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={subjectIllustration}
                alt="Subject Learning Illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Chapter Video Lesson Player Card (Compact Entry with Full Player Preservation & Security) */}
          {maskedToken && (
            <div className="p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 select-none" onContextMenu={(e) => e.preventDefault()}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg shrink-0 border border-teal-200">
                    🎥
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase flex items-center gap-2">
                      <span>🔒 NCERT {isNotebookLm || videoLoadError ? 'Protected NotebookLM Studio Lesson' : 'Protected Video Lesson'}</span>
                    </h3>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {data.video_title || chapterTitle || 'Interactive Video Lesson'}
                    </h4>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full font-bold border border-teal-200 shrink-0">
                  {isNotebookLm || videoLoadError ? '✨ Encrypted Studio Stream' : 'Protected HD Lesson'}
                </span>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner max-h-[460px]">
                {unmaskedUrl.startsWith('http') ? (
                  <iframe
                    src={unmaskedUrl}
                    title={data.video_title || chapterTitle || 'NCERT Studio Video Lesson'}
                    className="w-full h-full border-0 rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    onError={() => setVideoLoadError(true)}
                    preload="metadata"
                    className="w-full h-full object-contain rounded-2xl"
                    poster="/illustrations/chapter_overview.svg"
                  >
                    <source src={unmaskedUrl} type="video/mp4" />
                    Your browser does not support HTML5 video playback.
                  </video>
                )}
              </div>
            </div>
          )}

          {theme && (
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase">The Big Idea & Theme</h3>
              <p className="text-slate-800 text-base font-semibold leading-relaxed">
                {renderSafeText(theme)}
              </p>
            </div>
          )}

          {data.image_asset && (
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase">Interactive Concept Diagram &amp; Hotspots</h3>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold">{data.image_asset.type || '16:9 Diagram'}</span>
              </div>
              <p className="text-xs font-bold text-slate-900">{data.image_asset.title}</p>

              {/* Render Chapter Diagram Image Directly with Fallbacks */}
              {(data.image_asset.asset_url || data.image_asset.url || data.image_asset.filename) && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-center p-3 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.image_asset.asset_url || data.image_asset.url || `/assets/images/${data.image_asset.filename}`}
                    alt={data.image_asset.alt_text || data.image_asset.title || 'Chapter Diagram'}
                    className="max-h-[380px] w-auto object-contain rounded-xl shadow-xs"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (data.image_asset.filename && !img.src.includes(data.image_asset.filename)) {
                        img.src = `/assets/images/${data.image_asset.filename}`;
                      }
                    }}
                  />
                </div>
              )}

              {Array.isArray(data.image_asset.hotspots) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {data.image_asset.hotspots.map((hs: any, idx: number) => {
                    const hsTitle = hs.title || hs.label || hs.name || `Hotspot #${idx + 1}`;
                    const hsDesc = hs.description || hs.tooltip || hs.info || hs.tooltip_explanation || '';
                    return (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                        <div className="text-xs font-extrabold text-teal-700">{hsTitle}</div>
                        {hsDesc && <p className="text-[11px] text-slate-600 leading-relaxed">{hsDesc}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Interactive Pause & Reflect Checkpoint */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/85 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-black uppercase tracking-wider">
              <span>🧠 Pause & Reflect Checkpoint</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              How confident are you in explaining the core theme of &ldquo;{chapterTitle || data.chapter_title || 'this chapter'}&rdquo;?
            </h4>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => setReflectionAnswer('High Confidence 🌟')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${reflectionAnswer === 'High Confidence 🌟' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🌟 High Confidence
              </button>
              <button
                onClick={() => setReflectionAnswer('Need Practice 🔍')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${reflectionAnswer === 'Need Practice 🔍' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🔍 Need Practice
              </button>
            </div>
            {reflectionAnswer && (
              <div className="p-3 bg-white/80 rounded-xl text-xs font-bold text-teal-900 border border-teal-200">
                Recorded Response: &ldquo;{reflectionAnswer}&rdquo; — Keep up the fantastic curiosity!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Learning Objectives */}
      {activeSubTab === 'objectives' && Array.isArray(objectives) && objectives.length > 0 && (
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase">What You Will Learn</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {objectives.map((obj: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-medium">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">✓</span>
                <span>{typeof obj === 'string' ? obj : obj.title || obj.objective || JSON.stringify(obj)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab 3: Key Takeaways */}
      {activeSubTab === 'takeaways' && Array.isArray(takeaways) && takeaways.length > 0 && (
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase">Key Takeaways</h3>
          <div className="space-y-3">
            {takeaways.map((t: any, idx: number) => (
              <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-slate-800 text-sm leading-relaxed font-medium">
                {typeof t === 'string' ? t : t.takeaway || t.text || JSON.stringify(t)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Vocabulary (Showcases vocabulary_cards.svg) */}
      {activeSubTab === 'vocabulary' && Array.isArray(terms) && terms.length > 0 && (
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black tracking-widest text-indigo-600 uppercase">Key Vocabulary &amp; Terms</h3>
            <div className="w-10 h-10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/vocabulary_cards.svg" alt="Vocabulary Illustration" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {terms.map((term: any, idx: number) => {
              const termName = typeof term === 'string' ? term : term.term || term.word || '';
              const def = typeof term === 'object' ? term.definition || term.meaning : '';
              return (
                <div key={idx} className="group relative px-4 py-2.5 bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-2xl text-indigo-900 hover:text-white text-xs font-bold transition-all cursor-default shadow-sm">
                  <span>{termName}</span>
                  {def && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-10 font-normal normal-case leading-normal">
                      {def}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
