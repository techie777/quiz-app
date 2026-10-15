'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">कुछ गलत हो गया (Something went wrong)</h2>
        <p className="text-sm text-slate-600 mb-6">
          {error?.message || 'एप्लिकेशन लोड करने में समस्या आई है। कृपया पुनः प्रयास करें।'}
        </p>
        {error?.stack && (
          <pre className="text-[11px] text-left text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap mb-4">
            {error.stack}
          </pre>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-150 cursor-pointer"
          >
            पुनः प्रयास करें (Retry)
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition-all duration-150"
          >
            होमपेज (Home)
          </Link>
        </div>
      </div>
    </div>
  );
}
