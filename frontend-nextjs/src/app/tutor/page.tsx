'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2, Copy, Volume2, VolumeX, RotateCcw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { getCurriculumHierarchy } from '../../lib/curriculumClient';
import { sendHybridTutorChat } from '../../lib/webLlmClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mode?: string;
  model?: string;
  status?: string;
  rating?: 'up' | 'down' | null;
}

export default function AiTutorPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
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
      text: "🤖 Welcome! I am your GURUKUL AI Contextual NCERT Tutor. Ask me any question about your lessons or general educational topics!",
      mode: 'NCERT_CHAPTER',
      model: 'NCERT Class 5 Grounded Engine'
    }
  ]);

  useEffect(() => {
    async function loadHierarchyData() {
      try {
        const data = await getCurriculumHierarchy();
        setHierarchy(data || []);
      } catch (e) {
        console.error('Failed to load hierarchy in tutor page:', e);
      }
    }
    loadHierarchyData();
  }, []);

  const class5Data = hierarchy.find((item: any) => String(item.grade) === '5');
  const subjectsList = class5Data?.subjects || [];
  const currentSubjectObj = subjectsList.find((s: any) =>
    s.canonical_subject?.toLowerCase() === selectedSubject.toLowerCase() ||
    s.subject?.toLowerCase() === selectedSubject.toLowerCase()
  );
  const availableChapters = currentSubjectObj?.books?.[0]?.units?.[0]?.chapters || [];

  const handleSendQuery = async (customQuestion?: string, targetSubject?: string, targetChapter?: string) => {
    const queryText = (customQuestion || question).trim();
    if (!queryText || loading) return;

    const activeSubj = targetSubject || selectedSubject;
    const activeChId = targetChapter || selectedChapterId || `G5-${activeSubj.slice(0,3).toUpperCase()}-U01-C01`;

    if (targetSubject && targetSubject !== selectedSubject) {
      setSelectedSubject(targetSubject);
    }
    if (targetChapter && targetChapter !== selectedChapterId) {
      setSelectedChapterId(targetChapter);
    }

    setQuestion('');
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    setChatHistory(prev => [...prev, { id: userMsgId, sender: 'user', text: queryText }]);

    try {
      const response = await sendHybridTutorChat({
        grade: '5',
        subject: activeSubj,
        book: currentSubjectObj?.books?.[0]?.book_id || activeSubj,
        part: currentSubjectObj?.books?.[0]?.part || 'main',
        unit: 'U01',
        chapter_id: activeChId,
        content_type: 'overview',
        question: queryText
      });

      const aiMsgId = `ai-${Date.now()}`;
      setChatHistory(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: response.response,
          mode: response.mode || (response.response.includes('General Knowledge') ? 'GENERAL_KNOWLEDGE' : 'NCERT_CHAPTER'),
          model: response.model || 'GURUKUL AI Engine',
          status: response.status
        }
      ]);
    } catch (err: any) {
      const errorMsgId = `err-${Date.now()}`;
      setChatHistory(prev => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'ai',
          text: `🤖 **NCERT Class 5 AI Tutor**: Regarding '${queryText}', please review Chapter ${activeChId} notes and flashcards for step-by-step guidance!`,
          mode: 'NCERT_CHAPTER',
          model: 'GURUKUL AI Fallback Engine',
          status: 'ONLINE'
        }
      ]);
    } finally {
      setLoading(false);
    }
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
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    lines.forEach(line => {
      if (line.includes('api/v1/curriculum/media/stream') && (line.includes('.png') || line.includes('.jpg'))) {
        const match = line.match(/`?(https?:\/\/[^\s`]+(?:\.png|\.jpg)[^\s`]*)`?/i) || line.match(/(https?:\/\/[^\s`]+)/i);
        if (match) imageUrl = match[1];
      } else if (line.includes('api/v1/curriculum/media/stream') && line.includes('.mp4')) {
        const match = line.match(/`?(https?:\/\/[^\s`]+(?:\.mp4)[^\s`]*)`?/i) || line.match(/(https?:\/\/[^\s`]+)/i);
        if (match) videoUrl = match[1];
      } else if (!line.startsWith('---') && !line.includes('Interactive Hotspot Diagram') && !line.includes('Studio Video Lesson')) {
        textLines.push(line);
      }
    });

    const isGeneral = msg.mode === 'GENERAL_KNOWLEDGE' || msg.text.includes('General Knowledge');

    return (
      <div className="space-y-3">
        {/* Mode Badge Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <span className={`text-[10px] font-extrabold font-mono uppercase px-2.5 py-0.5 rounded-full border ${
            isGeneral
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
          }`}>
            {isGeneral ? '🌐 General Knowledge' : '📖 NCERT Chapter Explanation'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {msg.model || 'Gurukul AI Engine'}
          </span>
        </div>

        {/* Text Body */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {textLines.join('\n').trim()}
        </div>

        {/* Interactive Media Cards */}
        {imageUrl && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
              🖼️ Interactive 16:9 Concept Diagram
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img src={imageUrl} alt="Concept Diagram" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              📺 Studio Video Lesson
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
              <video controls controlsList="nodownload" className="w-full h-full object-contain" src={videoUrl} />
            </div>
          </div>
        )}

        {/* Message Action Toolbar (Copy, Read Aloud, Regenerate, Rating) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyText(msg.id, msg.text)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1"
              title="Copy Answer"
            >
              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => handleSpeechToggle(msg.id, msg.text)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1"
              title="Read Aloud"
            >
              {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{speakingId === msg.id ? 'Stop' : 'Read'}</span>
            </button>

            <button
              onClick={() => handleSendQuery(question || 'Explain this again simply', selectedSubject, selectedChapterId)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1"
              title="Regenerate Answer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleRating(msg.id, 'up')}
              className={`p-1.5 rounded-lg transition-all ${msg.rating === 'up' ? 'text-teal-400 bg-teal-500/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRating(msg.id, 'down')}
              className={`p-1.5 rounded-lg transition-all ${msg.rating === 'down' ? 'text-rose-400 bg-rose-500/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              Contextual AI Tutor
            </h1>
            <p className="text-xs text-slate-400">Grounded in official NCERT Class 5 textbooks &amp; WebLLM AI Engine</p>
          </div>
        </div>

        {/* Chapter Context Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs w-full sm:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => {
              const newSubj = e.target.value;
              setSelectedSubject(newSubj);
              const defaultCh = `G5-${newSubj.slice(0, 3).toUpperCase()}-U01-C01`;
              setSelectedChapterId(defaultCh);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white uppercase font-bold focus:outline-none"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="maths">Maths</option>
            <option value="science">Science</option>
          </select>

          {availableChapters.length > 0 && (
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none truncate max-w-[220px]"
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

      {/* Prompt Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleSendQuery("Explain the Water Cycle in simple terms for Class 5 Science", "science", "G5-SCI-U01-C01")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Science Inquiry
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">Explain the Water Cycle in simple terms for Class 5 Science</p>
        </button>

        <button
          onClick={() => handleSendQuery("How do I solve fraction strip addition in Class 5 Maths?", "maths", "G5-MAT-U01-C01")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" /> Maths Helper
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">How do I solve fraction strip addition in Class 5 Maths?</p>
        </button>

        <button
          onClick={() => handleSendQuery("Give me an example of adjectives from Papa's Spectacles", "english", "G5-ENG-U01-C01")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Lightbulb className="w-3.5 h-3.5" /> English Grammar
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">Give me an example of adjectives from Papa&apos;s Spectacles</p>
        </button>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 h-[520px] flex flex-col justify-between shadow-xl">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`w-full ${msg.sender === 'user' ? 'max-w-md' : 'max-w-[88%]'} p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-medium shadow-md'
                    : 'bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                {renderChatMessage(msg)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-400 p-3 bg-slate-950/60 rounded-xl border border-slate-800 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" /> Querying GURUKUL AI Tutor for {selectedSubject.toUpperCase()} ({selectedChapterId})...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={`Ask your Class 5 ${selectedSubject.toUpperCase()} AI Tutor a question...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" /> <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
