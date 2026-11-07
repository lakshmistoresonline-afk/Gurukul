'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  CurriculumApiClient,
  CurriculumIdentity,
  CurriculumApiError,
  buildCurriculumUrl,
  fetchSubjectMedia
} from '@/lib/curriculumClient';
import { sendHybridTutorChat } from '@/lib/webLlmClient';
import RendererRegistry from '@/components/presentation/RendererRegistry';
import AudioReaderToolbar from '@/components/AudioReaderToolbar';
import SelectedTextTutor from '@/components/SelectedTextTutor';
import {
  recordChapterActivity,
  toggleBookmarkStore,
  togglePracticeMarkedStore,
  getStudentProgress,
  syncStudentProgressFromFirestore,
  getAuthoritativeClassForUser
} from '@/lib/studentProgressStore';
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
  Image as ImageIcon,
  Check,
  GraduationCap
} from 'lucide-react';

interface Props {
  segments: string[];
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  overview: 'Overview',
  notes: 'Notes',
  foundational: 'Foundational',
  mindmaps: 'Mindmaps',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  master: 'Master',
  question_papers: 'Question Papers',
};

// 8 Explicit Content Tabs Mapping
const ALL_CONTENT_TABS = [
  { tab: 'overview', name: 'Overview', icon: '🔍' },
  { tab: 'notes', name: 'Notes', icon: '📖' },
  { tab: 'foundational', name: 'Foundational', icon: '💡' },
  { tab: 'mindmaps', name: 'Mindmaps', icon: '🗺️' },
  { tab: 'flashcards', name: 'Flashcards', icon: '⚡' },
  { tab: 'quiz', name: 'Quiz', icon: '🎯' },
  { tab: 'master', name: 'Master', icon: '🏆' },
  { tab: 'question_papers', name: 'Question Papers', icon: '🎓' }
];

