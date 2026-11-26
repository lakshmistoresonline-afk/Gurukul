import React, { useState } from 'react';

interface ScienceMasterProps {
  data: any;
}

export default function ScienceMasterComponent({ data }: ScienceMasterProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('concepts');
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No master science content available.</div>;
  }

  const concepts = data.concepts || [];
  const experiments = data.experiments_and_activities || [];
  const caseStudies = data.case_studies_and_stories || [];
  const questionBank = data.question_bank || {};
  const revision = data.revision || {};

  const toggleAnswer = (key: string) => {
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasQBank = questionBank && Object.keys(questionBank).length > 0;
  const hasRevision = revision && Object.keys(revision).length > 0;

  return (
    <div className="space-y-6">
      {/* Sub-Section Selector Tabs Bar */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {concepts.length > 0 && (
          <button
            onClick={() => setActiveSubTab('concepts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'concepts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🔬 Scientific Concepts ({concepts.length})
          </button>
        )}
        {experiments.length > 0 && (
          <button
            onClick={() => setActiveSubTab('experiments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'experiments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🧪 Experiments ({experiments.length})
          </button>
        )}
        {caseStudies.length > 0 && (
          <button
            onClick={() => setActiveSubTab('caseStudies')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'caseStudies' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🏛️ Case Studies ({caseStudies.length})
          </button>
        )}
        {hasQBank && (
          <button
            onClick={() => setActiveSubTab('qbank')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'qbank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📋 Question Bank
          </button>
        )}
        {hasRevision && (
          <button
            onClick={() => setActiveSubTab('revision')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'revision' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ⚡ Revision & Pitfalls
          </button>
        )}
      </div>

      {/* Tab 1: Concepts */}
      {activeSubTab === 'concepts' && concepts.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xl font-black text-slate-900">Core Scientific Concepts</h3>
            <div className="w-12 h-12 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/science_plant_growth.svg" alt="Science Plant Growth Illustration" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-4">
            {concepts.map((c: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600">Concept #{idx + 1}: {c.topic}</div>
                <p className="text-slate-700 text-sm leading-relaxed">{c.explanation}</p>
                {Array.isArray(c.key_terms) && c.key_terms.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {c.key_terms.map((kt: string, kIdx: number) => (
                      <span key={kIdx} className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900">{kt}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Experiments */}
      {activeSubTab === 'experiments' && experiments.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Experiments & Practical Activities</h3>
          <div className="space-y-4">
            {experiments.map((exp: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-600">Experiment #{idx + 1}: {exp.title}</div>
                <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl"><strong>Observation:</strong> {exp.observation}</div>
                <div className="text-xs text-emerald-800 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100"><strong>Inference:</strong> {exp.inference}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Case Studies */}
      {activeSubTab === 'caseStudies' && caseStudies.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Case Studies & Heritage Stories</h3>
          <div className="space-y-4">
            {caseStudies.map((cs: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-purple-600">Case Study #{idx + 1}: {cs.title}</div>
                <p className="text-slate-700 text-sm leading-relaxed">{cs.summary}</p>
                {cs.takeaway && <div className="text-xs text-purple-900 bg-purple-50/60 p-3 rounded-xl border border-purple-100"><strong>Key Takeaway:</strong> {cs.takeaway}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Question Bank */}
      {activeSubTab === 'qbank' && hasQBank && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Scientific Question Bank & Practice</h3>
          {Object.entries(questionBank).map(([qType, qArr]: [string, any], tIdx: number) => (
            Array.isArray(qArr) && qArr.length > 0 && (
              <div key={tIdx} className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">{qType.replace(/_/g, ' ')}</h4>
                <div className="space-y-4">
                  {qArr.map((q: any, qIdx: number) => {
                    const qKey = `${tIdx}-${qIdx}`;
                    const isVisible = showAnswers[qKey];
                    const answer = q.a || q.correct_answer || q.answer;

                    return (
                      <div key={qIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <div className="text-xs font-bold text-slate-700">Q{qIdx + 1}: {q.q || q.question}</div>
                        {answer && (
                          <div className="pt-2 border-t border-slate-200/60 mt-2">
                            <button
                              onClick={() => toggleAnswer(qKey)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              {isVisible ? 'Hide Answer ▴' : 'Show Answer ▾'}
                            </button>

                            {isVisible && (
                              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                                <strong>Answer:</strong> {String(answer)}
                                {q.reason && <div className="text-slate-600 pt-1"><em>Reason:</em> {q.reason}</div>}
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

      {/* Tab 5: Revision & Pitfalls */}
      {activeSubTab === 'revision' && hasRevision && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Quick Revision & Pitfalls</h3>
          {Array.isArray(revision.key_summary) && revision.key_summary.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-700 uppercase">Key Summary Points:</div>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                {revision.key_summary.map((ks: string, i: number) => (
                  <li key={i}>{ks}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(revision.common_pitfalls) && revision.common_pitfalls.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-rose-700 uppercase">Common Pitfalls & Corrections:</div>
              <div className="space-y-2">
                {revision.common_pitfalls.map((cp: any, i: number) => (
                  <div key={i} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-rose-900">❌ Error: {cp.error}</div>
                    <div className="font-medium text-emerald-900">✅ Correction: {cp.correction}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
