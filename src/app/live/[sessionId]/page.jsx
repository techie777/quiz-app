"use client";

import React from 'react';
import { SessionProvider } from '@/engine/SessionProvider';
import SessionManager from '@/engine/SessionManager';
import { AdminProvider } from '@/context/AdminContext';

export default function LiveSessionPage({ params }) {
  const { sessionId } = params;

  return (
    <AdminProvider>
      <SessionProvider sessionId={sessionId}>
        {/* 
            Standard constrained container with Tailwind as requested:
            max-w-4xl mx-auto px-4 py-10
        */}
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[1700px] space-y-8 animate-in fade-in zoom-in duration-500">
             <SessionManager sessionId={sessionId} />
          </div>
        </div>
      </SessionProvider>
    </AdminProvider>
  );
}
