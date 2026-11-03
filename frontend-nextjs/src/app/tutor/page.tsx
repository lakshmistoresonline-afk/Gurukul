'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2, Copy, Volume2, VolumeX, RotateCcw, ThumbsUp, ThumbsDown, Check, HelpCircle, Compass, Globe } from 'lucide-react';
import { getCurriculumHierarchy } from '../../lib/curriculumClient';
import { sendHybridTutorChat } from '../../lib/webLlmClient';
import { getStudentProgress } from '../../lib/studentProgressStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  question: string;
  grade: string;
  subject: string;
  book: string;
  part: string;
  unit: string;
  chapter_id: string;
  mode?: string;
  model?: string;
  status?: string;
  media?: {
    diagram?: string;
    video?: string;
  };
  rating?: 'up' | 'down' | null;
}

export default function AiTutorPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('5');
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('G5-ENG-U01-C01');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "🤖 Welcome! I am your GURUKUL AI Contextual NCERT Tutor. Ask me any question about your active chapter or explore other subjects!",
      question: '',
      grade: '5',
      subject: 'english',
      book: 'english',
      part: 'main',
      unit: 'U01',
      chapter_id: 'G5-ENG-U01-C01',
      mode: 'NCERT_CHAPTER',
      model: 'NCERT Grounded AI Engine'
    }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
        const prog = getStudentProgress('guest');
        setSelectedGrade(prog.selectedGrade || '5');
      } catch (e) {
        console.error('Failed to load hierarchy in tutor page:', e);
      }
    }
    loadData();

    const handleGradeChanged = () => {
      const prog = getStudentProgress('guest');
      setSelectedGrade(prog.selectedGrade || '5');
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => window.removeEventListener('gradeChanged', handleGradeChanged);
  }, []);

  const gradeData = hierarchy.find((item: any) => String(item.grade) === String(selectedGrade));
  const subjectsList = gradeData?.subjects || [];
  const currentSubjectObj = subjectsList.find((s: any) =>
    s.canonical_subject?.toLowerCase() === selectedSubject.toLowerCase() ||
    s.subject?.toLowerCase() === selectedSubject.toLowerCase()
  );

  const availableChapters: any[] = [];
  (currentSubjectObj?.books || []).forEach((b: any) => {
    (b.units || []).forEach((u: any) => {
      (u.chapters || []).forEach((ch: any) => {
        availableChapters.push(ch);
      });
    });
  });

  const activeChapterObj = availableChapters.find((c: any) => c.chapter_id === selectedChapterId) || availableChapters[0];
  const activeChapterTitle = activeChapterObj?.chapter_title || selectedChapterId;

  const handleSendQuery = async (customQuestion?: string, targetSubject?: string, targetChapter?: string) => {
    const queryText = (customQuestion || question).trim();
    if (!queryText || loading) return;

    const activeSubj = targetSubject || selectedSubject;
    const activeBook = currentSubjectObj?.books?.[0]?.book_id || activeSubj;
    const activePart = currentSubjectObj?.books?.[0]?.part || 'main';
    const activeUnit = 'U01';
    const activeChId = targetChapter || selectedChapterId || `G${selectedGrade}-${activeSubj.slice(0,3).toUpperCase()}-U01-C01`;

    if (targetSubject && targetSubject !== selectedSubject) {
      setSelectedSubject(targetSubject);
    }
    if (targetChapter && targetChapter !== selectedChapterId) {
      setSelectedChapterId(targetChapter);
    }

    setQuestion('');
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
      question: queryText,
      grade: selectedGrade,
      subject: activeSubj,
      book: activeBook,
      part: activePart,
      unit: activeUnit,
      chapter_id: activeChId
    };

    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await sendHybridTutorChat({
        grade: selectedGrade,
        subject: activeSubj,
        book: activeBook,
        part: activePart,
        unit: activeUnit,
        chapter_id: activeChId,
        content_type: 'overview',
        question: queryText
      });

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: response.response,
        question: queryText,
        grade: selectedGrade,
        subject: activeSubj,
        book: activeBook,
        part: activePart,
        unit: activeUnit,
        chapter_id: activeChId,
        mode: response.mode || (response.response.includes('General Knowledge') ? 'GENERAL_KNOWLEDGE' : 'NCERT_CHAPTER'),
        model: response.model || 'GURUKUL AI Engine',
        status: response.status,
        media: response.media
      };

      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsgId = `err-${Date.now()}`;
      setChatHistory(prev => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'ai',
          text: `🤖 **NCERT Class ${selectedGrade} AI Tutor**: I couldn't generate an answer right now. Please try again or rephrase your question.`,
          question: queryText,
          grade: selectedGrade,
          subject: activeSubj,
          book: activeBook,
          part: activePart,
          unit: activeUnit,
          chapter_id: activeChId,
          mode: 'GENERAL_KNOWLEDGE',
          model: 'GURUKUL AI Fallback Engine',
          status: 'OFFLINE'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryMessage = (msg: ChatMessage) => {
    if (!msg.question || loading) return;
    handleSendQuery(msg.question, msg.subject, msg.chapter_id);
  };

  const handleCopyText = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSpeechToggle = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const handleRating = (id: string, rating: 'up' | 'down') => {
    setChatHistory(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
  };

  const renderChatMessage = (msg: ChatMessage) => {
    if (!msg.text) return null;
    if (msg.sender === 'user') return msg.text;

    const lines = msg.text.split('\n');
    const textLines: string[] = [];
    let imageUrl: string | null = msg.media?.diagram || null;
    let videoUrl: string | null = msg.media?.video || null;

    lines.forEach(line => {
      if (line.includes('api/v1/curriculum/media/stream') && (line.includes('.png') || line.includes('.jpg'))) {
        const match = line.match(/(https?:\/\/[^\s`]+(?:\.png|\.jpg)[^\s`]*|\/api\/v1\/curriculum\/media\/stream[^\s`]*)/i);
        if (match && !imageUrl) imageUrl = match[1];
      } else if (line.includes('api/v1/curriculum/media/stream') && line.includes('.mp4')) {
        const match = line.match(/(https?:\/\/[^\s`]+(?:\.mp4)[^\s`]*|\/api\/v1\/curriculum\/media\/stream[^\s`]*)/i);
        if (match && !videoUrl) videoUrl = match[1];
      } else if (!line.startsWith('---') && !line.includes('Interactive Hotspot Diagram') && !line.includes('Studio Video Lesson')) {
        textLines.push(line);
      }
    });

    const modeLabel = msg.mode === 'GENERAL_KNOWLEDGE' || msg.text.includes('General Knowledge') || msg.text.includes('General Educational Explanation')
      ? '🌐 General Knowledge'
      : msg.mode === 'NCERT_CROSS_SUBJECT'
      ? '📚 Cross-Subject Explanation'
      : '📖 NCERT Chapter Explanation';

    return (
      <div className="space-y-3">
        {/* Authoritative Mode Badge Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <span className={`text-[10px] font-black font-mono uppercase px-2.5 py-0.5 rounded-full border ${
            msg.mode === 'GENERAL_KNOWLEDGE' || msg.text.includes('General Knowledge') || msg.text.includes('General Educational Explanation')
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-teal-100 text-teal-900 border-teal-300'
          }`}>
            {modeLabel}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {msg.model || 'Gurukul AI Engine'}
          </span>
        </div>

        {/* Text Body */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900 font-medium">
          {textLines.join('\n').trim()}
        </div>

        {/* Interactive Media Cards */}
        {imageUrl && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-teal-700 flex items-center gap-1.5">
              🖼️ Interactive 16:9 Concept Diagram
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
              <img src={String(imageUrl).startsWith('http') ? String(imageUrl) : `http://127.0.0.1:8001${imageUrl}`} alt="Concept Diagram" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              📺 Studio Video Lesson
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200">
              <video controls controlsList="nodownload" className="w-full h-full object-contain" src={String(videoUrl).startsWith('http') ? String(videoUrl) : `http://127.0.0.1:8001${videoUrl}`} />
            </div>
          </div>
        )}

        {/* Message Action Toolbar (Copy, Read Aloud, Retry, Rating) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyText(msg.id, msg.text)}
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1 font-bold cursor-pointer"
              title="Copy Answer"
            >
              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => handleSpeechToggle(msg.id, msg.text)}
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1 font-bold cursor-pointer"
              title="Read Aloud"
            >
              {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{speakingId === msg.id ? 'Stop' : 'Read'}</span>
            </button>

            <button
              onClick={() => handleRetryMessage(msg)}
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1 font-bold cursor-pointer"
              title="Retry Question"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Retry</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleRating(msg.id, 'up')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${msg.rating === 'up' ? 'text-teal-700 bg-teal-100' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRating(msg.id, 'down')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${msg.rating === 'down' ? 'text-rose-700 bg-rose-100' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 bg-[#F5F6F8] min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-300 shadow-sm">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              Contextual AI Tutor
            </h1>
            <p className="text-xs text-slate-600 font-semibold">Grounded in official NCERT Class {selectedGrade} textbooks</p>
          </div>
        </div>

        {/* Chapter Context Selector */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs w-full sm:w-auto shadow-sm">
          <select
            value={selectedSubject}
            onChange={(e) => {
              const newSubj = e.target.value;
              setSelectedSubject(newSubj);
              const targetObj = subjectsList.find((s: any) =>
                s.canonical_subject?.toLowerCase() === newSubj.toLowerCase() ||
                s.subject?.toLowerCase() === newSubj.toLowerCase()
              );

              const chs: any[] = [];
              (targetObj?.books || []).forEach((b: any) => {
                (b.units || []).forEach((u: any) => {
                  (u.chapters || []).forEach((ch: any) => {
                    chs.push(ch);
                  });
                });
              });

              const defaultCh = chs.length > 0 ? chs[0].chapter_id : `G${selectedGrade}-${newSubj.slice(0, 3).toUpperCase()}-U01-C01`;
              setSelectedChapterId(defaultCh);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 uppercase font-black focus:outline-none cursor-pointer"
          >
            {(subjectsList.length > 0 ? subjectsList : [{ canonical_subject: 'english', subject: 'English' }, { canonical_subject: 'hindi', subject: 'Hindi' }, { canonical_subject: 'maths', subject: 'Mathematics' }, { canonical_subject: 'science', subject: 'Science' }]).map((s: any) => {
              const canonKey = s.canonical_subject || s.subject?.toLowerCase() || 'english';
              return (
                <option key={canonKey} value={canonKey}>
                  {s.subject || canonKey.toUpperCase()}
                </option>
              );
            })}
          </select>

          {availableChapters.length > 0 && (
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold focus:outline-none truncate max-w-[220px] cursor-pointer"
            >
              {availableChapters.map((ch: any) => (
                <option key={ch.chapter_id} value={ch.chapter_id}>
                  {ch.chapter_id}: {ch.chapter_title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Subject-Aware Presets (Section 5 Requirement: Current Chapter vs Explore Other Subjects) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-teal-600" /> Questions about {selectedSubject.toUpperCase()} ({activeChapterTitle}):</span>
          <span className="text-slate-500 font-mono">Class {selectedGrade} NCERT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSendQuery(`Explain the main idea and key concepts of ${activeChapterTitle}`, selectedSubject, selectedChapterId)}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-teal-400 transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-black text-teal-700 mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Main Idea
            </div>
            <p className="text-xs text-slate-800 font-semibold line-clamp-2">Explain the main idea of {activeChapterTitle}</p>
          </button>

          <button
            onClick={() => handleSendQuery(`Give me a real-world example explaining concepts from ${activeChapterTitle}`, selectedSubject, selectedChapterId)}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-teal-400 transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-black text-amber-700 mb-1">
              <Lightbulb className="w-3.5 h-3.5" /> Real-World Example
            </div>
            <p className="text-xs text-slate-800 font-semibold line-clamp-2">Give me an example from this chapter</p>
          </button>

          <button
            onClick={() => handleSendQuery("What is photosynthesis?", "science", "G5-SCI-U01-C01")}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left hover:border-indigo-400 transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 mb-1">
              <Globe className="w-3.5 h-3.5" /> Cross-Subject Science
            </div>
            <p className="text-xs text-slate-800 font-semibold line-clamp-2">Ask a Science question (e.g. What is photosynthesis?)</p>
          </button>
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 h-[520px] flex flex-col justify-between shadow-sm">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`w-full ${msg.sender === 'user' ? 'max-w-md' : 'max-w-[90%]'} p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-700 text-white font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-900 border border-slate-200'
                }`}
              >
                {renderChatMessage(msg)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 p-3 bg-teal-50 rounded-2xl border border-teal-200 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" /> Querying GURUKUL AI Tutor for {selectedSubject.toUpperCase()} ({selectedChapterId})...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={`Ask your Class ${selectedGrade} ${selectedSubject.toUpperCase()} AI Tutor a question...`}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm flex items-center gap-2 shadow-md hover:brightness-105 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
