import React, { useState } from 'react';

interface QuizProps {
  quiz: any[];
}

export default function QuizComponent({ quiz }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [textInputs, setTextInput] = useState<Record<number, string>>({});
  const [submittedText, setSubmittedText] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  let rawList = quiz;
  if (quiz && !Array.isArray(quiz) && typeof quiz === 'object') {
    if (Array.isArray((quiz as any).questions)) {
      rawList = (quiz as any).questions;
    } else if (Array.isArray((quiz as any).quiz)) {
      rawList = (quiz as any).quiz;
    } else if (Array.isArray((quiz as any).quizzes)) {
      rawList = (quiz as any).quizzes;
    } else {
      const foundArrayProp = Object.values(quiz).find(val => Array.isArray(val));
      if (foundArrayProp) {
        rawList = foundArrayProp;
      } else {
        rawList = Object.values(quiz);
      }
    }
  }

  // Flatten any nested question arrays or unwrap wrapper objects
  let quizList: any[] = [];
  if (Array.isArray(rawList)) {
    rawList.forEach((item: any) => {
      if (!item) return;
      if (Array.isArray(item.questions)) {
        quizList.push(...item.questions);
      } else if (Array.isArray(item.quiz)) {
        quizList.push(...item.quiz);
      } else if (item.question || item.question_text || item.prompt || item.statement || item.q) {
        quizList.push(item);
      } else if (typeof item === 'object' && !item.quiz_title && !item.chapter_title) {
        if (item.options || item.correct_answer || item.answer) {
          quizList.push(item);
        }
      }
    });
  }

  if (quizList.length === 0 && Array.isArray(rawList)) {
    quizList = rawList.filter((item: any) => item && (item.question || item.question_text || item.prompt));
  }

  // Dynamically shuffle options for each question on initialization (User Request)
  const [shuffledOptionsMap] = useState<Record<number, string[]>>(() => {
    const newMap: Record<number, string[]> = {};
    quizList.forEach((q: any, idx: number) => {
      let optionsArr: string[] = [];
      if (Array.isArray(q.options)) {
        optionsArr = [...q.options];
      } else if (q.options && typeof q.options === 'object') {
        optionsArr = Object.entries(q.options).map(([k, v]) => `${k}) ${v}`);
      }

      const shuffled = [...optionsArr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      newMap[idx] = shuffled;
    });
    return newMap;
  });

  if (!Array.isArray(quizList) || quizList.length === 0) {
    return <div className="p-8 text-center text-slate-500">No quiz items available.</div>;
  }

  const handleSelectOption = (qIdx: number, opt: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleTextChange = (qIdx: number, val: string) => {
    setTextInput(prev => ({ ...prev, [qIdx]: val }));
  };

  const handleSubmitText = (qIdx: number) => {
    setSubmittedText(prev => ({ ...prev, [qIdx]: true }));
  };

  const toggleExplanation = (qIdx: number) => {
    setShowExplanation(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  return (
    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Master Quiz Assessment ({quizList.length} Questions)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Test your comprehension, vocabulary, and subject knowledge.</p>
        </div>
      </div>

      <div className="space-y-6">
        {quizList.map((q: any, idx: number) => {
          if (!q || typeof q !== 'object') return null;
          const qText = q.question || q.question_text || q.prompt || q.statement || q.q || q.text || '';
          if (!qText) return null;

          const rawCorrect = q.correct_option || q.correct_answer || q.answer || q.correct || '';
          const qType = q.type || q.question_type || 'Assessment';

          let optionsArr: string[] = shuffledOptionsMap[idx] || [];
          if (optionsArr.length === 0) {
            if (Array.isArray(q.options)) {
              optionsArr = q.options;
            } else if (q.options && typeof q.options === 'object') {
              optionsArr = Object.entries(q.options).map(([k, v]) => `${k}) ${v}`);
            }
          }

          optionsArr = optionsArr.filter(opt => {
            const s = String(opt).trim();
            return s && !s.startsWith('Option ') && s.toLowerCase() !== 'option b' && s.toLowerCase() !== 'option c' && s.toLowerCase() !== 'option d';
          });

          let correctAnswer = rawCorrect;
          if (rawCorrect && Array.isArray(q.options)) {
            const matchedOpt = q.options.find((opt: string) => opt.startsWith(`${rawCorrect})`) || opt.startsWith(`${rawCorrect}:`) || opt === rawCorrect);
            if (matchedOpt) correctAnswer = matchedOpt;
          }

          const explanation = q.explanation || q.detailed_explanation || '';
          const userAnswer = selectedAnswers[idx];
          const textVal = textInputs[idx] || '';
          const isSubmitted = submittedText[idx];
          const isAnswered = userAnswer !== undefined || isSubmitted;
          const isExpanded = showExplanation[idx];

          const isCorrectOption = (opt: string) => {
            if (opt === correctAnswer || opt.startsWith(`${rawCorrect})`) || opt === String(rawCorrect)) return true;
            if (rawCorrect && typeof opt === 'string' && opt.toLowerCase().includes(String(rawCorrect).toLowerCase())) {
              return opt.trim().toLowerCase() === String(rawCorrect).trim().toLowerCase();
            }
            return false;
          };

          return (
            <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  Question #{idx + 1} • {qType} {q.category || q.qid || q.quiz_id ? `• ${q.category || q.qid || q.quiz_id}` : ''}
                </span>
                {(q.difficulty_level || q.difficulty || q.blooms_level) && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800">
                    {q.difficulty_level || q.difficulty || q.blooms_level}
                  </span>
                )}
              </div>

              <div className="text-base font-bold text-slate-900 leading-snug">
                {qText}
              </div>

              {/* Shuffled Options */}
              {optionsArr.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {optionsArr.map((opt: string, oIdx: number) => {
                    const isCorrect = isCorrectOption(opt);
                    let btnStyle = "bg-white border-slate-200 text-slate-700 hover:border-indigo-400";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold";
                      } else if (opt === userAnswer) {
                        btnStyle = "bg-rose-50 border-rose-300 text-rose-900 font-bold";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(idx, opt)}
                        className={`p-4 rounded-2xl text-xs sm:text-sm text-left border transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrect && <span className="text-emerald-600 font-black">✓</span>}
                        {isAnswered && opt === userAnswer && !isCorrect && <span className="text-rose-600 font-black">✗</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={textVal}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    />
                    <button
                      onClick={() => handleSubmitText(idx)}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-md transition-all"
                    >
                      Check Answer
                    </button>
                  </div>

                  {rawCorrect && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExplanation(idx)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {isExpanded ? 'Hide Answer & Explanation ▴' : 'Show Answer & Explanation ▾'}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1 animate-in fade-in duration-200">
                          <div><strong>Correct Answer:</strong> {String(rawCorrect)}</div>
                          {explanation && <div className="text-slate-700 italic"><em>Explanation:</em> {explanation}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
