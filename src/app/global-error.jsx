'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="hi">
      <body className="bg-slate-50 min-h-screen flex items-center justify-center p-4 font-sans antialiased text-slate-800">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">सिस्टम त्रुटि (System Error)</h2>
          <p className="text-sm text-slate-600 mb-6">
            {error?.message || 'सिस्टम में तकनीकी समस्या उत्पन्न हुई है।'}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-150 cursor-pointer"
          >
            पुनः प्रयास करें (Reload)
          </button>
        </div>
      </body>
    </html>
  );
}
