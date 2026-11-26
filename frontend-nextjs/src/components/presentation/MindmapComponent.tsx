import React from 'react';

interface MindmapProps {
  data: any;
}

export default function MindmapComponent({ data }: MindmapProps) {
  if (!data) {
    return <div className="p-8 text-center text-slate-500">No mindmap available.</div>;
  }

  // Unwrap mind_map / mindmap wrapper if present
  const mapData = data.mind_map || data.mindmap || data;

  const rootNode = mapData.root_node || mapData.root_topic || mapData.root || mapData.central_node || mapData.chapter_title || data.chapter_title || 'Central Concept';
  const centralTheme = mapData.central_theme || mapData.central_node || mapData.theme || '';
  const subNodes = mapData.sub_nodes || mapData.branches || mapData.nodes || mapData.main_branches || [];

  return (
    <div className="space-y-8">
      {/* Root / Central Theme Card */}
      <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl text-white shadow-xl text-center space-y-3">
        <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/50 border border-indigo-400/40 text-indigo-100 text-xs font-bold uppercase tracking-widest">
          Mindmap Root
        </div>
        <h2 className="text-3xl font-black tracking-tight">{rootNode}</h2>
        {centralTheme && centralTheme !== rootNode && (
          <p className="text-indigo-100 text-sm max-w-2xl mx-auto opacity-90 leading-relaxed">
            {typeof centralTheme === 'string' ? centralTheme : JSON.stringify(centralTheme)}
          </p>
        )}
      </div>

      {/* Sub Nodes / Branches / Main Branches */}
      {Array.isArray(subNodes) && subNodes.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-3">Concept Branches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subNodes.map((node: any, idx: number) => {
              const children = node.child_nodes || node.children || node.sub_nodes || node.sub_branches || node.sub_topics || [];
              const branchTitle = node.title || node.theme || node.name || node.branch_title || node.branch_name || node.node_id || `Branch #${idx + 1}`;
              return (
                <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Branch #{idx + 1}</span>
                    {node.node_id && <span className="text-xs font-mono bg-indigo-50 px-2.5 py-1 rounded-full text-indigo-700 font-bold">{node.node_id}</span>}
                  </div>
                  <h4 className="text-lg font-black text-slate-900">{branchTitle}</h4>

                  {/* Nested Child Nodes / Sub-branches */}
                  {Array.isArray(children) && children.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {children.map((child: any, cIdx: number) => {
                        const childTitle = typeof child === 'string' ? child : (child.title || child.concept || child.name || child.topic || child.sub_title || child.sub_topic || '');
                        const details = typeof child === 'object' ? (child.details || child.explanation || child.full_explanation || '') : '';

                        return (
                          <div key={cIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                            {childTitle && <div className="text-xs font-bold text-indigo-900">{childTitle}</div>}

                            {/* Render details whether string or array */}
                            {typeof details === 'string' && details && (
                              <div className="text-xs text-slate-600 leading-relaxed">{details}</div>
                            )}
                            {Array.isArray(details) && details.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                {details.map((d: string, dIdx: number) => (
                                  <li key={dIdx}>{d}</li>
                                ))}
                              </ul>
                            )}

                            {/* Key Points / Key Details */}
                            {Array.isArray(child.key_points) && child.key_points.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
                                {child.key_points.map((kp: string, kpIdx: number) => (
                                  <li key={kpIdx}>{kp}</li>
                                ))}
                              </ul>
                            )}

                            {Array.isArray(child.key_details) && child.key_details.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
                                {child.key_details.map((kd: string, kdIdx: number) => (
                                  <li key={kdIdx}>{kd}</li>
                                ))}
                              </ul>
                            )}

                            {/* Experiments or Examples */}
                            {Array.isArray(child.experiments_or_examples) && child.experiments_or_examples.length > 0 && (
                              <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1 mt-2">
                                <strong>💡 Activities &amp; Examples:</strong>
                                <ul className="list-disc list-inside space-y-0.5 pt-1">
                                  {child.experiments_or_examples.map((exp: string, eIdx: number) => (
                                    <li key={eIdx}>{exp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Key Terms */}
                            {Array.isArray(child.key_terms) && child.key_terms.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {child.key_terms.map((kt: string, ktIdx: number) => (
                                  <span key={ktIdx} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-800">
                                    {kt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
