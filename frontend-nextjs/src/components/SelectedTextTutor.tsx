'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Lightbulb, BookOpen, Send, Loader2, Volume2, RotateCcw, AlertTriangle } from 'lucide-react';
import { sendHybridTutorChat } from '@/lib/webLlmClient';

interface SelectedTextTutorProps {
  grade?: string;
  subject?: string;
  book?: string;
  part?: string;
  unit?: string;
  chapter_id?: string;
  content_type?: string;
}

export default function SelectedTextTutor({
  grade,
  subject,
  book,
  part,
  unit,
  chapter_id
}: SelectedTextTutorProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [activeAction, setActiveAction] = useState<string>('explain');
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const popupRef = useRef<HTMLDivElement>(null);

  // Do not activate Ask AI popup if required context is missing
  const hasValidContext = !!(grade && subject && chapter_id);

  useEffect(() => {
    if (!hasValidContext) return;

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

      // Ensure selection is inside educational content and NOT inside input, textarea, button, or nav
      const anchorNode = selection.anchorNode;
      if (anchorNode) {
        const parentElem = anchorNode.parentElement;
        if (parentElem) {
          const closestExcluded = parentElem.closest('input, textarea, button, nav, form, [contenteditable="true"]');
          if (closestExcluded) return;
        }
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        setSelectedText(text);
        setPopupPos({
          x: Math.min(window.innerWidth - 60, Math.max(60, rect.left + rect.width / 2)),
          y: Math.max(10, rect.top - 45)
        });
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [drawerOpen, hasValidContext]);

  const handleAskAi = async (action = 'explain') => {
    if (!selectedText || !hasValidContext) return;
    setActiveAction(action);
    setDrawerOpen(true);
    setPopupPos(null);
    setLoading(true);
    setErrorState(null);

    try {
      const actionPrompt = action === 'explain' ? `Explain this selected text simply for a Class ${grade} student:`
        : action === 'simpler' ? `Explain this in very simple, easy words:`
        : action === 'example' ? `Give a real-world everyday example illustrating this:`
        : `Explain the difficult vocabulary words in this text:`;

      const fullQuestion = `${actionPrompt} "${selectedText}"`;

      const response = await sendHybridTutorChat({
        grade: grade || '5',
        subject: subject || 'english',
        book: book || subject || 'english',
        part: part || 'main',
        unit: unit || 'U01',
        chapter_id: chapter_id || 'G5-ENG-U01-C01',
        content_type: 'overview',
        question: fullQuestion,
        action
      });

      if (response && response.response) {
        setExplanation(response.response);
      } else {
        setErrorState('AI Tutor service did not return an explanation.');
      }
    } catch (e: any) {
      setErrorState(e.message || 'AI Tutor network request timed out.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window) || !explanation) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(explanation.replace(/[*#_`]/g, ''));
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (!hasValidContext) return null;

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
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
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
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            </div>

            {explanation && (
              <button
                onClick={handleSpeech}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-bold flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" /> {isSpeaking ? 'Stop' : 'Read'}
              </button>
            )}
          </div>

          {/* AI Response Output */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
            {loading && (
              <div className="flex items-center gap-2 text-teal-400 py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing selected text for Class {grade}...
              </div>
            )}

            {errorState && !loading && (
              <div className="space-y-2 text-rose-300">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" /> AI Explanation Error
                </div>
                <p>{errorState}</p>
                <button
                  onClick={() => handleAskAi(activeAction)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-[11px] flex items-center gap-1 mt-2"
                >
                  <RotateCcw className="w-3 h-3" /> Retry Analysis
                </button>
              </div>
            )}

            {!loading && !errorState && explanation && (
              explanation
            )}
          </div>
        </div>
      )}
    </>
  );
}
