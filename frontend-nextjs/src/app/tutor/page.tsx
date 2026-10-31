'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { sendTutorChat, getCurriculumHierarchy } from '../../lib/curriculumClient';

export default function AiTutorPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('G5-ENG-U01-C01');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; status?: string }>>([
    {
      sender: 'ai',
      text: "🤖 Welcome! I am your GURUKUL AI Contextual NCERT Tutor. Select a subject and chapter to ask grounded questions."
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

  const handleSend = async () => {
    if (!question.trim() || loading) return;
    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);

    setChatHistory(prev => [...prev, { sender: 'user', text: userQuestion }]);

    const response = await sendTutorChat({
      grade: '5',
      subject: selectedSubject,
      book: currentSubjectObj?.books?.[0]?.book_id || selectedSubject,
      part: currentSubjectObj?.books?.[0]?.part || 'main',
      unit: 'U01',
      chapter_id: selectedChapterId || `G5-${selectedSubject.slice(0,3).toUpperCase()}-U01-C01`,
      content_type: 'overview',
      question: userQuestion
    });

    setChatHistory(prev => [
      ...prev,
      { sender: 'ai', text: response.response, status: response.status }
    ]);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
            <p className="text-xs text-slate-400">Grounded in official NCERT Class 5 textbooks &amp; Ollama backend engine</p>
          </div>
        </div>

        {/* Chapter Context Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedChapterId('');
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
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none"
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
          onClick={() => setQuestion("Explain the Water Cycle in simple terms for Class 5 Science")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Science Inquiry
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">Explain the Water Cycle in simple terms for Class 5 Science</p>
        </button>

        <button
          onClick={() => setQuestion("How do I solve fraction strip addition in Class 5 Maths?")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" /> Maths Helper
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">How do I solve fraction strip addition in Class 5 Maths?</p>
        </button>

        <button
          onClick={() => setQuestion("Give me an example of adjectives from Papa's Spectacles")}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Lightbulb className="w-3.5 h-3.5" /> English Grammar
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">Give me an example of adjectives from Papa&apos;s Spectacles</p>
        </button>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[480px] flex flex-col justify-between shadow-xl">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-medium shadow-md'
                    : msg.status === 'OFFLINE'
                    ? 'bg-amber-950/80 border border-amber-800 text-amber-200'
                    : 'bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-400 p-3 bg-slate-950/60 rounded-xl border border-slate-800 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" /> Querying local Ollama engine for {selectedChapterId}...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your Class 5 AI Tutor a question..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
