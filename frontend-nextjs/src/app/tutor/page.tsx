'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, Loader2 } from 'lucide-react';
import { getCurriculumHierarchy } from '../../lib/curriculumClient';
import { sendHybridTutorChat } from '../../lib/webLlmClient';

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

    setChatHistory(prev => [...prev, { sender: 'user', text: queryText }]);

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

      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: response.response, status: response.status }
      ]);
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: `🤖 **NCERT Class 5 AI Tutor**: Regarding '${queryText}', please review Chapter ${activeChId} notes and flashcards for step-by-step guidance!`, status: 'ONLINE' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderChatMessage = (text: string, sender: 'user' | 'ai') => {
    if (!text) return null;
    if (sender === 'user') return text;

    const lines = text.split('\n');
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

    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap">{textLines.join('\n').trim()}</div>

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
      </div>
    );
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
            <p className="text-xs text-slate-400">Grounded in official NCERT Class 5 textbooks &amp; WebLLM AI Engine</p>
          </div>
        </div>

        {/* Chapter Context Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
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
                    : 'bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                {renderChatMessage(msg.text, msg.sender)}
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
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
