'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  CurriculumApiClient,
  CurriculumIdentity,
  CurriculumApiError,
  buildCurriculumUrl,
  sendTutorChat,
  fetchSubjectMedia
} from '@/lib/curriculumClient';
import RendererRegistry from '@/components/presentation/RendererRegistry';
import AudioReaderToolbar from '@/components/AudioReaderToolbar';
import { recordChapterActivity } from '@/lib/studentProgressStore';
import {
  Compass,
  Bookmark,
  Target,
  Sparkles,
  Bot,
  ChevronRight,
  ChevronLeft,
  Send,
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Play,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  segments: string[];
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  overview: 'Overview',
  notes: 'Notes',
  master: 'Master',
  foundational: 'Foundational',
  flashcards: 'Flashcards',
  mindmaps: 'Mindmaps',
  quiz: 'Quiz',
  question_papers: 'Question Papers',
};

// Option 3: Streamlined 5-Step Learning Journey Mapping
const JOURNEY_STEPS = [
  { step: 1, name: 'Watch & Discover', tab: 'overview', icon: '🔍' },
  { step: 2, name: 'Read & Understand', tab: 'notes', icon: '📖' },
  { step: 3, name: 'Visual Concept Map', tab: 'mindmaps', icon: '🗺️' },
  { step: 4, name: 'Smart Practice', tab: 'quiz', icon: '⚡' },
  { step: 5, name: 'Challenge & Master', tab: 'question_papers', icon: '🏆' }
];

