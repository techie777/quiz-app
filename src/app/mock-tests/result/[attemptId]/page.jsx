"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "@/styles/LandingPage.module.css";

export default function MockResultView() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/mock-tests/attempt/${attemptId}`);
        const data = await res.json();
        if (data && !data.error) setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!result) return <div>Result not found.</div>;

  const percentage = Math.round((result.score / result.totalMarks) * 100);

  return (
    <main className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <section className={styles.container}>
        <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Performance <span className="text-indigo-600">Report</span></h1>
            <p className="text-slate-500 mt-2 font-bold">{result.paperTitle} • {result.examName}</p>
        </div>

        {/* 🏆 SCORE CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                        <circle 
                            cx="80" cy="80" r="70" fill="transparent" stroke="#4f46e5" strokeWidth="12" 
                            strokeDasharray={440} 
                            strokeDashoffset={440 - (440 * Math.max(0, percentage)) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-900">{percentage}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Score</span>
                    </div>
                </div>
                <h2 className="text-4xl font-black text-indigo-600 mb-1">{result.score.toFixed(2)}</h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Out of {result.totalMarks} Marks</p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Correct', val: result.correctCount, color: 'text-green-500', bg: 'bg-green-50', icon: '✅' },
                    { label: 'Incorrect', val: result.wrongCount, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
                    { label: 'Skipped', val: result.totalQuestions - result.attemptedCount, color: 'text-slate-400', bg: 'bg-slate-100', icon: '⚪' },
                    { label: 'Attempted', val: result.attemptedCount, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🎯' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <span className="text-2xl mb-2">{stat.icon}</span>
                        <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
                    </div>
                ))}
                
                <div className="col-span-2 md:col-span-4 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status Summary</p>
                        <h3 className="text-lg font-bold">You performed better than 65% of candidates this week.</h3>
                    </div>
                    <Link href="/mock-tests" className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all">
                        Back to Hub
                    </Link>
                </div>
            </div>
        </div>

        {/* 📋 DETAILED SOLUTIONS (CONDITIONAL) */}
        {result.showSolutions ? (
            <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8 border-b-2 border-slate-900 inline-block">Detailed Analysis</h3>
                {result.questions.map((q, i) => {
                    const isCorrect = q.userAnswer === q.correctAnswer;
                    const isSkipped = q.userAnswer === undefined;

                    return (
                        <div key={q.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-2 h-full ${isSkipped ? 'bg-slate-200' : isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                            
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Question {i + 1}</span>
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${isSkipped ? 'bg-slate-50 text-slate-400' : isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {isSkipped ? 'SKIPPED' : isCorrect ? 'CORRECT' : 'INCORRECT'}
                                </span>
                            </div>

                            <p className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                                {q.text}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className={`px-5 py-3 rounded-xl border text-sm font-bold flex items-center justify-between ${
                                        optIdx === q.correctAnswer 
                                        ? 'bg-green-50 border-green-200 text-green-700' 
                                        : optIdx === q.userAnswer
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-white border-slate-100 text-slate-500'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-black">
                                                {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            {opt}
                                        </div>
                                        {optIdx === q.correctAnswer && <span>✔️</span>}
                                        {optIdx === q.userAnswer && !isCorrect && <span>✖️</span>}
                                    </div>
                                ))}
                            </div>

                            {(q.explanation || q.explanationHi) && (
                                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 mt-4">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Technical Explanation:</p>
                                    <p className="text-[13px] text-slate-600 leading-relaxed italic">{q.explanation || "No written explanation provided for this question."}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xl max-w-2xl mx-auto">
                <span className="text-4xl mb-4 block">🔒</span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Solutions Restricted</h3>
                <p className="text-slate-500">Detailed explanations for this paper have been restricted by the administrator.</p>
            </div>
        )}
      </section>

      <div className="h-20" />
    </main>
  );
}
