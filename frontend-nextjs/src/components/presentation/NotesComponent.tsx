import React, { useState } from 'react';
import HindiNotesComponent from './HindiNotesComponent';
import MathsNotesComponent from './MathsNotesComponent';
import { renderSafeText, SafeStructuredCard } from './safeRender';

import Class7UniversalNotesComponent from './Class7/Class7UniversalNotesComponent';

interface NotesProps {
  data: any;
  subject?: string;
}

export default function NotesComponent({ data, subject }: NotesProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('summary');

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No notes available.</div>;
  }

  if (data.m1_zero_omission_notes) {
    return <Class7UniversalNotesComponent data={data} />;
  }

  if (data.core_theme_and_moral || data.detailed_summary_and_explanation || data.exhaustive_vocabulary) {
    return <HindiNotesComponent data={data} />;
  }
  if (data.conceptual_foundation && typeof data.conceptual_foundation === 'object') {
    return <MathsNotesComponent data={data} />;
  }

  const overviewText = data.overview || data.summary || '';
  const centralTheme = data.centralTheme || data.core_theme_and_moral || data.theme || '';
  const breakdown = data.detailedBreakdown || data.paragraphs || [];
  const poeticDevices = data.poeticDevices || null;
  const characterAnalysis = data.characterAnalysis || [];
  const grammarFocus = data.grammarFocus || data.grammar_and_language || null;

  const section1Arch = data.section_1_core_map_and_conceptual_architecture || null;
  const section2Vocab = data.section_2_essential_vocabulary || [];
  const section3Pitfalls = data.section_3_misconceptions_and_pitfall_prevention || [];

  const rawVocab = data.keyVocabulary || data.exhaustive_vocabulary || data.glossary || data.vocabulary || [];
  const combinedVocab = [
    ...(Array.isArray(rawVocab) ? rawVocab : Object.values(rawVocab)),
    ...(Array.isArray(section2Vocab) ? section2Vocab : Object.values(section2Vocab))
  ];

  const takeaways = data.importantTakeaways || data.key_takeaways || [];
  const stories = data.stories || data.mindmap_outline?.stories || [];

  return (
    <div className="space-y-6">
      {/* Sub-Section Selector Tabs Bar */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          📖 Summary & Theme
        </button>
        {breakdown.length > 0 && (
          <button
            onClick={() => setActiveSubTab('breakdown')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'breakdown' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🔬 Core Concepts ({breakdown.length})
          </button>
        )}
        {poeticDevices && (
          <button
            onClick={() => setActiveSubTab('poetic')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'poetic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            🎭 Poetic Devices
          </button>
        )}
        {characterAnalysis.length > 0 && (
          <button
            onClick={() => setActiveSubTab('characters')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'characters' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            👥 Characters ({characterAnalysis.length})
          </button>
        )}
        {grammarFocus && (
          <button
            onClick={() => setActiveSubTab('grammar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'grammar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ✍️ Grammar Focus
          </button>
        )}
        {stories.length > 0 && (
          <button
            onClick={() => setActiveSubTab('stories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'stories' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📚 Stories & Arcs ({stories.length})
          </button>
        )}
        {combinedVocab.length > 0 && (
          <button
            onClick={() => setActiveSubTab('glossary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeSubTab === 'glossary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            📚 Glossary ({combinedVocab.length})
          </button>
        )}
      </div>

      {/* Tab 1: Summary & Theme */}
      {activeSubTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {section1Arch ? (
            <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Core Map & Conceptual Architecture</h3>
              <SafeStructuredCard item={section1Arch} />
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Chapter Summary & Theme</h3>
              {overviewText && <p className="text-slate-700 text-sm leading-relaxed">{renderSafeText(overviewText)}</p>}
              {centralTheme && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-indigo-900 text-xs font-bold">
                  Central Theme: {renderSafeText(centralTheme)}
                </div>
              )}
            </div>
          )}

          {section3Pitfalls.length > 0 && (
            <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Misconceptions & Pitfalls</h3>
              <div className="space-y-3">
                {section3Pitfalls.map((p: any, idx: number) => (
                  <SafeStructuredCard key={idx} item={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Detailed Breakdown / Core Concepts */}
      {activeSubTab === 'breakdown' && breakdown.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Detailed Section & Stanza Analysis</h3>
          <div className="space-y-4">
            {breakdown.map((b: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600">{b.sectionTitle || `Section #${idx + 1}`}</div>
                {b.lines && <div className="p-3 bg-slate-50 rounded-xl text-xs font-serif italic text-slate-800 border border-slate-100">&ldquo;{b.lines}&rdquo;</div>}
                <div className="text-xs text-slate-700 leading-relaxed">{b.analysis || b.explanation || b}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Poetic Devices */}
      {activeSubTab === 'poetic' && poeticDevices && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Poetic Devices & Literary Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(poeticDevices).map(([k, v]: [string, any], idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="text-xs font-extrabold text-indigo-700 capitalize">{k.replace(/_/g, ' ')}</div>
                <div className="text-xs text-slate-700 font-medium">{Array.isArray(v) ? v.join(', ') : String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Character Analysis */}
      {activeSubTab === 'characters' && characterAnalysis.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Character Profiles & Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characterAnalysis.map((c: any, idx: number) => (
              <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                <div className="text-sm font-extrabold text-indigo-600">{c.character || c.name}</div>
                <div className="text-xs text-slate-700 leading-relaxed"><strong>Traits:</strong> {c.traits || c.profile}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Grammar Focus */}
      {activeSubTab === 'grammar' && grammarFocus && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Grammar & Language Focus</h3>
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
            <div className="text-sm font-black text-indigo-900">{grammarFocus.conceptTitle || grammarFocus.concept || 'Grammar Focus'}</div>
            <div className="text-xs text-slate-700 font-medium">{grammarFocus.rules || grammarFocus.explanation}</div>
            {Array.isArray(grammarFocus.examples) && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-indigo-800 uppercase">Examples:</div>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 pt-1">
                  {grammarFocus.examples.map((ex: string, eIdx: number) => (
                    <li key={eIdx}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Stories & Arcs */}
      {activeSubTab === 'stories' && stories.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Unit Stories & Narrative Arcs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((st: any, idx: number) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <h4 className="text-base font-black text-slate-900">{st.title}</h4>
                {Array.isArray(st.characters) && st.characters.length > 0 && (
                  <div className="text-xs text-indigo-700 font-bold">Characters: {st.characters.join(', ')}</div>
                )}
                {st.narrative_arc && <p className="text-xs text-slate-700 leading-relaxed">{st.narrative_arc}</p>}
                {Array.isArray(st.moral_lessons) && st.moral_lessons.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="text-[11px] font-bold text-amber-800 uppercase">Moral Lessons:</div>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                      {st.moral_lessons.map((ml: string, mIdx: number) => (
                        <li key={mIdx}>{ml}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Glossary */}
      {activeSubTab === 'glossary' && combinedVocab.length > 0 && (
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Essential Vocabulary & Glossary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {combinedVocab.map((v: any, idx: number) => (
              <SafeStructuredCard key={idx} item={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
