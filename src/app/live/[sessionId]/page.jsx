"use client";

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SessionProvider } from '@/engine/SessionProvider';
import SessionManager from '@/engine/SessionManager';
import { AdminProvider } from '@/context/AdminContext';

import { useUI } from '@/context/UIContext';

export default function LiveSessionPage({ params: propsParams }) {
  const routerParams = useParams();
  const sessionId = routerParams?.sessionId || propsParams?.sessionId;
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

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-500 font-bold space-y-3">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">📡 परीक्षा कक्ष तैयार हो रहा है...</p>
      </div>
    );
  }

  const isB2B = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('b2b') === 'true' || 
    new URLSearchParams(window.location.search).get('role') === 'student' ||
    (typeof sessionId === 'string' && sessionId.includes('-')) ||
    (typeof localStorage !== 'undefined' && !!localStorage.getItem(`b2b_student_roll_${sessionId}`)) ||
    (typeof localStorage !== 'undefined' && !!localStorage.getItem(`b2b_student_name_${sessionId}`))
  );

  if (isB2B) {
    return (
      <AdminProvider>
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500 font-bold">📡 परीक्षा लोड हो रही है...</div>}>
          <SessionProvider sessionId={sessionId}>
            <div className="min-h-screen bg-slate-50 text-slate-800 pt-3 sm:pt-6 pb-16 px-2 sm:px-6">
              <SessionManager sessionId={sessionId} />
            </div>
          </SessionProvider>
        </Suspense>
      </AdminProvider>
    );
  }

  return (
    <AdminProvider>
      <Suspense fallback={<div className="flex items-center justify-center p-40 animate-pulse text-slate-300">📡 Loading Mission...</div>}>
        <SessionProvider sessionId={sessionId}>
          <div className={`min-h-screen flex flex-col items-center justify-start pt-4 sm:pt-8 pb-12 px-3 sm:px-6 lg:px-8 transition-colors duration-500 overflow-x-hidden ${patternClasses[engineTheme] || "theme-pattern"} ${engineTheme === 'midnight' ? 'midnight-pattern' : ''} ${themeClasses[engineTheme] || themeClasses.indigo}`}>
            <div className="w-full max-w-[1700px] space-y-6 sm:space-y-8 animate-in fade-in duration-500 min-w-0">
               <SessionManager sessionId={sessionId} />
            </div>
          </div>
        </SessionProvider>
      </Suspense>
    </AdminProvider>
  );
}
