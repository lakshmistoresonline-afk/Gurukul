import React, { useState, useEffect } from 'react';

function renderSafeText(val: any): React.ReactNode {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (Array.isArray(val)) {
    return val.map((item, idx) => (
      <div key={idx} className="my-1">{renderSafeText(item)}</div>
    ));
  }
  if (typeof val === 'object') {
    return (
      <div className="space-y-2 text-xs">
        {val.statement && <div className="font-bold text-indigo-900">{val.statement}</div>}
        {val.rule && <div className="text-slate-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100"><strong>Rule:</strong> {val.rule}</div>}
        {val.formula && <div className="font-mono bg-slate-100 p-2 rounded-lg text-slate-800"><strong>Formula:</strong> {val.formula}</div>}
        {val.explanation && <div className="text-slate-600">{val.explanation}</div>}
        {!val.statement && !val.rule && !val.formula && Object.entries(val).map(([k, v], idx) => (
          <div key={idx} className="space-y-0.5">
            <strong className="capitalize text-indigo-700">{k.replace(/_/g, ' ')}:</strong> {renderSafeText(v)}
          </div>
        ))}
      </div>
    );
  }
  return String(val);
}

function shuffleOptions(options: string[]) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface MasterProps {
  data: any;
}

export default function MasterComponent({ data }: MasterProps) {
  const cheatSheet = data?.quick_revision_cheat_sheet || data?.cheat_sheet || [];
  const objectiveQ = data?.objective_questions || {};
  const comprehension = data?.comprehension_exercises || data?.comprehension || [];
  const literature = data?.literature_questions || {};

  const hasCheat = Array.isArray(cheatSheet) && cheatSheet.length > 0;
  const hasObj = objectiveQ && Object.keys(objectiveQ).length > 0;
  const hasComp = Array.isArray(comprehension) && comprehension.length > 0;
  const hasLit = literature && Object.keys(literature).length > 0;

  const availableSubTabs = [
    hasCheat && 'cheat_sheet',
    hasObj && 'objective',
    hasComp && 'comprehension',
    hasLit && 'literature'
  ].filter(Boolean) as ('cheat_sheet' | 'objective' | 'comprehension' | 'literature')[];

  const [activeSubTab, setActiveSubTab] = useState<'cheat_sheet' | 'objective' | 'comprehension' | 'literature'>(
    availableSubTabs[0] || 'objective'
  );

  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [selectedTfAnswers, setSelectedTfAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (availableSubTabs.length > 0 && !availableSubTabs.includes(activeSubTab)) {
      setActiveSubTab(availableSubTabs[0]);
    }
  }, [data, hasCheat, hasObj, hasComp, hasLit]);

  const [shuffledMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    if (!data) return map;
    const objQ = data.objective_questions || {};
    Object.entries(objQ).forEach(([qType, qArr]: [string, any]) => {
      if (Array.isArray(qArr)) {
        qArr.forEach((q: any, qIdx: number) => {
          if (Array.isArray(q.options)) {
            map[`obj-${qType}-${qIdx}`] = shuffleOptions(q.options);
          }
        });
      }
    });
    return map;
  });

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No master practice content available.</div>;
  }

  const toggleAnswer = (key: string) => {
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTfSelect = (key: string, val: boolean) => {
    setSelectedTfAnswers(prev => ({ ...prev, [key]: val }));
    setShowAnswers(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {hasCheat && (
          <button
            onClick={() => setActiveSubTab('cheat_sheet')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeSubTab === 'cheat_sheet' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            💡 Quick Cheat Sheet
          </button>
        )}
        {hasObj && (
          <button
            onClick={() => setActiveSubTab('objective')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeSubTab === 'objective' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            📝 Objective Questions
          </button>
        )}
        {hasComp && (
          <button
            onClick={() => setActiveSubTab('comprehension')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeSubTab === 'comprehension' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            📖 Comprehension & Extracts
          </button>
        )}
        {hasLit && (
          <button
            onClick={() => setActiveSubTab('literature')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeSubTab === 'literature' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            ✍️ Literature Questions
          </button>
        )}
      </div>

      {/* Tab 1: Cheat Sheet */}
      {activeSubTab === 'cheat_sheet' && hasCheat && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Quick Revision Cheat Sheet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cheatSheet.map((item: any, idx: number) => (
              <div key={idx} className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Concept #{idx + 1}</div>
                <div className="text-sm font-medium text-slate-800">{renderSafeText(item)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Objective Questions */}
      {activeSubTab === 'objective' && hasObj && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Objective Question Bank</h3>
          {Object.entries(objectiveQ).map(([qType, qArr]: [string, any], tIdx: number) => (
            Array.isArray(qArr) && qArr.length > 0 && (
              <div key={tIdx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">{qType.replace(/_/g, ' ')}</h4>
                <div className="space-y-4">
                  {qArr.map((q: any, qIdx: number) => {
                    const qText = q.question || q.statement || (qType === 'match_following' ? 'Match the following columns:' : null);
                    const qKey = `obj-${tIdx}-${qIdx}`;
                    const mapKey = `obj-${qType}-${qIdx}`;
                    const isVisible = showAnswers[qKey];
                    const answer = q.correct_answer || q.answer;
                    const isTrueFalse = qType === 'true_false' || 'is_true' in q;
                    const userTf = selectedTfAnswers[qKey];
                    const optionsToRender = shuffledMap[mapKey] || q.options || [];

                    const isCorrectOption = (opt: string) => {
                      if (opt === answer || opt.startsWith(`${answer})`) || opt === String(answer)) return true;
                      if (answer && typeof opt === 'string' && opt.toLowerCase().includes(String(answer).toLowerCase())) {
                        return opt.trim().toLowerCase() === String(answer).trim().toLowerCase();
                      }
                      return false;
                    };

                    return (
                      <div key={qIdx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                        {qText && <div className="text-xs font-bold text-slate-700">Q{qIdx + 1}: {qText}</div>}

                        {/* Shuffled Standard Options (MCQs) */}
                        {Array.isArray(optionsToRender) && optionsToRender.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {optionsToRender.map((opt: string, oIdx: number) => {
                              const isCorrect = isCorrectOption(opt);
                              return (
                                <div key={oIdx} className={`p-2.5 rounded-xl text-xs font-medium border ${isVisible && isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}>
                                  {opt} {isVisible && isCorrect ? '✓' : ''}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* True / False Options */}
                        {isTrueFalse && (
                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => handleTfSelect(qKey, true)}
                              className={`px-6 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                userTf === true
                                  ? q.is_true === true ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              True {isVisible && q.is_true === true ? '✓' : ''}
                            </button>
                            <button
                              onClick={() => handleTfSelect(qKey, false)}
                              className={`px-6 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                userTf === false
                                  ? q.is_true === false ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              False {isVisible && q.is_true === false ? '✓' : ''}
                            </button>
                          </div>
                        )}

                        {answer && !isTrueFalse && (
                          <div className="pt-2 border-t border-slate-200/60 mt-2">
                            <button
                              onClick={() => toggleAnswer(qKey)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              {isVisible ? 'Hide Answer ▴' : 'Show Answer ▾'}
                            </button>
                            {isVisible && (
                              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                                <strong>Correct Answer:</strong> {renderSafeText(answer)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Tab 3: Comprehension */}
      {activeSubTab === 'comprehension' && hasComp && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Comprehension & Extracts</h3>
          <div className="space-y-6">
            {comprehension.map((ex: any, idx: number) => (
              <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                <div className="text-xs font-bold text-indigo-600 uppercase">Extract #{idx + 1}</div>
                {ex.extract_text && <div className="p-4 bg-white border border-slate-200 rounded-2xl italic text-xs text-slate-700">&ldquo;{ex.extract_text}&rdquo;</div>}

                {Array.isArray(ex.questions) && ex.questions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Comprehension Questions</h4>
                    {ex.questions.map((subQ: any, sqIdx: number) => {
                      const sqKey = `comp-${idx}-${sqIdx}`;
                      const isVisible = showAnswers[sqKey];
                      const ans = subQ.correct_answer || subQ.answer;

                      return (
                        <div key={sqIdx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <div className="text-xs font-bold text-slate-800">Q{sqIdx + 1}: {subQ.q || subQ.question}</div>
                          {Array.isArray(subQ.options) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {subQ.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className={`p-2 rounded-lg text-xs font-medium border ${isVisible && opt === ans ? 'bg-emerald-50 text-emerald-900 font-bold' : 'bg-white text-slate-700'}`}>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {ans && (
                            <div className="pt-1">
                              <button onClick={() => toggleAnswer(sqKey)} className="text-[11px] font-bold text-indigo-600">
                                {isVisible ? 'Hide Answer ▴' : 'Show Answer ▾'}
                              </button>
                              {isVisible && <div className="mt-1 text-xs text-emerald-900 font-bold">Answer: {renderSafeText(ans)}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Literature Questions */}
      {activeSubTab === 'literature' && hasLit && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Literature Question Bank</h3>
          <div className="space-y-4">
            {Object.entries(literature).map(([cat, qList]: [string, any], lIdx: number) => (
              Array.isArray(qList) && qList.length > 0 && (
                <div key={lIdx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">{cat.replace(/_/g, ' ')}</h4>
                  <div className="space-y-4">
                    {qList.map((lit: any, qIdx: number) => {
                      const lKey = `lit-${lIdx}-${qIdx}`;
                      const isVisible = showAnswers[lKey];
                      const ans = lit.detailed_answer || lit.answer || lit.solution;

                      return (
                        <div key={qIdx} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <div className="text-sm font-bold text-slate-900">{lit.question || lit.q || lit.question_text || ''}</div>
                          {ans && (
                            <div className="pt-2 border-t border-slate-100">
                              <button onClick={() => toggleAnswer(lKey)} className="text-xs font-bold text-indigo-600">
                                {isVisible ? 'Hide Detailed Answer ▴' : 'Show Detailed Answer ▾'}
                              </button>
                              {isVisible && <div className="mt-2 p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 font-medium"><strong>Answer:</strong> {renderSafeText(ans)}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
