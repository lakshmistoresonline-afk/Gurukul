'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export default function AiTutorPage() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "Hello! I am your GURUKUL AI Class 5 NCERT Tutor. Ask me any question about your English, Hindi, Mathematics, or Science chapters!"
    }
  ]);

  const handleSend = () => {
    if (!question.trim()) return;
    const userMsg = question.trim();
    setChatHistory(prev => [
      ...prev,
      { sender: 'user', text: userMsg },
      { sender: 'ai', text: `🤖 Based on Class 5 NCERT curriculum: Here is a detailed breakdown for "${userMsg}". Practice concepts daily to master your lessons!` }
    ]);
    setQuestion('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            Contextual AI Tutor
          </h1>
          <p className="text-xs text-slate-400">Grounded in official NCERT Class 5 textbooks &amp; learning objectives</p>
        </div>
      </div>

      {/* Quick Prompt Cards */}
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

      {/* Chat Area */}
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
                {msg.text}
              </div>
            </div>
          ))}
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
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