export default function CatchAllChapterClient({ segments }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([]);
  const [contentData, setContentData] = useState<any>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [prevChapterUrl, setPrevChapterUrl] = useState<string | null>(null);
  const [nextChapterUrl, setNextChapterUrl] = useState<string | null>(null);
  const [chapterVideo, setChapterVideo] = useState<any>(null);
  const [chapterDiagram, setChapterDiagram] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bookmarks & Need Practice state
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isNeedPractice, setIsNeedPractice] = useState<boolean>(false);

  // Contextual AI Tutor state
  const [tutorDrawerOpen, setTutorDrawerOpen] = useState<boolean>(false);
  const [tutorQuestion, setTutorQuestion] = useState<string>('');
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; status?: string }>>([
    {
      sender: 'ai',
      text: "🤖 Hello! I am your Class 5 Contextual AI Tutor. Ask me anything about this chapter!"
    }
  ]);

  const stageBarRef = useRef<HTMLDivElement>(null);

  const grade = segments[0] || '5';
  const subject = segments[1] || '';
  const book = segments[2] || '';
  const part = segments[3] || '';
  const unit = segments[4] || '';
  const chapterId = segments[5] || '';

  const canonicalIdentityKey = `${grade}:${subject.toLowerCase()}:${book.toLowerCase()}:${part.toLowerCase()}:${unit.toUpperCase()}:${chapterId.toLowerCase()}`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Extract readable text for Audio Reader Toolbar
  const getReadableText = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.map(item => getReadableText(item)).filter(Boolean).join('. ');
    }
    if (typeof data === 'object') {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string' && v.length > 2) {
          parts.push(v);
        } else if (Array.isArray(v) || (v && typeof v === 'object')) {
          const sub = getReadableText(v);
          if (sub) parts.push(sub);
        }
      }
      return parts.join('. ');
    }
    return '';
  };

  // 1. Initialize Chapter Identity & Retrieve Actual Chapter Title, Media, and Previous/Next Chapter Links
  useEffect(() => {
    async function initializeChapterIdentity() {
      if (segments.length < 6 || !grade || !chapterId) {
        setStatusCode(400);
        setErrorMsg('Invalid Curriculum Identity: Incomplete 6 identity dimensions required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);
        setStatusCode(null);

        // Check bookmarks & need practice
        const bks = JSON.parse(localStorage.getItem('gurukul_canonical_bookmarks') || '[]');
        setIsBookmarked(bks.includes(canonicalIdentityKey));

        const np = JSON.parse(localStorage.getItem('gurukul_canonical_need_practice') || '[]');
        setIsNeedPractice(np.includes(canonicalIdentityKey));

        // Fetch authoritative hierarchy
        const hierarchy = await CurriculumApiClient.fetchHierarchy();
        let foundChapter: any = null;
        let unitChapters: any[] = [];

        for (const g of hierarchy) {
          if (String(g.grade) === String(grade)) {
            for (const s of g.subjects || []) {
              if (s.canonical_subject?.toLowerCase() === subject.toLowerCase() || s.subject?.toLowerCase() === subject.toLowerCase()) {
                for (const b of s.books || []) {
                  if (b.book_id?.toLowerCase() === book.toLowerCase() && b.part?.toLowerCase() === part.toLowerCase()) {
                    for (const u of b.units || []) {
                      if (u.unit_id?.toUpperCase() === unit.toUpperCase()) {
                        unitChapters = u.chapters || [];
                        const ch = unitChapters.find((c: any) => c.chapter_id?.toLowerCase() === chapterId.toLowerCase());
                        if (ch) {
                          foundChapter = ch;
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        if (!foundChapter) {
          setStatusCode(404);
          setErrorMsg(`Chapter identity not found in authoritative registry: Class ${grade} / ${subject} / ${book} / ${part} / ${unit} / ${chapterId}`);
          setLoading(false);
          return;
        }

        const realTitle = foundChapter.chapter_title || foundChapter.chapterTitle || chapterId;
        setChapterTitle(realTitle);

        // Previous and Next Chapter Links
        const chIdx = unitChapters.findIndex((c: any) => c.chapter_id?.toLowerCase() === chapterId.toLowerCase());
        if (chIdx > 0) {
          const prevCh = unitChapters[chIdx - 1];
          setPrevChapterUrl(buildCurriculumUrl({
            grade, subject, book, part, unit, chapter_id: prevCh.chapter_id
          }));
        } else {
          setPrevChapterUrl(null);
        }

        if (chIdx >= 0 && chIdx < unitChapters.length - 1) {
          const nextCh = unitChapters[chIdx + 1];
          setNextChapterUrl(buildCurriculumUrl({
            grade, subject, book, part, unit, chapter_id: nextCh.chapter_id
          }));
        } else {
          setNextChapterUrl(null);
        }

        // Fetch Chapter Media (Videos & Images)
        try {
          const mediaRes = await fetchSubjectMedia(subject, grade);
          const vids = mediaRes?.studio_video_links?.videos || [];
          const diag = mediaRes?.media_directory?.diagrams || [];

          const matchVid = vids.find((v: any) => v.chapter_id?.toLowerCase() === chapterId.toLowerCase() || String(v.chapter_number) === String(foundChapter.chapter_number));
          const matchDiag = diag.find((d: any) => d.chapter_id?.toLowerCase() === chapterId.toLowerCase() || String(d.chapter_number) === String(foundChapter.chapter_number));

          setChapterVideo(matchVid || (vids.length > 0 ? vids[0] : null));
          setChapterDiagram(matchDiag || (diag.length > 0 ? diag[0] : null));
        } catch (e) {
          console.warn('Failed to load chapter media assets:', e);
        }

        // Record student activity with mandatory UID
        recordChapterActivity({
          grade,
          subject,
          book,
          part,
          unit,
          chapter_id: chapterId,
          chapter_title: realTitle
        }, currentUser?.uid || 'guest');

        const validContentTypes = foundChapter.content_types || [
          'overview', 'notes', 'master', 'foundational', 'flashcards', 'mindmaps', 'quiz', 'question_papers'
        ];
        setAvailableContentTypes(validContentTypes);

      } catch (err: any) {
        const code = err instanceof CurriculumApiError ? err.status : 500;
        setStatusCode(code);
        setErrorMsg(err.message || 'Failed to initialize chapter identity.');
        setLoading(false);
      }
    }

    initializeChapterIdentity();
  }, [segments, grade, subject, book, part, unit, chapterId, canonicalIdentityKey, currentUser]);

  // 2. Fetch Content for Active Tab
  const loadContentForTab = useCallback(async () => {
    if (!activeTab || segments.length < 6) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const identity: CurriculumIdentity = {
        grade,
        subject,
        book,
        part,
        unit,
        chapter_id: chapterId,
        content_type: activeTab
      };

      const res = await CurriculumApiClient.fetchContent(identity);
      setContentData(res.data);
      setStatusCode(200);
    } catch (err: any) {
      const code = err instanceof CurriculumApiError ? err.status : 500;
      const msg = err.message || 'An unexpected content resolution failure occurred.';

      setStatusCode(code);
      setErrorMsg(msg);
      setContentData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, grade, subject, book, part, unit, chapterId, segments.length]);

  useEffect(() => {
    loadContentForTab();
  }, [loadContentForTab]);

  const toggleBookmark = () => {
    const bks = JSON.parse(localStorage.getItem('gurukul_canonical_bookmarks') || '[]');
    let nextBks;
    if (isBookmarked) {
      nextBks = bks.filter((key: string) => key !== canonicalIdentityKey);
      setIsBookmarked(false);
    } else {
      nextBks = [...bks, canonicalIdentityKey];
      setIsBookmarked(true);
    }
    localStorage.setItem('gurukul_canonical_bookmarks', JSON.stringify(nextBks));
  };

  const toggleNeedPractice = () => {
    const np = JSON.parse(localStorage.getItem('gurukul_canonical_need_practice') || '[]');
    let nextNp;
    if (isNeedPractice) {
      nextNp = np.filter((key: string) => key !== canonicalIdentityKey);
      setIsNeedPractice(false);
    } else {
      nextNp = [...np, canonicalIdentityKey];
      setIsNeedPractice(true);
    }
    localStorage.setItem('gurukul_canonical_need_practice', JSON.stringify(nextNp));
  };

  // Stage Bar Smooth Scroll Functions
  const scrollStageBar = (direction: 'left' | 'right') => {
    if (stageBarRef.current) {
      const amount = direction === 'left' ? -240 : 240;
      stageBarRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleStageSelect = (tab: string, stepNum: number) => {
    setActiveTab(tab);
    const btn = document.getElementById(`step-btn-${stepNum}`);
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Real Backend AI Tutor Call
  const handleAiAction = async (action: string) => {
    setTutorDrawerOpen(true);
    setTutorLoading(true);

    const actionText = action === 'explain' ? 'Explain this concept simply'
      : action === 'example' ? 'Give me a real-world example'
      : action === 'quiz' ? 'Quiz me on this chapter'
      : 'Help me understand this lesson';

    setTutorMessages(prev => [...prev, { sender: 'user', text: actionText }]);

    const response = await sendTutorChat({
      grade,
      subject,
      book,
      part,
      unit,
      chapter_id: chapterId,
      content_type: activeTab,
      question: actionText,
      action
    });

    setTutorMessages(prev => [...prev, { sender: 'ai', text: response.response, status: response.status }]);
    setTutorLoading(false);
  };

  const handleSendTutorMessage = async () => {
    if (!tutorQuestion.trim() || tutorLoading) return;
    const msg = tutorQuestion.trim();
    setTutorQuestion('');
    setTutorLoading(true);

    setTutorMessages(prev => [...prev, { sender: 'user', text: msg }]);

    const response = await sendTutorChat({
      grade,
      subject,
      book,
      part,
      unit,
      chapter_id: chapterId,
      content_type: activeTab,
      question: msg
    });

    setTutorMessages(prev => [...prev, { sender: 'ai', text: response.response, status: response.status }]);
    setTutorLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Sticky Compact Chapter Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Breadcrumb & Chapter Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-teal-400">Class {grade}</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/subjects" className="hover:text-teal-400 uppercase">{subject}</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span>Unit: {unit}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-teal-400 font-bold">{chapterId}</span>
          </div>

          {/* Previous / Next Chapter & Bookmark Buttons */}
          <div className="flex items-center gap-2">
            {prevChapterUrl && (
              <Link
                href={prevChapterUrl}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-teal-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev Chapter
              </Link>
            )}

            {nextChapterUrl && (
              <Link
                href={nextChapterUrl}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-teal-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1"
              >
                Next Chapter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={toggleBookmark}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 inline mr-1" />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

            <button
              onClick={toggleNeedPractice}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isNeedPractice
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Target className="w-3.5 h-3.5 inline mr-1" />
              {isNeedPractice ? 'Marked Practice' : 'Mark for Practice'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {chapterTitle ? `${chapterTitle}` : `Chapter ${chapterId}`}
            <span className="text-xs text-slate-400 font-mono ml-2 uppercase">({subject})</span>
          </h1>

          {/* AI Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Help:
            </span>
            <button onClick={() => handleAiAction('explain')} className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium">
              Explain Simply
            </button>
            <button onClick={() => handleAiAction('example')} className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium">
              Give Example
            </button>
            <button onClick={() => handleAiAction('quiz')} className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium">
              Quiz Me
            </button>
            <button onClick={() => handleAiAction('help')} className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium">
              Help Me
            </button>
          </div>
        </div>

        {/* Option 3: Streamlined 5-Step Learning Journey Stepper with Auto-Scroll & Arrows */}
        <div className="relative flex items-center pt-2 border-t border-slate-800">
          <button
            onClick={() => scrollStageBar('left')}
            title="Scroll Left"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 mr-2 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={stageBarRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-1"
          >
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 px-1 shrink-0">
              <Compass className="w-4 h-4 text-teal-400" /> 5-Step Path:
            </span>
            {JOURNEY_STEPS.map((s) => {
              const isSelected = activeTab === s.tab;
              return (
                <button
                  id={`step-btn-${s.step}`}
                  key={s.step}
                  onClick={() => handleStageSelect(s.tab, s.step)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white border-teal-400 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>Step {s.step}: {s.name} ({CONTENT_TYPE_LABELS[s.tab] || s.tab})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollStageBar('right')}
            title="Scroll Right"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 ml-2 shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Three-Region Layout (Desktop) / Single Column (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Lesson Content Canvas */}
        <div className={`${tutorDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          {!loading && contentData && (
            <AudioReaderToolbar
              textToRead={getReadableText(contentData)}
              subject={subject}
              activeTab={CONTENT_TYPE_LABELS[activeTab] || activeTab}
            />
          )}

          {loading && (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs font-bold">Loading chapter content...</p>
            </div>
          )}

          {statusCode && statusCode !== 200 && !loading && (
            <div className="p-8 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-2">
              <h3 className="text-base font-bold text-rose-300">Content Resolution Failure ({statusCode})</h3>
              <p className="text-xs text-rose-400 max-w-md mx-auto">{errorMsg}</p>
            </div>
          )}

          {/* 1. Main Lesson Overview / Text Content */}
          {statusCode === 200 && !loading && contentData && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
              {RendererRegistry.resolve({
                grade,
                subject,
                book,
                part,
                contentType: activeTab,
                data: contentData
              })}
            </div>
          )}

          {/* 2. Media Showcase Cards — ONLY in Step 1 (Overview) AND Positioned BELOW the Overview Section */}
          {activeTab === 'overview' && !loading && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Studio Video Lesson Player Card */}
              {chapterVideo && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-indigo-400" /> Studio Video Lesson: {chapterVideo.title || chapterTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Class 5 {subject} Video</span>
                  </div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                    <video
                      controls
                      controlsList="nodownload"
                      className="w-full h-full object-contain"
                      src={`http://127.0.0.1:8001/api/v1/curriculum/media/stream?subject=${subject}&filename=${encodeURIComponent(chapterVideo.filename)}`}
                    />
                  </div>
                </div>
              )}

              {/* Interactive 16:9 Hotspot Diagram Card */}
              {chapterDiagram && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-teal-400" /> Interactive Hotspot Diagram: {chapterDiagram.filename}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Class 5 {subject} 16:9 Diagram</span>
                  </div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <img
                      src={`http://127.0.0.1:8001/api/v1/curriculum/media/stream?subject=${subject}&filename=${encodeURIComponent(chapterDiagram.filename)}`}
                      alt={chapterDiagram.title || chapterTitle}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contextual AI Tutor Panel */}
        {tutorDrawerOpen && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[550px] shadow-2xl sticky top-28">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Contextual AI Tutor</h3>
              </div>
              <button onClick={() => setTutorDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
              {tutorMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-teal-500 text-slate-950 font-semibold'
                      : m.status === 'OFFLINE'
                      ? 'bg-amber-950/60 border border-amber-800 text-amber-200'
                      : 'bg-slate-950 text-slate-300 border border-slate-800'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {tutorLoading && (
                <div className="flex items-center gap-2 text-xs text-teal-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Querying AI Tutor...
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={tutorQuestion}
                onChange={(e) => setTutorQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMessage()}
                placeholder="Ask about this lesson..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSendTutorMessage}
                disabled={tutorLoading}
                className="p-2 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
