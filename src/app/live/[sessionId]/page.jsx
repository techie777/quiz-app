"use client";

import React, { Suspense } from 'react';
import { SessionProvider } from '@/engine/SessionProvider';
import SessionManager from '@/engine/SessionManager';
import { AdminProvider } from '@/context/AdminContext';

export default function LiveSessionPage({ params }) {
  const { sessionId } = params;

  return (
    <AdminProvider>
      <Suspense fallback={<div className="flex items-center justify-center p-40 animate-pulse text-slate-300">📡 Loading Mission...</div>}>
        <SessionProvider sessionId={sessionId}>
          <div className="min-h-[80vh] flex flex-col items-center justify-center pt-28 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-[1700px] space-y-8 animate-in fade-in zoom-in duration-500">
               <SessionManager sessionId={sessionId} />
            </div>
          </div>
        </SessionProvider>
      </Suspense>
    </AdminProvider>
  );
}
