import React from 'react';

export function renderSafeText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(renderSafeText).filter(Boolean).join(' | ');
  }
  if (typeof val === 'object') {
    try {
      if (typeof val.text === 'string') return val.text;
      if (typeof val.summary === 'string') return val.summary;
      if (typeof val.overview === 'string') return val.overview;
      if (typeof val.description === 'string') return val.description;
      if (typeof val.title === 'string') return val.title;
      if (typeof val.name === 'string') return val.name;
      if (typeof val.question_text === 'string') return val.question_text;
      if (typeof val.question === 'string') return val.question;
      if (typeof val.front_content === 'string') return val.front_content;
      if (typeof val.back_content === 'string') return val.back_content;
      if (typeof val.big_idea_summary === 'string') return val.big_idea_summary;
      if ('term' in val && 'definition' in val) {
        return `${val.term}: ${val.definition}`;
      }
      if ('heading' in val && 'content' in val) {
        return `${val.heading}: ${val.content}`;
      }
      if ('misconception' in val && 'correction' in val) {
        return `Misconception: ${val.misconception} | Correction: ${val.correction}`;
      }

      const keys = Object.keys(val);
      if (keys.length === 0) return '';
      for (const k of keys) {
        if (typeof val[k] === 'string' && val[k].length > 0) {
          return val[k];
        }
      }
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
}

export function SafeStructuredCard({ item }: { item: any }) {
  if (item === null || item === undefined) return null;

  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return <p className="text-slate-700 text-xs leading-relaxed font-medium">{String(item)}</p>;
  }

  if (Array.isArray(item)) {
    return (
      <div className="space-y-3">
        {item.map((sub, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-2xs">
            <SafeStructuredCard item={sub} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof item === 'object') {
    // 1. Special Handling for Misconceptions & Corrections
    if (item.misconception || item.correction) {
      return (
        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1.5 shadow-2xs">
          {item.misconception && <div className="font-extrabold text-rose-900">⚠️ Misconception: {renderSafeText(item.misconception)}</div>}
          {item.correction && <div className="font-medium text-emerald-900">✓ Correction: {renderSafeText(item.correction)}</div>}
        </div>
      );
    }

    // 2. Special Handling for Terms, Definitions & Vocab Cards
    const term = item.term || item.word || item.heading || item.title || item.name || '';
    const def = item.definition || item.meaning || item.content || item.description || item.summary || item.text || '';
    const example = item.example || item.contextual_importance || item.context || '';

    const entries = Object.entries(item);

    return (
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2">
        {term && <div className="text-sm font-black text-indigo-700 tracking-tight">{renderSafeText(term)}</div>}
        {def && <div className="text-xs text-slate-700 leading-relaxed font-medium">{renderSafeText(def)}</div>}
        {example && <div className="text-[11px] font-serif italic text-slate-500 pt-1 border-t border-slate-100">Context: &ldquo;{renderSafeText(example)}&rdquo;</div>}

        {/* Deep Recursive Rendering for All Additional Unhandled Keys */}
        {entries.map(([k, v]) => {
          const kLower = k.toLowerCase();
          if (['term', 'word', 'heading', 'title', 'name', 'definition', 'meaning', 'content', 'description', 'summary', 'text', 'example', 'contextual_importance', 'context'].includes(kLower)) {
            return null;
          }
          if (v === null || v === undefined || v === '') return null;

          const formattedKey = k.replace(/_/g, ' ').toUpperCase();

          return (
            <div key={k} className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">{formattedKey}:</span>
              <SafeStructuredCard item={v} />
            </div>
          );
        })}
      </div>
    );
  }

  return <p className="text-xs text-slate-700 leading-relaxed font-medium">{renderSafeText(item)}</p>;
}
