import React, { useState } from 'react';
import { renderSafeText } from './safeRender';

interface MathsNotesProps {
  data: any;
}

export default function MathsNotesComponent({ data }: MathsNotesProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('foundation');

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No notes available.</div>;
  }

  const theme = data.theme || data.chapter_title || '';

  // 1. Check conceptual_foundation structure
  const foundation = data.conceptual_foundation || {};

  // 2. Check section_1_complete_textbook_notes structure
  const sec1 = data.section_1_complete_textbook_notes || {};

  const intro = foundation.introduction || sec1.chapter_overview || data.overview || data.summary || data.chapter_overview || '';

  const coreConcepts = (foundation.core_concepts && foundation.core_concepts.length > 0)
    ? foundation.core_concepts
    : (sec1.detailed_sections && sec1.detailed_sections.length > 0)
    ? sec1.detailed_sections.map((ds: any) => ({
        concept: ds.section_number_title || ds.title || 'Section Concept',
        explanation: ds.full_textbook_explanation || ds.explanation || ds,
        example: ds.example || (ds.mathematical_definitions ? JSON.stringify(ds.mathematical_definitions) : null)
      }))
    : data.detailedBreakdown || [];

  const formulas = data.key_formulas_and_rules || data.formulas || [];
  const realWorld = data.real_world_applications || data.applications || '';
  const algorithms = data.section_2_step_by_step_algorithms || [];

  return (
    <div className="space-y-6">
      {/* Sub-Section Selector Tabs Bar */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveSubTab('foundation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeSubTab === 'foundation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          📖 Conceptual Foundation
        </button>
        {coreConcepts.length > 0 && (
          <button
            onClick={() => setActiveSubTab('concepts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeSubTab === 'concepts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🔬 Core Concepts ({coreConcepts.length})
          </button>
        )}
        {algorithms.length > 0 && (
          <button
            onClick={() => setActiveSubTab('algorithms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeSubTab === 'algorithms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ⚙️ Step-by-Step Algorithms ({algorithms.length})
          </button>
        )}
        {formulas.length > 0 && (
          <button
            onClick={() => setActiveSubTab('formulas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeSubTab === 'formulas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📐 Formulas & Rules ({formulas.length})
          </button>
        )}
        {realWorld && (
          <button
            onClick={() => setActiveSubTab('applications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeSubTab === 'applications' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🌍 Real-World Applications
          </button>
        )}
      </div>

      {/* Tab 1: Conceptual Foundation */}
      {activeSubTab === 'foundation' && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          {theme && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">Theme: {theme}</span>}
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Conceptual Foundation</h3>
          {intro && <div className="text-slate-700 text-sm leading-relaxed">{renderSafeText(intro)}</div>}
        </div>
      )}

      {/* Tab 2: Core Concepts */}
      {activeSubTab === 'concepts' && coreConcepts.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Core Mathematical Concepts</h3>
          <div className="space-y-4">
            {coreConcepts.map((cc: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600">Concept #{idx + 1}: {cc.concept || cc.title || 'Concept'}</div>
                <div className="text-slate-700 text-sm leading-relaxed">{renderSafeText(cc.explanation || cc.full_textbook_explanation || cc)}</div>
                {cc.example && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs text-indigo-900 leading-relaxed">
                    <strong>Example:</strong> {renderSafeText(cc.example)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Step-by-Step Algorithms */}
      {activeSubTab === 'algorithms' && algorithms.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Step-by-Step Algorithms & Constructions</h3>
          <div className="space-y-4">
            {algorithms.map((alg: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600">Algorithm #{idx + 1}: {alg.title || alg.algorithm_name || 'Procedure'}</div>
                <div className="text-slate-800 text-xs font-medium leading-relaxed">{renderSafeText(alg.steps || alg.description || alg)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Formulas */}
      {activeSubTab === 'formulas' && formulas.length > 0 && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Key Formulas & Rules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formulas.map((form: any, idx: number) => (
              <div key={idx} className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
                <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide">Rule #{idx + 1}</div>
                <div className="text-slate-900 text-sm font-bold font-mono">{renderSafeText(form)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Applications */}
      {activeSubTab === 'applications' && realWorld && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Real-World Applications</h3>
          <div className="text-slate-700 text-sm leading-relaxed font-medium bg-amber-50/50 p-4 rounded-2xl border border-amber-100">{renderSafeText(realWorld)}</div>
        </div>
      )}
    </div>
  );
}
