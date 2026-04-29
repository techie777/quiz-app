"use client";

import React, { Suspense } from 'react';
import { SessionProvider } from '@/engine/SessionProvider';
import SessionManager from '@/engine/SessionManager';
import { AdminProvider } from '@/context/AdminContext';

import { useUI } from '@/context/UIContext';

export default function LiveSessionPage({ params }) {
  const { sessionId } = params;
  const { engineTheme } = useUI();

  const themeClasses = {
    indigo: "bg-slate-50",
    midnight: "bg-slate-900",
    sunset: "bg-rose-50",
    emerald: "bg-emerald-50",
  };

  const patternClasses = {
    indigo: "theme-pattern",
    midnight: "space-pattern",
    sunset: "doodle-pattern",
    emerald: "doodle-pattern",
  };

  return (
    <AdminProvider>
      <Suspense fallback={<div className="flex items-center justify-center p-40 animate-pulse text-slate-300">📡 Loading Mission...</div>}>
        <SessionProvider sessionId={sessionId}>
          <div className={`min-h-screen flex flex-col items-center justify-start pt-28 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${patternClasses[engineTheme] || "theme-pattern"} ${engineTheme === 'midnight' ? 'midnight-pattern' : ''} ${themeClasses[engineTheme] || themeClasses.indigo}`}>
            <div className="w-full max-w-[1700px] space-y-8 animate-in fade-in duration-500">
               <SessionManager sessionId={sessionId} />
            </div>
          </div>
        </SessionProvider>
      </Suspense>
    </AdminProvider>
  );
}
