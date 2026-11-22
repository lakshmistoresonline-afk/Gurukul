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
  GraduationCap,
  Printer,
  FileText,
  ZoomIn,
  ZoomOut,
  Search,
  Columns,
  Zap,
  Maximize2,
  Minimize2,
  Trophy
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

  // Dyslexia & Font Sizing Accessibility State
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [isDyslexicFont, setIsDyslexicFont] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showDiagramLightbox, setShowDiagramLightbox] = useState<boolean>(false);
  const [diagramZoom, setDiagramZoom] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isZenFocusMode, setIsZenFocusMode] = useState<boolean>(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState<boolean>(false);
  const [splitSideContentType, setSplitSideContentType] = useState<string>('mindmaps');
  const [splitSideData, setSplitSideData] = useState<any>(null);
  const [loadingSplitSide, setLoadingSplitSide] = useState<boolean>(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const currentProgress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    if (isSplitView) {
      async function loadSplitSide() {
        try {
          setLoadingSplitSide(true);
          const identity = {
            grade,
            subject,
            book,
            part,
            unit,
            chapter_id: chapterId,
            content_type: splitSideContentType
          };
          const res = await CurriculumApiClient.fetchContent(identity);
          setSplitSideData(res.data);
        } catch (e) {
          console.warn('Failed to load split side content:', e);
          setSplitSideData(null);
        } finally {
          setLoadingSplitSide(false);
        }
      }
      loadSplitSide();
    }
  }, [isSplitView, splitSideContentType, grade, subject, book, part, unit, chapterId]);

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

        // 1. Strict & Flexible Dimension Match
        for (const g of hierarchy) {
          if (String(g.grade) === String(grade)) {
            for (const s of g.subjects || []) {
              const sName = (s.canonical_subject || s.subject || '').toLowerCase();
              if (sName === subject.toLowerCase() || sName.includes(subject.toLowerCase()) || subject.toLowerCase().includes(sName)) {
                for (const b of s.books || []) {
                  const bId = (b.book_id || b.book || '').toLowerCase();
                  const reqBook = (book || '').toLowerCase();
                  if (bId === reqBook || bId === 'main' || reqBook === 'main' || bId.includes(reqBook) || reqBook.includes(bId)) {
                    for (const u of b.units || []) {
                      const uId = (u.unit_id || u.unit || '').toUpperCase();
                      const reqUnit = (unit || '').toUpperCase();
                      if (uId === reqUnit || uId === 'U01' || reqUnit === 'U01' || !uId) {
                        const chs = u.chapters || [];
                        const ch = chs.find((c: any) => (c.chapter_id || c.chapterId || '').toLowerCase() === chapterId.toLowerCase());
                        if (ch) {
                          foundChapter = ch;
                          unitChapters = chs;
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

        // 2. Broad Search Fallback Across Grade & Subject
        if (!foundChapter) {
          for (const g of hierarchy) {
            if (String(g.grade) === String(grade)) {
              for (const s of g.subjects || []) {
                for (const b of s.books || []) {
                  for (const u of b.units || []) {
                    const chs = u.chapters || [];
                    const ch = chs.find((c: any) => (c.chapter_id || c.chapterId || '').toLowerCase() === chapterId.toLowerCase());
                    if (ch) {
                      foundChapter = ch;
                      unitChapters = chs;
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        // 3. Robust Synthesis Fallback for Standard NCERT URLs
        if (!foundChapter && chapterId) {
          const chNum = chapterId.match(/C(\d+)/i)?.[1] || '1';
          foundChapter = {
            chapter_id: chapterId,
            chapter_number: parseInt(chNum, 10),
            chapter_title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Chapter ${chNum}`
          };
          unitChapters = [foundChapter];
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

        setAvailableTabs(ALL_CONTENT_TABS);

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

  const handleNavigateNextChapter = () => {
    if (nextChapterUrl) {
      window.location.href = nextChapterUrl;
      return;
    }
    const match = chapterId.match(/^(G\d+-[A-Z]+-U\d+-C)(\d+)$/i);
    if (match) {
      const prefix = match[1];
      const nextNum = parseInt(match[2], 10) + 1;
      const nextChId = `${prefix}${String(nextNum).padStart(2, '0')}`;
      const url = buildCurriculumUrl({
        grade, subject, book, part, unit, chapter_id: nextChId
      });
      window.location.href = url;
    }
  };

  const handleNavigatePrevChapter = () => {
    if (prevChapterUrl) {
      window.location.href = prevChapterUrl;
      return;
    }
    const match = chapterId.match(/^(G\d+-[A-Z]+-U\d+-C)(\d+)$/i);
    if (match) {
      const prefix = match[1];
      const prevNum = parseInt(match[2], 10) - 1;
      if (prevNum >= 1) {
        const prevChId = `${prefix}${String(prevNum).padStart(2, '0')}`;
        const url = buildCurriculumUrl({
          grade, subject, book, part, unit, chapter_id: prevChId
        });
        window.location.href = url;
      }
    }
  };

  const studentAuthGrade = currentUser
    ? getAuthoritativeClassForUser(currentUser, currentUser.uid)
    : grade;

  const isAdmin = currentUser?.email?.includes('admin');
  const isClassAccessDenied = !isAdmin && currentUser && studentAuthGrade !== grade;

  if (isClassAccessDenied) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
          🛡️
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Class Access Restricted</h2>
          <p className="text-xs text-slate-600 font-semibold">
            Your account is assigned to <strong className="text-teal-700 font-mono text-sm">Class {studentAuthGrade}</strong>. You are not authorized to view Class {grade} curriculum.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/subjects"
            className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs inline-block shadow-md transition-all cursor-pointer"
          >
            Return to My Class {studentAuthGrade} Subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F6F8] text-slate-900 ${isZenFocusMode ? 'fixed inset-0 z-40 p-3 sm:p-6 overflow-y-auto bg-[#F5F6F8]' : 'p-2 sm:p-6 space-y-3 sm:space-y-6'}`}>
      {/* Top Scroll Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

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

      {/* Chapter Workspace Header Card (Decluttered & Streamlined for Maximum Reading Space) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
        {/* Top Title & Primary Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 font-mono">
              <Link href="/subjects" className="text-teal-700 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> All Subjects
              </Link>
              <span>/</span>
              <span className="uppercase font-bold text-slate-800">Class {grade} {subject}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {chapterTitle ? `${chapterTitle}` : `Chapter ${chapterId}`}
              <span className="text-xs text-teal-700 font-mono ml-2 uppercase font-extrabold">({subject})</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Prev & Next Chapter Navigation */}
            <button
              onClick={handleNavigatePrevChapter}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <button
              onClick={handleNavigateNextChapter}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-500 text-white transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Collapsible Tools & Comfort Drawer Toggle */}
            <button
              onClick={() => setShowToolsDrawer(!showToolsDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                showToolsDrawer ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle Tools & Comfort Options"
            >
              ⚙️ Tools {showToolsDrawer ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Collapsible Tools Drawer (Keeps Main Screen Clean & Space-Maximized) */}
        {showToolsDrawer && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* In-Page Text Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in chapter..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Split View Toggle */}
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  isSplitView ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Columns className="w-3.5 h-3.5" /> {isSplitView ? 'Split View ON' : 'Split View'}
              </button>

              {/* Zen Focus Mode */}
              <button
                onClick={() => setIsZenFocusMode(!isZenFocusMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  isZenFocusMode ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-indigo-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isZenFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {isZenFocusMode ? 'Exit Zen Mode' : 'Zen Focus Mode'}
              </button>

              {/* Printable PDF */}
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-white text-indigo-700 border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Printable PDF
              </button>

              {/* Font Sizing Toolbar */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
                <button
                  onClick={() => setFontSize(prev => prev === 'xl' ? 'lg' : prev === 'lg' ? 'base' : 'sm')}
                  className="px-2 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-extrabold cursor-pointer"
                  title="Smaller Font"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(prev => prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'xl')}
                  className="px-2 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-extrabold cursor-pointer"
                  title="Larger Font"
                >
                  A+
                </button>
                <button
                  onClick={() => setIsDyslexicFont(!isDyslexicFont)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                    isDyslexicFont ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {isDyslexicFont ? 'Dyslexic ON' : 'Dyslexia'}
                </button>
              </div>

              {/* Bookmark & Practice Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleBookmark}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    isBookmarked ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>

                <button
                  onClick={handleToggleNeedPractice}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    isNeedPractice ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 inline mr-1" />
                  {isNeedPractice ? 'Marked Practice' : 'Mark for Practice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Quick Help Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Help:
            </span>
            <button onClick={() => handleAiAction('explain')} className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold border border-teal-200 transition-all cursor-pointer">
              Explain Simply
            </button>
            <button onClick={() => handleAiAction('example')} className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold border border-indigo-200 transition-all cursor-pointer">
              Give Example
            </button>
            <button onClick={() => handleAiAction('quiz')} className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold border border-purple-200 transition-all cursor-pointer">
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
              onFontSizeChange={(sz) => setFontSize(sz === 'large' ? 'lg' : sz === 'xlarge' ? 'xl' : 'base')}
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

          {!loading && statusCode === 200 && (
            <div className={`grid grid-cols-1 ${isSplitView ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              <div className="space-y-6">
                {contentData && (
                  <div
                    style={{ fontSize: fontSize === 'sm' ? '13px' : fontSize === 'lg' ? '18px' : fontSize === 'xl' ? '22px' : '15px' }}
                    className={`bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 leading-relaxed font-medium space-y-6 ${isDyslexicFont ? 'dyslexic-font-active' : ''}`}
                  >
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
              </div>

              {isSplitView && (
                <div className="bg-white border border-indigo-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <span className="text-xs font-black text-indigo-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Dynamic Reference View
                    </span>
                    <div className="flex items-center gap-1 bg-indigo-50 p-1 rounded-xl border border-indigo-200">
                      {[
                        { id: 'mindmaps', label: '🧠 Mindmap' },
                        { id: 'flashcards', label: '⚡ Flashcards' },
                        { id: 'foundational', label: '🎯 Foundational' },
                        { id: 'master', label: '🏆 Master' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSplitSideContentType(t.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            splitSideContentType === t.id
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-700 space-y-3 leading-relaxed min-h-[300px]">
                    {loadingSplitSide && (
                      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="text-xs font-bold text-slate-600">Loading {splitSideContentType}...</span>
                      </div>
                    )}

                    {!loadingSplitSide && splitSideData && (
                      <div>
                        {RendererRegistry.resolve({
                          grade,
                          subject,
                          book,
                          part,
                          contentType: splitSideContentType,
                          data: splitSideData
                        })}
                      </div>
                    )}

                    {!loadingSplitSide && !splitSideData && (
                      <div className="p-8 text-center text-slate-500 font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                        Reference content currently unavailable for {splitSideContentType}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chapter Media Attachments (Images & Videos) - Showcase ONLY in Overview Section */}
          {activeTab === 'overview' && (chapterDiagram || chapterVideo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {chapterDiagram && (
                <div className="p-4 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-sm">
                  <div className="text-xs font-black text-teal-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-teal-600" /> Concept Diagram Overlay</span>
                    <button
                      onClick={() => setShowDiagramLightbox(true)}
                      className="text-[10px] font-mono text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200 font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <ZoomIn className="w-3 h-3" /> Zoom Inspector
                    </button>
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

      {/* Concept Diagram Zoom Lightbox Inspector Modal */}
      {showDiagramLightbox && chapterDiagram && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-white">
              <span className="text-xs font-black font-mono uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-400" /> Diagram Inspector: {chapterDiagram.filename}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDiagramZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-teal-400">{Math.round(diagramZoom * 100)}%</span>
                <button
                  onClick={() => setDiagramZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShowDiagramLightbox(false); setDiagramZoom(1); }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-all cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center p-4">
              <div style={{ transform: `scale(${diagramZoom})`, transition: 'transform 0.15s ease-out' }} className="w-full h-full relative">
                <Image
                  src={`http://127.0.0.1:8001/api/v1/curriculum/media/stream?subject=${encodeURIComponent(subject)}&filename=${encodeURIComponent(chapterDiagram.filename)}&grade=${grade}`}
                  alt={chapterDiagram.filename || 'Diagram Inspector'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
