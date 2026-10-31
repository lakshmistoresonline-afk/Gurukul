'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CurriculumApiClient, CurriculumIdentity, CurriculumApiError, buildCurriculumUrl } from '@/lib/curriculumClient';
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
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  X
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

// 7-Stage Learning Journey Mapping
const JOURNEY_STAGES = [
  { stage: 1, name: 'Discover', tab: 'overview', icon: '🔍' },
  { stage: 2, name: 'Learn', tab: 'notes', icon: '📖' },
  { stage: 3, name: 'Understand', tab: 'foundational', icon: '💡' },
  { stage: 4, name: 'Explore', tab: 'mindmaps', icon: '🗺️' },
  { stage: 5, name: 'Practise', tab: 'flashcards', icon: '⚡' },
  { stage: 6, name: 'Challenge', tab: 'master', icon: '🏆' },
  { stage: 7, name: 'Master', tab: 'question_papers', icon: '🎓' }
];

export default function CatchAllChapterClient({ segments }: Props) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([]);
  const [contentData, setContentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bookmarks & Need Practice state
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isNeedPractice, setIsNeedPractice] = useState<boolean>(false);

  // Contextual AI Tutor state
  const [tutorDrawerOpen, setTutorDrawerOpen] = useState<boolean>(false);
  const [tutorQuestion, setTutorQuestion] = useState<string>('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "🤖 Hello! I am your Class 5 Contextual AI Tutor. Ask me anything about this chapter!"
    }
  ]);

  const grade = segments[0] || '5';
  const subject = segments[1] || '';
  const book = segments[2] || '';
  const part = segments[3] || '';
  const unit = segments[4] || '';
  const chapterId = segments[5] || '';

  const canonicalIdentityKey = `${grade}:${subject.toLowerCase()}:${book.toLowerCase()}:${part.toLowerCase()}:${unit.toUpperCase()}:${chapterId.toLowerCase()}`;

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

  // 1. Initialize Chapter Identity & Record Activity
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

        // Record student activity
        recordChapterActivity({
          grade,
          subject,
          book,
          part,
          unit,
          chapter_id: chapterId,
          chapter_title: `Chapter ${chapterId}`
        });

        // Fetch authoritative hierarchy
        const hierarchy = await CurriculumApiClient.fetchHierarchy();
        let foundChapter: any = null;

        for (const g of hierarchy) {
          if (String(g.grade) === String(grade)) {
            for (const s of g.subjects || []) {
              if (s.canonical_subject?.toLowerCase() === subject.toLowerCase() || s.subject?.toLowerCase() === subject.toLowerCase()) {
                for (const b of s.books || []) {
                  if (b.book_id?.toLowerCase() === book.toLowerCase() && b.part?.toLowerCase() === part.toLowerCase()) {
                    for (const u of b.units || []) {
                      if (u.unit_id?.toUpperCase() === unit.toUpperCase()) {
                        const ch = (u.chapters || []).find((c: any) => c.chapter_id?.toLowerCase() === chapterId.toLowerCase());
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

        const validContentTypes = foundChapter.content_types || [
          'overview', 'notes', 'master', 'foundational', 'flashcards', 'mindmaps', 'quiz', 'question_papers'
        ];
        setAvailableContentTypes(validContentTypes);
        if (!validContentTypes.includes(activeTab)) {
          setActiveTab(validContentTypes[0]);
        }

      } catch (err: any) {
        const code = err instanceof CurriculumApiError ? err.status : 500;
        setStatusCode(code);
        setErrorMsg(err.message || 'Failed to initialize chapter identity.');
        setLoading(false);
      }
    }

    initializeChapterIdentity();
  }, [segments, grade, subject, book, part, unit, chapterId, canonicalIdentityKey]);

  // 2. Fetch Content for Active Tab
  useEffect(() => {
    async function loadContentForTab() {
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
    }

    loadContentForTab();
  }, [activeTab, grade, subject, book, part, unit, chapterId, segments.length]);

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

  const handleAiAction = (action: string) => {
    setTutorDrawerOpen(true);
    let reply = `🤖 AI Tutor response for Class 5 ${subject.toUpperCase()} (${chapterId}): `;
    if (action === 'explain') reply += `Here is a simplified explanation of the core concept in this chapter.`;
    if (action === 'example') reply += `Here is a real-world example explaining this lesson.`;
    if (action === 'quiz') reply += `Quick Question: What is the primary takeaway of this chapter?`;
    if (action === 'help') reply += `Let's break down this section step-by-step!`;

    setTutorMessages(prev => [...prev, { sender: 'ai', text: reply }]);
  };

  const handleSendTutorMessage = () => {
    if (!tutorQuestion.trim()) return;
    const msg = tutorQuestion.trim();
    setTutorMessages(prev => [
      ...prev,
      { sender: 'user', text: msg },
      { sender: 'ai', text: `🤖 AI Tutor: Grounded in Class 5 NCERT ${subject} (${chapterId}): Here is the explanation for "${msg}".` }
    ]);
    setTutorQuestion('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Compact Chapter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-teal-400">Class {grade}</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/subjects" className="hover:text-teal-400 uppercase">{subject}</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span>Unit: {unit}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-teal-400 font-bold">{chapterId}</span>
          </div>

          {/* Bookmark & Practice Buttons */}
          <div className="flex items-center gap-2">
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
            Chapter {chapterId}: {subject.toUpperCase()}
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
      </div>

      {/* Visible 7-Stage Learning Path Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 px-2 shrink-0">
          <Compass className="w-4 h-4 text-teal-400" /> 7-Stage Path:
        </span>
        {JOURNEY_STAGES.map((s) => {
          const isSelected = activeTab === s.tab;
          return (
            <button
              key={s.stage}
              onClick={() => setActiveTab(s.tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{s.icon}</span>
              <span>Stage {s.stage}: {s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content Tabs Bar */}
      {availableContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          {availableContentTypes.map(ct => (
            <button
              key={ct}
              onClick={() => setActiveTab(ct)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === ct
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {CONTENT_TYPE_LABELS[ct] || ct}
            </button>
          ))}
        </div>
      )}

      {/* Workspace Three-Region Layout (Desktop) / Single Column (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Lesson Content Canvas (Col 1 to 8 or 12) */}
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
        </div>

        {/* Contextual AI Tutor Panel (Col 9 to 12 when open) */}
        {tutorDrawerOpen && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[550px] shadow-2xl sticky top-6">
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
                  <div className={`p-3 rounded-xl max-w-[85%] ${m.sender === 'user' ? 'bg-teal-500 text-slate-950 font-semibold' : 'bg-slate-950 text-slate-300 border border-slate-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
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
              <button onClick={handleSendTutorMessage} className="p-2 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
