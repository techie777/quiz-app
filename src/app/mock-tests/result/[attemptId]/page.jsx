'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MockResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/mock-tests/attempt/${attemptId}`);
        const data = await res.json();
        setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!result || result.error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Result Not Found</h1>
        <p className="text-slate-500 mt-2 max-w-md">The requested report could not be found. Please ensure you are logged in with the correct account.</p>
        <Link href="/mock-tests" className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all">Back to Dashboard</Link>
    </div>
  );

  const accuracy = result.attemptedCount > 0 
    ? ((result.correctCount / result.attemptedCount) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 text-slate-900">
      {/* 🏛️ INSTITUTIONAL HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl font-black italic">QW</div>
              <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
              <div>
                  <h1 className="text-sm font-black text-slate-900 leading-none tracking-tight">NATIONAL TESTING CONSOLE</h1>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic font-mono">Report ID: {result.id.slice(-8).toUpperCase()}</p>
              </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest transition-all active:scale-95"
          >
            <span>📜</span> Generate PDF
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        {/* 🃏 CANDIDATE CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-2xl shadow-slate-200/50 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl pointer-events-none select-none">🏆</div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center text-6xl shadow-inner border-4 border-white">👤</div>
                    <div className="bg-indigo-600 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">Verified</div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Subject Performance Analysis</h2>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-2">
                        {result.paperTitle}
                    </h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60">Session Date: {new Date(result.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                        <div className="px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100">CAT: MOCK</div>
                        <div className="px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100">TIME: {(result.timeLeft/60).toFixed(1)}m LEFT</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 border-[12px] border-slate-100 rounded-full"></div>
                        <div 
                            className="absolute inset-0 border-[12px] border-indigo-600 rounded-full" 
                            style={{ clipPath: `conic-gradient(transparent ${100-accuracy}%, black 0)` }}
                        ></div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900 leading-none">{accuracy}%</span>
                            <span className="text-[7px] font-black text-slate-400 uppercase mt-1">Accuracy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 📊 KPI GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <KPIBox title="Total Score" value={result.score.toFixed(2)} sub={`Out of ${result.totalMarks}`} color="text-indigo-600" bg="bg-indigo-50/30" />
            <KPIBox title="Correct Ans" value={result.correctCount} sub="Questions" color="text-emerald-600" bg="bg-emerald-50/30" />
            <KPIBox title="Incorrect Ans" value={result.wrongCount} sub="Questions" color="text-rose-600" bg="bg-rose-50/30" />
            <KPIBox title="Attempted" value={result.attemptedCount} sub={`Total ${result.totalQuestions}`} color="text-slate-600" bg="bg-slate-50/30" />
        </div>

        {/* 📋 SECTIONAL TABLE (NTA COMPLIANT) */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Sectional Score Summary</h3>
                <span className="text-[8px] font-bold text-slate-400 uppercase italic">Provisional evaluation only</span>
            </div>
            
            <div className="overflow-x-auto p-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">Exam Name</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Correct</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Incorrect</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Attempted</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pl-4">Raw Score</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-900">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-6 pr-4 border-b border-slate-100">{result.paperTitle}</td>
                            <td className="py-6 px-4 text-center border-b border-slate-100 text-emerald-600 underline">+{result.correctCount}</td>
                            <td className="py-6 px-4 text-center border-b border-slate-100 text-rose-500">-{result.wrongCount}</td>
                            <td className="py-6 px-4 text-center border-b border-slate-100">{result.attemptedCount} / {result.totalQuestions}</td>
                            <td className="py-6 pl-4 text-right border-b border-slate-100 text-xl font-black text-indigo-700">{result.score.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {/* 📚 SOLUTIONS SECTION (AUTHENTIC FLOW) */}
        {result.showSolutions && result.questions && result.questions.length > 0 && (
            <div className="space-y-6">
                 <div className="flex items-center gap-4 mb-4">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Digital Question Booklet</h3>
                     <div className="h-px flex-1 bg-slate-200"></div>
                 </div>
                 
                 {result.questions.map((q, idx) => {
                     const isCorrect = q.userAnswer === q.correctAnswer;
                     const isSkipped = q.userAnswer === undefined || q.userAnswer === null;
                     
                     return (
                         <div key={q.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all group">
                             <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase">Q. {idx + 1}</h4>
                                 {isSkipped ? (
                                     <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full border border-slate-200">NOT ANSWERED</span>
                                 ) : isCorrect ? (
                                     <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">ANSWERED CORRECT</span>
                                 ) : (
                                     <span className="text-[8px] font-black text-rose-600 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">WRONG ATTEMPT</span>
                                 )}
                             </div>
                             <div className="p-8">
                                 <p className="text-slate-800 font-bold text-lg mb-8 leading-relaxed max-w-4xl">{q.text}</p>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {(q.options || []).map((opt, i) => {
                                         const isRight = i === q.correctAnswer;
                                         const isYours = i === q.userAnswer;
                                         
                                         return (
                                             <div 
                                                key={i} 
                                                className={`p-5 rounded-2xl border flex items-center justify-between text-sm font-bold ${
                                                    isRight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                                                    isYours && !isCorrect ? 'bg-rose-50 border-rose-200 text-rose-900' :
                                                    'bg-white border-slate-100 text-slate-500 opacity-70'
                                                }`}
                                             >
                                                 <div className="flex items-center gap-3">
                                                     <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[10px]">{i+1}</span>
                                                     {opt}
                                                 </div>
                                                 {isRight && <span className="text-xl">✓</span>}
                                                 {isYours && !isCorrect && <span className="text-xl">✗</span>}
                                             </div>
                                         );
                                     })}
                                 </div>

                                 {q.explanation && (
                                     <div className="mt-8 p-6 bg-slate-900 rounded-[1.5rem] shadow-xl">
                                         <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Logical Feedback:</p>
                                         <p className="text-sm text-slate-300 leading-relaxed font-medium">{q.explanation}</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     );
                 })}
            </div>
        )}

        <div className="mt-24 border-t-4 border-slate-900 pt-10 flex flex-col items-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mb-10">End of Provisional Report Panel</p>
            <div className="flex gap-6">
                <Link href="/mock-tests" className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    Return to Console
                </Link>
                <Link href="/" className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Global Home
                </Link>
            </div>
        </div>
      </main>
    </div>
  );
}

function KPIBox({ title, value, sub, color, bg }) {
    return (
        <div className={`p-8 rounded-[2rem] border border-slate-200 bg-white group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <span className={`text-4xl font-black ${color} tracking-tighter`}>{value}</span>
            <p className="text-[10px] font-bold text-slate-300 mt-1">{sub}</p>
        </div>
    );
}
