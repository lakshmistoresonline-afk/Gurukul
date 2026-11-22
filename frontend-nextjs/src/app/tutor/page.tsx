'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2, Copy, Volume2, VolumeX, RotateCcw, ThumbsUp, ThumbsDown, Check, Globe, GraduationCap, Calculator, Mic, MicOff, ShieldCheck } from 'lucide-react';
import { getCurriculumHierarchy } from '../../lib/curriculumClient';
import { sendHybridTutorChat } from '../../lib/webLlmClient';
import { getStudentProgress, syncStudentProgressFromFirestore, getAuthoritativeClassForUser } from '../../lib/studentProgressStore';

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
  const [engineMode, setEngineMode] = useState<'NCERT' | 'WORLD'>('NCERT');

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setQuestion(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error('Voice recognition error:', e);
      setIsListening(false);
    }
  };

  // Separate, Isolated Chat Histories for NCERT Tutor and Universal World AI Modes
  const [ncertChatHistory, setNcertChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome-ncert',
      sender: 'ai',
      text: "🤖 Welcome to Gurukul AI Universal Tutor! Ask any question in the world — Science, Math, Python & Coding, World History, or Textbook Lessons!",
      question: '',
      grade: '6',
      subject: 'english',
      book: 'english',
      part: 'main',
      unit: 'U01',
      chapter_id: 'G6-ENG-U01-C01',
      mode: 'WORLD_KNOWLEDGE',
      model: 'Gurukul AI Engine'
    }
  ]);

  const [worldChatHistory, setWorldChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome-world',
      sender: 'ai',
      text: "🤖 Welcome to Universal World AI Engine! Ask any question in the world — Space Science, Python & Coding, World History, or Step-by-Step Math!",
      question: '',
      grade: '6',
      subject: 'general',
      book: 'world',
      part: 'main',
      unit: 'U01',
      chapter_id: 'WORLD-AI',
      mode: 'WORLD_KNOWLEDGE',
      model: 'Universal World AI Engine'
    }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load hierarchy in tutor page:', e);
      }
    }
    loadData();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const targetUid = user ? user.uid : 'guest';
      const synced = await syncStudentProgressFromFirestore(targetUid);
      const authGrade = synced.selectedGrade || getAuthoritativeClassForUser(user, targetUid);
      setSelectedGrade(authGrade);
      setSelectedChapterId(`G${authGrade}-ENG-U01-C01`);
    });

    const handleGradeChanged = () => {
      const authUser = auth.currentUser;
      const targetUid = authUser ? authUser.uid : 'guest';
      const prog = getStudentProgress(targetUid);
      const authGrade = prog.selectedGrade || getAuthoritativeClassForUser(authUser, targetUid);
      setSelectedGrade(authGrade);
      setSelectedChapterId(`G${authGrade}-ENG-U01-C01`);
    };

    window.addEventListener('gradeChanged', handleGradeChanged);
    return () => {
      unsubscribe();
      window.removeEventListener('gradeChanged', handleGradeChanged);
    };
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

  const activeSubj = selectedSubject.toLowerCase();
  let activeBook = '';
  let activePart = '';
  let activeUnit = '';
  let activeChId = selectedChapterId;
  let activeChapterTitle = selectedChapterId;

  if (currentSubjectObj && Array.isArray(currentSubjectObj.books)) {
    for (const b of currentSubjectObj.books) {
      const bookId = b.book_id || b.book;
      const bookPart = b.part || 'main';
      for (const u of (b.units || [])) {
        const unitId = u.unit_id || u.unit || 'U01';
        const foundCh = (u.chapters || []).find((c: any) => c.chapter_id === selectedChapterId);
        if (foundCh) {
          activeBook = bookId;
          activePart = bookPart;
          activeUnit = unitId;
          activeChapterTitle = foundCh.chapter_title || foundCh.chapter_id;
          break;
        }
      }
      if (activeBook) break;
    }

    if (!activeBook && currentSubjectObj.books.length > 0) {
      const firstB = currentSubjectObj.books[0];
      activeBook = firstB.book_id || firstB.book || activeSubj;
      activePart = firstB.part || 'main';
      if (firstB.units && firstB.units.length > 0) {
        const firstU = firstB.units[0];
        activeUnit = firstU.unit_id || firstU.unit || 'U01';
        if (firstU.chapters && firstU.chapters.length > 0) {
          if (!activeChId) activeChId = firstU.chapters[0].chapter_id;
          if (activeChapterTitle === selectedChapterId) activeChapterTitle = firstU.chapters[0].chapter_title || firstU.chapters[0].chapter_id;
        }
      }
    }
  }

  const activeChatHistory = engineMode === 'NCERT' ? ncertChatHistory : worldChatHistory;

  const handleSendQuery = async (customQuestion?: string, targetSubject?: string, targetChapter?: string) => {
    const rawQuery = (customQuestion || question).trim();
    const queryText = rawQuery.replace(/^RETRY_/, '');
    if (!queryText || loading) return;

    const reqSubj = (targetSubject || selectedSubject).toLowerCase();
    let reqChId = targetChapter || selectedChapterId || activeChId;

    let reqBook = activeBook;
    let reqPart = activePart;
    let reqUnit = activeUnit;

    const targetSubjObj = subjectsList.find((s: any) =>
      s.canonical_subject?.toLowerCase() === reqSubj ||
      s.subject?.toLowerCase() === reqSubj
    );

    if (targetSubjObj && Array.isArray(targetSubjObj.books)) {
      for (const b of targetSubjObj.books) {
        const bookId = b.book_id || b.book;
        const bookPart = b.part || 'main';
        for (const u of (b.units || [])) {
          const unitId = u.unit_id || u.unit || 'U01';
          const foundCh = (u.chapters || []).find((c: any) => c.chapter_id === reqChId);
          if (foundCh) {
            reqBook = bookId;
            reqPart = bookPart;
            reqUnit = unitId;
            break;
          }
        }
        if (reqBook && reqBook !== activeBook) break;
      }
    }

    if (!reqBook) reqBook = reqSubj;
    if (!reqPart) reqPart = 'main';
    if (!reqUnit) reqUnit = 'U01';
    if (!reqChId) reqChId = `G${selectedGrade}-${reqSubj.substring(0, 3).toUpperCase()}-U01-C01`;

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
      subject: reqSubj,
      book: reqBook,
      part: reqPart,
      unit: reqUnit,
      chapter_id: reqChId
    };

    if (engineMode === 'NCERT') {
      setNcertChatHistory(prev => [...prev, userMsg]);
    } else {
      setWorldChatHistory(prev => [...prev, userMsg]);
    }

    try {
      const response = await sendHybridTutorChat({
        grade: selectedGrade,
        subject: reqSubj,
        book: reqBook,
        part: reqPart,
        unit: reqUnit,
        chapter_id: reqChId,
        content_type: 'overview',
        question: queryText,
        engineMode: engineMode
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
        mode: response.mode || (engineMode === 'WORLD' ? 'WORLD_KNOWLEDGE' : 'NCERT_CHAPTER'),
        model: response.model || 'GURUKUL AI Engine',
        status: response.status,
        media: response.media
      };

      if (engineMode === 'NCERT') {
        setNcertChatHistory(prev => [...prev, aiMsg]);
      } else {
        setWorldChatHistory(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const isOllamaDown = (err?.message || '').includes('404') || (err?.message || '').includes('starting') || (err?.message || '').includes('unavailable');

      if (isOllamaDown && !rawQuery.startsWith('RETRY_')) {
        const tempMsgId = `temp-${Date.now()}`;
        const tempMsg: ChatMessage = {
          id: tempMsgId,
          sender: 'ai',
          text: `🤖 **GURUKUL AI Engine Notice**: Local Ollama AI service is initializing in the background. Auto-retrying your question in 3 seconds...`,
          question: queryText,
          grade: selectedGrade,
          subject: activeSubj,
          book: activeBook,
          part: activePart,
          unit: activeUnit,
          chapter_id: activeChId,
          mode: 'GENERAL_KNOWLEDGE',
          model: 'GURUKUL AI Engine',
          status: 'OFFLINE'
        };

        if (engineMode === 'NCERT') setNcertChatHistory(prev => [...prev, tempMsg]);
        else setWorldChatHistory(prev => [...prev, tempMsg]);

        setTimeout(() => {
          handleSendQuery(`RETRY_${queryText}`, targetSubject, targetChapter);
        }, 3500);
        setLoading(false);
        return;
      }

      const errorMsgId = `err-${Date.now()}`;
      const errMessage: ChatMessage = {
        id: errorMsgId,
        sender: 'ai',
        text: isOllamaDown
          ? `🤖 **GURUKUL AI Engine Notice**: Local Ollama AI service is currently starting in the background. Please wait a few seconds while Ollama initializes, or launch 'ollama serve' on your machine.`
          : `🤖 **GURUKUL AI Engine**: ${err.message || "Local AI Tutor service is unavailable."}`,
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
      };

      if (engineMode === 'NCERT') {
        setNcertChatHistory(prev => [...prev, errMessage]);
      } else {
        setWorldChatHistory(prev => [...prev, errMessage]);
      }
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
    if (engineMode === 'NCERT') {
      setNcertChatHistory(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
    } else {
      setWorldChatHistory(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
    }
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

    const modeLabel = msg.mode === 'MATH_EVALUATOR'
      ? '📐 Step-by-Step Math Solution'
      : '🤖 GURUKUL AI RESPONSE';

    return (
      <div className="space-y-3">
        {/* Authoritative Mode Badge Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <span className={`text-[10px] font-black font-mono uppercase px-2.5 py-0.5 rounded-full border ${
            msg.mode === 'MATH_EVALUATOR'
              ? 'bg-purple-100 text-purple-900 border-purple-300'
              : msg.mode === 'WORLD_KNOWLEDGE' || msg.text.includes('Universal World')
              ? 'bg-sky-100 text-sky-900 border-sky-300'
              : msg.mode === 'GENERAL_KNOWLEDGE' || msg.text.includes('General Knowledge')
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
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
              <Image src={String(imageUrl).startsWith('http') ? String(imageUrl) : `http://127.0.0.1:8001${imageUrl}`} alt="Concept Diagram" fill className="object-contain" unoptimized />
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

        {/* Message Action Toolbar */}
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F6F8] min-h-screen">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-300 shadow-sm overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/ai_tutor.svg" alt="AI Tutor Illustration" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              Gurukul AI Universal Tutor
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              Ask any question across NCERT Class {selectedGrade} textbooks, step-by-step math, science, coding, or world knowledge!
            </p>
          </div>
        </div>
      </div>



      {/* Chat Conversation Box - Full Page Natural Scroll & Expanded Screen Width */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 min-h-[500px] flex flex-col justify-between shadow-sm space-y-6">
        <div className="space-y-4">
          {activeChatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`w-full ${msg.sender === 'user' ? 'max-w-lg' : 'w-full'} p-5 rounded-2xl text-sm leading-relaxed ${
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
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800 p-3 bg-teal-50 rounded-2xl border border-teal-200 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Gurukul AI Engine is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 sticky bottom-4 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-200/80 z-10">
          <button
            onClick={handleVoiceInput}
            type="button"
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={isListening ? 'Listening... Speak your question' : 'Voice Input (Click & Speak)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={isListening ? 'Listening to your voice...' : engineMode === 'WORLD' ? 'Ask the Universal World AI Engine any question in the world...' : `Ask your Class ${selectedGrade} ${selectedSubject.toUpperCase()} AI Tutor a question...`}
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