export default function CatchAllChapterClient({ segments }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [availableTabs, setAvailableTabs] = useState<Array<{ tab: string; name: string; icon: string }>>(ALL_CONTENT_TABS);
  const [contentData, setContentData] = useState<any>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [prevChapterUrl, setPrevChapterUrl] = useState<string | null>(null);
  const [nextChapterUrl, setNextChapterUrl] = useState<string | null>(null);
  const [chapterVideo, setChapterVideo] = useState<any>(null);
  const [chapterDiagram, setChapterDiagram] = useState<any>(null);
  const [imageError, setImageError] = useState<boolean>(false);

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
      text: "🤖 Hello! I am your Contextual AI Tutor. Ask me anything about this chapter!"
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const uid = user ? user.uid : 'guest';
      const userProgress = user ? await syncStudentProgressFromFirestore(user.uid) : getStudentProgress('guest');
      setIsBookmarked((userProgress.bookmarks || []).includes(canonicalIdentityKey));
      setIsNeedPractice((userProgress.practiceMarked || []).includes(canonicalIdentityKey));
    });
    return () => unsubscribe();
  }, [canonicalIdentityKey]);

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

  // Initialize Chapter Identity
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

        if (Array.isArray(foundChapter.content_types) && foundChapter.content_types.length > 0) {
          const matchedTabs = ALL_CONTENT_TABS.filter(t => foundChapter.content_types.includes(t.tab));
          if (matchedTabs.length > 0) {
            setAvailableTabs(matchedTabs);
          }
        }

        try {
          const mediaRes = await fetchSubjectMedia(subject, grade);
          const vids = mediaRes?.studio_video_links?.videos || [];
          const diag = mediaRes?.media_directory?.diagrams || [];

          const matchVid = vids.find((v: any) =>
            v.chapter_id?.toLowerCase() === chapterId.toLowerCase() ||
            String(v.chapter_number) === String(foundChapter.chapter_number)
          );
          const matchDiag = diag.find((d: any) =>
            d.chapter_id?.toLowerCase() === chapterId.toLowerCase() ||
            String(d.chapter_number) === String(foundChapter.chapter_number)
          );

          setChapterVideo(matchVid || null);
          setChapterDiagram(matchDiag || null);
        } catch (e) {
          console.warn('Failed to load chapter media assets:', e);
          setChapterVideo(null);
          setChapterDiagram(null);
        }

        recordChapterActivity({
          grade,
          subject,
          book,
          part,
          unit,
          chapter_id: chapterId,
          chapter_title: realTitle
        }, currentUser?.uid || 'guest');

      } catch (err: any) {
        const code = err instanceof CurriculumApiError ? err.status : 500;
        setStatusCode(code);
        setErrorMsg(err.message || 'Failed to initialize chapter identity.');
        setLoading(false);
      }
    }

    initializeChapterIdentity();
  }, [segments, grade, subject, book, part, unit, chapterId, canonicalIdentityKey, currentUser]);

  // Fetch Content for Active Tab
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

  const handleToggleBookmark = async () => {
    const uid = currentUser?.uid || 'guest';
    const res = await toggleBookmarkStore(canonicalIdentityKey, uid);
    setIsBookmarked(res.state.bookmarks.includes(canonicalIdentityKey));
  };

  const handleToggleNeedPractice = async () => {
    const uid = currentUser?.uid || 'guest';
    const res = await togglePracticeMarkedStore(canonicalIdentityKey, uid);
    setIsNeedPractice(res.state.practiceMarked.includes(canonicalIdentityKey));
  };

  const scrollStageBar = (direction: 'left' | 'right') => {
    if (stageBarRef.current) {
      const amount = direction === 'left' ? -240 : 240;
      stageBarRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleTabSelect = (tab: string, idx: number) => {
    setActiveTab(tab);
    const btn = document.getElementById(`tab-btn-${idx}`);
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleAiAction = async (action: string) => {
    setTutorDrawerOpen(true);
    setTutorLoading(true);

    const actionText = action === 'explain' ? 'Explain this concept simply'
      : action === 'example' ? 'Give me a real-world example'
      : action === 'quiz' ? 'Quiz me on this chapter'
      : 'Help me understand this lesson';

    setTutorMessages(prev => [...prev, { sender: 'user', text: actionText }]);

    try {
      const response = await sendHybridTutorChat({
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
    } catch (err: any) {
      setTutorMessages(prev => [...prev, { sender: 'ai', text: `⚠️ Unable to connect to AI Tutor: ${err.message || 'Network timeout.'}`, status: 'OFFLINE' }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSendTutorMessage = async () => {
    if (!tutorQuestion.trim() || tutorLoading) return;
    const msg = tutorQuestion.trim();
    setTutorQuestion('');
    setTutorLoading(true);

    setTutorMessages(prev => [...prev, { sender: 'user', text: msg }]);

    try {
      const response = await sendHybridTutorChat({
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
    } catch (err: any) {
      setTutorMessages(prev => [...prev, { sender: 'ai', text: `⚠️ Unable to connect to AI Tutor: ${err.message || 'Network timeout.'}`, status: 'OFFLINE' }]);
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900 p-4 sm:p-6 space-y-6">
      {/* Selected-Text Ask AI Floating Popup */}
      <SelectedTextTutor
        grade={grade}
        subject={subject}
        book={book}
        part={part}
        unit={unit}
        chapter_id={chapterId}
        content_type={activeTab}
      />

      {/* Chapter Workspace Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Link href="/subjects" className="text-teal-700 hover:underline flex items-center gap-1 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" /> All Subjects
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold uppercase font-mono">Class {grade} {subject}</span>
            <span>/</span>
            <span className="text-slate-800 font-bold font-mono">{chapterId}</span>
          </div>

          <div className="flex items-center gap-2">
            {prevChapterUrl && (
              <Link
                href={prevChapterUrl}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev Chapter
              </Link>
            )}

            {nextChapterUrl && (
              <Link
                href={nextChapterUrl}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-teal-600 text-white hover:bg-teal-500 transition-all flex items-center gap-1 shadow-2xs"
              >
                Next Chapter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={handleToggleBookmark}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 inline mr-1" />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

            <button
              onClick={handleToggleNeedPractice}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                isNeedPractice
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 inline mr-1" />
              {isNeedPractice ? 'Marked Practice' : 'Mark for Practice'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {chapterTitle ? `${chapterTitle}` : `Chapter ${chapterId}`}
            <span className="text-xs text-teal-700 font-mono ml-2 uppercase font-extrabold">({subject})</span>
          </h1>

          {/* AI Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Help:
            </span>
            <button onClick={() => handleAiAction('explain')} className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold border border-teal-200 transition-all cursor-pointer">
              Explain Simply
            </button>
            <button onClick={() => handleAiAction('example')} className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold border border-indigo-200 transition-all cursor-pointer">
              Give Example
            </button>
            <button onClick={() => handleAiAction('quiz')} className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold border border-purple-200 transition-all cursor-pointer">
              Quiz Me
            </button>
          </div>
        </div>

        {/* Content Tabs Bar */}
        <div className="relative flex items-center pt-2 border-t border-slate-100">
          <button
            onClick={() => scrollStageBar('left')}
            title="Scroll Left"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 mr-2 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={stageBarRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-1"
          >
            <span className="text-xs font-black text-slate-500 flex items-center gap-1 px-1 shrink-0 uppercase font-mono">
              <Compass className="w-4 h-4 text-teal-600" /> Module:
            </span>
            {availableTabs.map((t, idx) => {
              const isSelected = activeTab === t.tab;
              return (
                <button
                  id={`tab-btn-${idx}`}
                  key={t.tab}
                  onClick={() => handleTabSelect(t.tab, idx)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollStageBar('right')}
            title="Scroll Right"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 ml-2 shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Layout Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Lesson Content */}
        <div className={`${tutorDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          {!loading && contentData && (
            <AudioReaderToolbar
              textToRead={getReadableText(contentData)}
              subject={subject}
              activeTab={CONTENT_TYPE_LABELS[activeTab] || activeTab}
            />
          )}

          {loading && (
            <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs font-black text-slate-700">Loading chapter workspace...</p>
            </div>
          )}

          {statusCode && statusCode !== 200 && !loading && (
            <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-2">
              <p className="text-sm font-black text-amber-900">{errorMsg || 'Unable to load chapter content.'}</p>
            </div>
          )}

          {!loading && statusCode === 200 && contentData && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 leading-relaxed font-medium space-y-6">
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

          {/* Chapter Media Attachments (Images & Videos) */}
          {(chapterDiagram || chapterVideo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {chapterDiagram && (
                <div className="p-4 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-sm">
                  <div className="text-xs font-black text-teal-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-teal-600" /> Concept Diagram Overlay</span>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-bold">Class {grade} {subject.toUpperCase()}</span>
                  </div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-4">
                    {!imageError ? (
                      <Image
                        src={`http://127.0.0.1:8001/api/v1/curriculum/media/stream?subject=${encodeURIComponent(subject)}&filename=${encodeURIComponent(chapterDiagram.filename)}&grade=${grade}`}
                        alt={chapterDiagram.filename || 'Diagram'}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                          🗺️
                        </div>
                        <p className="text-xs font-black text-slate-800">{chapterDiagram.filename || chapterTitle}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Interactive Map Grid Overlay for Class {grade} {subject.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {chapterVideo && (
                <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                  <div className="text-xs font-black text-indigo-800 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" /> Studio Explainer Video
                  </div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200">
                    <video
                      controls
                      controlsList="nodownload"
                      className="w-full h-full object-contain"
                      src={`http://127.0.0.1:8001/api/v1/curriculum/media/stream?subject=${encodeURIComponent(subject)}&filename=${encodeURIComponent(chapterVideo.filename)}&grade=${grade}`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Tutor Drawer Side Panel */}
        {tutorDrawerOpen && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between h-[650px] sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-slate-900 text-sm">Class {grade} AI Tutor</h3>
              </div>
              <button onClick={() => setTutorDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {tutorMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-2xl font-medium ${m.sender === 'user' ? 'bg-teal-600 text-white ml-6 font-bold' : 'bg-slate-100 text-slate-900 mr-2 border border-slate-200'}`}>
                  {m.text}
                </div>
              ))}
              {tutorLoading && (
                <div className="p-3 bg-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>AI Tutor is thinking...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={tutorQuestion}
                onChange={(e) => setTutorQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMessage()}
                placeholder="Ask about this chapter..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={handleSendTutorMessage} className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl shadow-sm">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
