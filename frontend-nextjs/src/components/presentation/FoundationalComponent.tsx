import React, { useState } from 'react';
import { renderSafeText } from './safeRender';

interface FoundationalProps {
  data: any;
}

export default function FoundationalComponent({ data }: FoundationalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (idx: number) => {
    setShowAnswers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!data) {
    return <div className="p-8 text-center text-slate-500">No foundational curriculum content available.</div>;
  }

  const chData = data?.source_data?.chapters?.[0] || data?.source_data || data?.chapters?.[0] || data || {};
  const metadata = chData.textbook_metadata || chData.metadata || chData.chapter || data.textbook_metadata || data.metadata || data.chapter || {};

  const contentObj = chData.content || data.content || {};
  let rawModules: any[] = chData.modules || chData.foundational_modules || chData.drills || chData.activities || data.modules || data.foundational_modules || [];

  if ((!Array.isArray(rawModules) || rawModules.length === 0) && contentObj && typeof contentObj === 'object') {
    rawModules = [];
    for (const [catKey, catVal] of Object.entries(contentObj)) {
      if (Array.isArray(catVal)) {
        catVal.forEach(item => {
          rawModules.push({
            category: catKey,
            item: item
          });
        });
      } else if (typeof catVal === 'object' && catVal !== null) {
        rawModules.push({
          category: catKey,
          item: catVal
        });
      }
    }
  }

  if (!Array.isArray(rawModules) || rawModules.length === 0) {
    if (typeof data === 'object') {
      const foundArr = Object.values(data).find(v => Array.isArray(v));
      if (foundArr) rawModules = foundArr;
    }
  }

  const modules = rawModules;
  const categories = ['All', ...Array.from(new Set(modules.map((m: any) => m.category || m.type || m.module_type || 'Module')))];

  const filteredModules = modules.filter((m: any) => {
    const cat = m.category || m.type || m.module_type || 'Module';
    if (selectedCategory !== 'All' && cat !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const itemStr = JSON.stringify(m.item || m || {}).toLowerCase();
    return cat.toLowerCase().includes(q) || itemStr.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Textbook Metadata Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <span>{metadata.curriculum_framework || 'NCF-SE 2023 / NEP 2020'}</span>
          </div>
          <span className="text-xs font-mono text-indigo-300 font-bold">{metadata.grade || 'Foundational Core'}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{metadata.textbook || metadata.title || 'Foundational Curriculum Module'}</h3>
        <p className="text-indigo-200 text-xs sm:text-sm">Publisher: {metadata.publisher || 'NCERT'}</p>

        {/* Search Bar */}
        <div className="pt-2">
          <input
            type="text"
            placeholder="Search concepts, grammar, vocabulary, idioms, synonyms, antonyms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-indigo-500/30 rounded-2xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Category Sub-Tabs Bar */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          {categories.map((cat: any) => {
            const count = cat === 'All' ? modules.length : modules.filter((m: any) => (m.category || m.type || m.module_type || 'Module') === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowAnswers({});
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Foundational Modules Grid */}
      {filteredModules.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase text-indigo-800 tracking-wider">
            {selectedCategory === 'All' ? 'All Foundational Modules' : selectedCategory.replace(/_/g, ' ')} ({filteredModules.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModules.map((mod: any, idx: number) => {
              const item = mod.item || mod;
              if (typeof item === 'string') {
                return (
                  <div key={idx} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-2 hover:border-indigo-300 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg inline-block">
                      Foundational Rule #{idx + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{item}</p>
                  </div>
                );
              }

              const cat = mod.category || mod.type || mod.module_type || 'Module';

              const title = item.concept || item.term || item.title || item.name || item.word || item.idiom || item.root || item.device || item.type || item.phrase_or_word || item.item || cat;
              const explanation = item.explanation || item.definition || item.description || item.meaning || item.structure_rule || item.rule || item.usage_example || '';
              const rules = item.rules || '';
              const examples = item.examples || item.subtopics || item.key_points || item.verb_forms || item.adjective_degrees || item.adjective_forms || [];
              const exampleStr = item.example || item.contextual_importance || '';
              const sourceCtx = item.source_context || mod.source_context || '';
              const synonyms = item.synonyms || item.synonym || [];
              const antonyms = item.antonyms || item.antonym || [];
              const wordForms = item.word_forms || item.forms || item.verb_forms || [];

              const catLower = String(cat).toLowerCase();
              let answerText = '';
              let answerLabel = 'Answer / Meaning';
              if (catLower.includes('synonym') && typeof item.synonym === 'string') {
                answerText = item.synonym;
                answerLabel = 'Synonym Definition';
              } else if (catLower.includes('antonym') && typeof item.antonym === 'string') {
                answerText = item.antonym;
                answerLabel = 'Antonym Definition';
              } else if (catLower.includes('idiom') && typeof item.meaning === 'string') {
                answerText = item.meaning;
                answerLabel = 'Idiom Meaning';
              } else if (typeof item.answer === 'string') {
                answerText = item.answer;
                answerLabel = 'Correct Answer';
              } else if (explanation && (catLower.includes('vocab') || catLower.includes('spelling') || catLower.includes('word_usage'))) {
                answerText = explanation;
                answerLabel = 'Definition / Rule';
              }

              const isAnswerVisible = showAnswers[idx];
              const renderedKeys = new Set(['concept', 'term', 'title', 'name', 'word', 'idiom', 'root', 'device', 'type', 'phrase_or_word', 'item', 'explanation', 'definition', 'description', 'meaning', 'structure_rule', 'rule', 'usage_example', 'rules', 'examples', 'subtopics', 'key_points', 'verb_forms', 'adjective_degrees', 'adjective_forms', 'example', 'contextual_importance', 'source_context', 'synonyms', 'synonym', 'antonyms', 'antonym', 'word_forms', 'forms', 'answer']);
              const extraEntries = typeof item === 'object' && item !== null ? Object.entries(item).filter(([k]) => !renderedKeys.has(k)) : [];

              return (
                <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">{cat.replace(/_/g, ' ')}</span>
                    {sourceCtx && !String(sourceCtx).includes('.pdf') && !String(sourceCtx).includes('.json') && <span className="text-[10px] font-mono text-slate-400 font-bold">{sourceCtx}</span>}
                  </div>
                  <h5 className="text-base font-black text-slate-900">{renderSafeText(title)}</h5>

                  {(!answerText || catLower.includes('grammar') || catLower.includes('literary')) && explanation && (
                    <p className="text-xs text-slate-700 leading-relaxed">{renderSafeText(explanation)}</p>
                  )}
                  {rules && <div className="text-xs font-medium text-indigo-900 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100"><strong>Rules:</strong> {renderSafeText(rules)}</div>}
                  {exampleStr && <div className="text-xs font-serif italic text-slate-600 pt-1">Example: &ldquo;{renderSafeText(exampleStr)}&rdquo;</div>}

                  {/* Synonyms & Antonyms Pills */}
                  {(Array.isArray(synonyms) && synonyms.length > 0 || Array.isArray(antonyms) && antonyms.length > 0) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Array.isArray(synonyms) && synonyms.length > 0 && typeof synonyms !== 'string' && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <strong className="text-emerald-700">Synonyms:</strong>
                          {synonyms.map((syn: string, sIdx: number) => (
                            <span key={sIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium">{syn}</span>
                          ))}
                        </div>
                      )}
                      {Array.isArray(antonyms) && antonyms.length > 0 && typeof antonyms !== 'string' && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <strong className="text-rose-700">Antonyms:</strong>
                          {antonyms.map((ant: string, aIdx: number) => (
                            <span key={aIdx} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-medium">{ant}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Word Forms */}
                  {Array.isArray(wordForms) && wordForms.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="text-[11px] font-bold text-indigo-800 uppercase">Morphological Forms:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {wordForms.map((wf: any, wIdx: number) => (
                          <span key={wIdx} className="px-2.5 py-1 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900">
                            {renderSafeText(wf)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples / Key Points */}
                  {Array.isArray(examples) && examples.length > 0 && !catLower.includes('word_form') && (
                    <div className="pt-1 space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Examples / Key Points:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {examples.map((ex: any, eIdx: number) => (
                          <span key={eIdx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                            {renderSafeText(ex)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra Properties to ensure 100% word fidelity */}
                  {extraEntries.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      {extraEntries.map(([k, v], eIdx: number) => (
                        <div key={eIdx} className="text-[11px] text-slate-600">
                          <strong className="capitalize text-slate-800">{k.replace(/_/g, ' ')}:</strong> {renderSafeText(v)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hideable Answer Toggle */}
                  {answerText && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleAnswer(idx)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {isAnswerVisible ? 'Hide Answer ▴' : 'Show Answer ▾'}
                      </button>

                      {isAnswerVisible && (
                        <div className="mt-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                          <span className="font-bold text-emerald-800">{answerLabel}:</span>
                          <span className="font-black text-emerald-950 text-sm">{renderSafeText(answerText)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <h4 className="text-base font-bold text-slate-800">Foundational Curriculum Modules</h4>
          <p className="text-xs text-slate-500">Explore foundational grammar, vocabulary, spellings, and sentence structures.</p>
        </div>
      )}
    </div>
  );
}
