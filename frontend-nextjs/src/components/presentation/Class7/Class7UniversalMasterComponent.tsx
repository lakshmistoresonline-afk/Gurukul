import React, { useState } from 'react';

function renderSafeText(val: any): React.ReactNode {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (Array.isArray(val)) {
    return val.map((item, idx) => (
      <div key={idx} className="my-1">{renderSafeText(item)}</div>
    ));
  }
  if (typeof val === 'object') {
    if (val.text) return val.text;
    if (val.summary) return val.summary;
    if (val.definition) return `${val.term || val.word || ''}: ${val.definition}`;
    return Object.entries(val).map(([k, v], idx) => (
      <div key={idx} className="text-xs space-y-0.5">
        <strong className="capitalize text-indigo-700">{k.replace(/_/g, ' ')}:</strong> {renderSafeText(v)}
      </div>
    ));
  }
  return String(val);
}

function safeArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    const arr: any[] = [];
    for (const v of Object.values(val)) {
      if (Array.isArray(v)) {
        arr.push(...v);
      } else if (v && typeof v === 'object') {
        arr.push(v);
      }
    }
    return arr.length > 0 ? arr : [val];
  }
  return [val];
}

interface Class7MasterProps {
  data: any;
}

export default React.memo(function Class7UniversalMasterComponent({ data }: Class7MasterProps) {
  const notes = data?.zero_omission_notes || data?.m1_zero_omission_notes || [];
  const rawLab = data?.practical_lab_activity_or_methodology_manual || data?.m3_practical_activities_and_procedures || [];
  const rawVisuals = data?.visuals_diagrams_and_tabular_data || data?.m4_diagrams_and_tables || [];
  const glossary = data?.master_glossary_units_and_formulas || data?.m2_key_terms_formulas_and_rules || {};
  const qBank = data?.exam_question_bank || data?.m6_tiered_exam_question_bank || {};

  const lab = safeArray(rawLab);
  const visuals = safeArray(rawVisuals);

  const hasNotes = notes && (Array.isArray(notes) ? notes.length > 0 : Object.keys(notes).length > 0);
  const hasLab = lab.length > 0;
  const hasVisuals = visuals.length > 0;
  const hasGlossary = glossary && (Array.isArray(glossary) ? glossary.length > 0 : Object.keys(glossary).length > 0);
  const hasQBank = qBank && (Array.isArray(qBank) ? qBank.length > 0 : Object.keys(qBank).length > 0);

  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (hasNotes) return 'notes';
    if (hasLab) return 'lab';
    if (hasGlossary) return 'glossary';
    if (hasQBank) return 'qbank';
    return 'notes';
  });

  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No master content available for this chapter.</div>;
  }

  const toggleAnswer = (key: string) => {
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Sub-Section Selector Tabs Bar */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {hasNotes && (
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'notes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ⚡ Master Notes ({notes.length})
          </button>
        )}
        {hasLab && (
          <button
            onClick={() => setActiveSubTab('lab')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🧪 Lab Manual ({lab.length})
          </button>
        )}
        {hasVisuals && (
          <button
            onClick={() => setActiveSubTab('visuals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'visuals' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📐 Visuals & Diagrams ({visuals.length})
          </button>
        )}
        {hasGlossary && (
          <button
            onClick={() => setActiveSubTab('glossary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'glossary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📚 Glossary & Formulas
          </button>
        )}
        {hasQBank && (
          <button
            onClick={() => setActiveSubTab('qbank')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'qbank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📋 Exam Question Bank
          </button>
        )}
      </div>

      {/* Tab 1: Master Notes */}
      {activeSubTab === 'notes' && hasNotes && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Zero-Omission Master Notes</h3>
          <div className="space-y-4">
            {Array.isArray(notes) ? (
              notes.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <div className="text-sm font-extrabold text-indigo-600">{item.topic || item.heading || item.section_number_and_title || `Note #${idx + 1}`}</div>
                  <div className="text-xs text-slate-700 leading-relaxed">{renderSafeText(item.content || item.explanation || item.full_notes || item)}</div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {notes.summary && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
                    <div className="text-xs font-black text-indigo-900 uppercase font-mono">Executive Summary</div>
                    <div className="text-xs text-slate-700 leading-relaxed font-medium">{renderSafeText(notes.summary)}</div>
                  </div>
                )}
                {renderSafeText(notes.detailed_sections || notes)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Lab Manual */}
      {activeSubTab === 'lab' && hasLab && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Lab & Activity Manual</h3>
          <div className="space-y-3">
            {lab.map((act: any, idx: number) => (
              <div key={idx} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                <div className="text-sm font-extrabold text-emerald-900">{act.title || act.activity_name || `Activity #${idx + 1}`}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{renderSafeText(act.procedure || act.description || act)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Visuals & Diagrams */}
      {activeSubTab === 'visuals' && hasVisuals && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Visuals, Diagrams & Tabular Data</h3>
          <div className="space-y-3">
            {visuals.map((vis: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="text-sm font-extrabold text-indigo-600">{vis.title || `Figure #${idx + 1}`}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{renderSafeText(vis.description || vis.data || vis)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Glossary & Formulas */}
      {activeSubTab === 'glossary' && hasGlossary && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Master Glossary, Units & Formulas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(glossary).map(([term, def]: [string, any], idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="text-sm font-extrabold text-indigo-600">{term}</div>
                <div className="text-xs text-slate-700">{renderSafeText(def)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Exam Question Bank */}
      {activeSubTab === 'qbank' && hasQBank && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Exam Question Bank</h3>
          {Object.entries(qBank).map(([qType, qList]: [string, any], tIdx: number) => (
            Array.isArray(qList) && qList.length > 0 && (
              <div key={tIdx} className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">{qType.replace(/_/g, ' ')}</h4>
                <div className="space-y-3">
                  {qList.map((q: any, qIdx: number) => {
                    const qKey = `${tIdx}-${qIdx}`;
                    const isVisible = showAnswers[qKey];
                    const answer = q.answer || q.correct_answer || q.solution;

                    return (
                      <div key={qIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <div className="text-xs font-bold text-slate-700">Q{qIdx + 1}: {renderSafeText(q.question || q.q || q)}</div>
                        {answer && (
                          <div className="pt-2 border-t border-slate-200/60 mt-2">
                            <button
                              onClick={() => toggleAnswer(qKey)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              {isVisible ? 'Hide Answer ▴' : 'Show Answer ▾'}
                            </button>
                            {isVisible && (
                              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                                Answer: {renderSafeText(answer)}
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

      {/* Universal Fallback when sub-tab content keys are absent */}
      {!hasNotes && !hasLab && !hasVisuals && !hasGlossary && !hasQBank && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">
            {data?.title || data?.chapter_title || data?.chapterTitle || 'Master Reference Guide'}
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
            {renderSafeText(data?.content || data?.master || data?.notes || data?.summary || data)}
          </div>
        </div>
      )}
    </div>
  );
});
