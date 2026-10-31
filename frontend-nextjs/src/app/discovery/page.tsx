'use client';

import React from 'react';
import Link from 'next/link';
import { FlaskConical, Play, Image as ImageIcon, GitFork, ArrowRight } from 'lucide-react';

export default function DiscoveryLabPage() {
  const discoveryItems = [
    { title: 'Interactive 16:9 Diagram Hotspot Maps', icon: ImageIcon, count: '48 Diagram Assets', desc: 'Explore percentage-based hotspot maps across English, Hindi, Maths & Science.' },
    { title: 'Interactive Mindmap Concept Trees', icon: GitFork, count: '40 Mindmap Files', desc: 'Hierarchical concept trees rendering chapter themes and relationships.' },
    { title: 'Studio Explainer Video Lessons', icon: Play, count: '52 MP4 Videos', desc: 'High-definition studio lessons explaining Class 5 stories, experiments & math tricks.' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-teal-400" /> Class 5 Discovery Lab
        </h1>
        <p className="text-slate-400 text-sm mt-1">Explore visual diagrams, video lessons, and interactive concept mindmaps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {discoveryItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-teal-300">{item.count}</span>
                <Link
                  href="/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01"
                  className="text-xs font-bold text-teal-400 hover:underline flex items-center gap-1"
                >
                  Explore <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
