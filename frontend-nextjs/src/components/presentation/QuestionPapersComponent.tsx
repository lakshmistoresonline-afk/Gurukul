import React, { useState } from 'react';

interface QuestionPapersProps {
  data: any;
}

function cleanQuestionText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^Q\d+\.\s*/i, '')
    .replace(/^Question\s*\d*[\.:-]?\s*/i, '')
    .trim();
}

function getQuestionCategory(q: any, sectionName: string = ''): string {
  const typeStr = (q.type || q.question_type || sectionName || '').toLowerCase();
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  if (hasOptions || typeStr.includes('mcq') || typeStr.includes('multiple choice')) {
    return 'MCQ';
  } else if (typeStr.includes('short') || typeStr.includes('vsa') || typeStr.includes('very short')) {
    return 'Short Answer';
  } else if (typeStr.includes('long') || typeStr.includes('detail') || typeStr.includes('descriptive')) {
    return 'Long Answer';
  } else if (typeStr.includes('fill') || typeStr.includes('blank')) {
    return 'Fill in Blanks';
  } else if (typeStr.includes('true') || typeStr.includes('false')) {
    return 'True/False';
  }
  return 'Assessment';
}

function shuffleOptions(options: string[]) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuestionPapersComponent({ data }: QuestionPapersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  // Dynamically shuffle options on component mount to prevent answer always being the first option
  const [shuffledMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    if (!data) return map;
    const papers = data.question_papers || data.papers || [data];
    papers.forEach((paper: any, pIdx: number) => {
      const sections = paper?.sections || paper?.question_banks || [paper];
      if (Array.isArray(sections)) {
        sections.forEach((sec: any, sIdx: number) => {
          const questions = sec?.questions || [];
          if (Array.isArray(questions)) {
            questions.forEach((q: any, qIdx: number) => {
              if (Array.isArray(q.options) && q.options.length > 0) {
                map[`${pIdx}-${sIdx}-${qIdx}`] = shuffleOptions(q.options);
              }
            });
          }
        });
      }
    });
    return map;
  });

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No question papers are available for this chapter yet.</div>;
  }

  const rawPapers = data.question_papers || data.papers || (Array.isArray(data.chapters) ? data.chapters[0]?.question_papers : null) || (Array.isArray(data) ? data : [data]);
  const papers = Array.isArray(rawPapers) ? rawPapers : [rawPapers];
  const activePaperIdx = 0;
  const currentPaper = papers[activePaperIdx] || {};
  const sections = currentPaper.sections || currentPaper.question_banks || (Array.isArray(data.sections) ? data.sections : [currentPaper]);

  // Collect all questions across all sections and assign categories
  const allQuestions: Array<{ q: any; sIdx: number; qIdx: number; sectionName: string; category: string }> = [];

  if (Array.isArray(sections)) {
    sections.forEach((sec: any, sIdx: number) => {
      const secName = sec.section_name || sec.title || `Section ${sIdx + 1}`;
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any, qIdx: number) => {
          const cat = getQuestionCategory(q, secName);
          allQuestions.push({ q, sIdx, qIdx, sectionName: secName, category: cat });
        });
      }
    });
  }

  const categories = ['All', 'MCQ', 'Short Answer', 'Long Answer', 'Fill in Blanks', 'True/False'];
  const filteredQuestions = selectedCategory === 'All'
    ? allQuestions
    : allQuestions.filter(item => item.category === selectedCategory);

  const handleSelectOption = (qKey: string, opt: string) => {
    setSelectedOptions(prev => ({ ...prev, [qKey]: opt }));
  };

  const toggleAnswer = (qKey: string) => {
    setShowAnswers(prev => ({ ...prev, [qKey]: !prev[qKey] }));
  };

  return (
    <div className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider">
              {currentPaper.paper_title || currentPaper.title || 'Active Assessment Paper'}
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              {currentPaper.subtitle || currentPaper.description || 'Unified Practice Assessment'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="px-3 py-1.5 bg-slate-100 rounded-xl">Total Marks: {currentPaper.total_marks || 50}</span>
            <span className="px-3 py-1.5 bg-slate-100 rounded-xl">Time: {currentPaper.duration || '90 mins'}</span>
          </div>
        </div>
      </div>

      {/* Question Type Filter Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black tracking-widest text-slate-500 uppercase">
            Showing Category: {selectedCategory}
          </div>
          <div className="text-xs font-bold text-slate-500">
            {filteredQuestions.length} Questions
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat === 'All' ? allQuestions.length : allQuestions.filter(item => item.category === cat).length;
            if (count === 0 && cat !== 'All') return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Filtered Questions List */}
      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(({ q, sIdx, qIdx, sectionName }, index: number) => {
            const qKey = `${activePaperIdx}-${sIdx}-${qIdx}`;
            const isAnswerVisible = showAnswers[qKey];
            const correctAnswer = q.correct_answer || q.marking_scheme_answer || q.answer || q.step_by_step_solution || q.solution;
            const markingScheme = q.marking_scheme || q.marking_scheme_solution || '';
            const stepSolution = q.step_by_step_solution || '';
            const displayQuestionText = cleanQuestionText(q.question_text || q.question || JSON.stringify(q));
            const optionsToRender = shuffledMap[qKey] || q.options || [];

            const isCorrectOption = (opt: string) => {
              if (opt === correctAnswer || opt.startsWith(`${correctAnswer})`) || opt === String(correctAnswer)) return true;
              if (correctAnswer && typeof opt === 'string' && opt.toLowerCase().includes(String(correctAnswer).toLowerCase())) {
                return opt.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
              }
              return false;
            };

            return (
              <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Q{index + 1}.</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">{sectionName}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-extrabold">[{q.marks || 1} Mark{q.marks > 1 ? 's' : ''}]</span>
                </div>

                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {displayQuestionText}
                </div>

                {/* Shuffled Options if MCQ */}
                {Array.isArray(optionsToRender) && optionsToRender.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {optionsToRender.map((opt: string, oIdx: number) => {
                      const selectedOpt = selectedOptions[qKey];
                      const isSelected = selectedOpt === opt;
                      const isCorrect = isCorrectOption(opt);
                      let optStyle = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 cursor-pointer';
                      if (isSelected) {
                        optStyle = 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-sm';
                      }
                      if (isAnswerVisible) {
                        if (isCorrect) {
                          optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                        } else if (isSelected && !isCorrect) {
                          optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(qKey, opt)}
                          className={`p-3 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${optStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswerVisible && isCorrect && <span className="text-emerald-600 font-black">✓</span>}
                          {isAnswerVisible && isSelected && !isCorrect && <span className="text-rose-600 font-black">✗</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Marking Scheme / Step-by-step Solution Toggle */}
                {(correctAnswer || markingScheme || stepSolution) && (
                  <div className="pt-2 border-t border-slate-200/60 mt-2">
                    <button
                      onClick={() => toggleAnswer(qKey)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {isAnswerVisible ? 'Hide Step-by-Step Solution & Marking Scheme ▴' : 'Show Step-by-Step Solution & Marking Scheme ▾'}
                    </button>

                    {isAnswerVisible && (
                      <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2 animate-in fade-in duration-200">
                        {correctAnswer && <div><strong>Answer / Solution:</strong> {String(correctAnswer)}</div>}
                        {markingScheme && <div><strong>Marking Scheme:</strong> {String(markingScheme)}</div>}
                        {stepSolution && <div><strong>Steps:</strong> {String(stepSolution)}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500">No questions found for category: {selectedCategory}.</div>
        )}
      </div>
    </div>
  );
}
