'use client';

import React from 'react';
import { StudentNavigation, MobileBottomNavigation } from './StudentNavigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-teal-500 selection:text-slate-950">
      <StudentNavigation />
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNavigation />
    </div>
  );
}
