'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Lightbulb, BookOpen, Send, Loader2 } from 'lucide-react';
import { sendHybridTutorChat } from '@/lib/webLlmClient';

interface SelectedTextTutorProps {
  grade?: string;
  subject?: string;
  book?: string;
  part?: string;
  unit?: string;
  chapter_id?: string;
}

export default function SelectedTextTutor({
  grade = '5',
  subject = 'english',
  book = 'english',
  part = 'main',
  unit = 'U01',
  chapter_id = 'G5-ENG-U01-C01'
}: SelectedTextTutorProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [activeAction, setActiveAction] = useState<string>('explain');

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!drawerOpen) {
          setPopupPos(null);
          setSelectedText('');
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3 || text.length > 500) {
        if (!drawerOpen) {
          setPopupPos(null);
          setSelectedText('');
        }
        return;
      }

      // Ensure selection is not inside an input or textarea
      const anchorNode = selection.anchorNode;
      if (anchorNode) {
        const parentElem = anchorNode.parentElement;
        if (parentElem && (parentElem.tagName === 'INPUT' || parentElem.tagName === 'TEXTAREA' || parentElem.isContentEditable)) {
          return;
        }
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        setSelectedText(text);
        setPopupPos({
          x: rect.left + rect.width / 2,
          y: Math.max(10, rect.top - 45)
        });
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, [drawerOpen]);

  const handleAskAi = async (action = 'explain') => {
    if (!selectedText) return;
    setActiveAction(action);
    setDrawerOpen(true);
    setPopupPos(null);
    setLoading(true);

    try {
      const actionPrompt = action === 'explain' ? `Explain this selected text simply for a Class ${grade} student:`
        : action === 'simpler' ? `Explain this in very simple, easy words:`
        : action === 'example' ? `Give a real-world everyday example illustrating this:`
        : `Explain the difficult vocabulary words in this text:`;

      const fullQuestion = `${actionPrompt} "${selectedText}"`;

      const response = await sendHybridTutorChat({
        grade,
        subject,
        book,
        part,
        unit,
        chapter_id,
        content_type: 'overview',
        question: fullQuestion,
        action
      });

      setExplanation(response.response);
    } catch (e) {
      setExplanation(`🤖 **NCERT Class ${grade} AI Tutor**: Selected Text: "${selectedText}". Review the lesson notes and flashcards for step-by-step guidance!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Popup Button Near Selection */}
      {popupPos && selectedText && !drawerOpen && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
          className="animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={() => handleAskAi('explain')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-xs shadow-2xl border border-teal-300/40 hover:scale-105 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ask AI</span>
          </button>
        </div>
      )}

      {/* Selected-Text Contextual Explanation Drawer */}
      {drawerOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-white text-sm">Selected-Text AI Explanation</h3>
            </div>
            <button
              onClick={() => {
                setDrawerOpen(false);
                setSelectedText('');
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Text Quote */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic border-l-4 border-l-teal-400">
            &ldquo;{selectedText}&rdquo;
          </div>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => handleAskAi('explain')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${activeAction === 'explain' ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
            >
              💡 Explain Simply
            </button>
            <button
              onClick={() => handleAskAi('example')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${activeAction === 'example' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
            >
              🎨 Give Example
            </button>
            <button
              onClick={() => handleAskAi('words')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${activeAction === 'words' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
            >
              📚 Difficult Words
            </button>
          </div>

          {/* AI Response Output */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-teal-400 py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing selected text for Class {grade}...
              </div>
            ) : (
              explanation
            )}
          </div>
        </div>
      )}
    </>
  );
}
