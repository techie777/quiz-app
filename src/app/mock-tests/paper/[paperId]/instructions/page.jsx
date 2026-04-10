"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "@/styles/MockEngine.module.css";

export default function MockInstructions() {
  const { paperId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    async function fetchPaper() {
      try {
        const res = await fetch(`/api/mock-tests/paper/${paperId}`);
        const data = await res.json();
        if (data && !data.error) setPaper(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPaper();
  }, [paperId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!paper) return <div>Paper not found.</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800">
      {/* 🏛️ HEADER (TCS STYLE) */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-indigo-600 tracking-tighter">QuizWeb!</span>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <h2 className="text-[13px] font-bold text-slate-500 truncate max-w-[400px]">
            {paper.title}
          </h2>
        </div>
        <div className="flex items-center gap-4">
           {/* Placeholder for any top-right actions */}
        </div>
      </header>

      {/* 📝 MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: INSTRUCTIONS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 inline-block mb-6">General Instructions:</h1>
            
            <div className="space-y-6 text-[14px] leading-relaxed text-slate-700">
              <section>
                <p className="font-bold">1. Digital Clock Calibration:</p>
                <p>The clock will be set at the server. The countdown timer at the top right corner of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.</p>
              </section>

              <section>
                <p className="font-bold">2. Question Palette Status:</p>
                <p>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ml-4">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-sm border border-slate-300 flex items-center justify-center text-[10px] bg-white">1</div>
                        <p className="text-[12px]">You have not visited the question yet.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] bg-red-500 text-white">2</div>
                        <p className="text-[12px]">You have not answered the question.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] bg-green-500 text-white">3</div>
                        <p className="text-[12px]">You have answered the question.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[50%] flex items-center justify-center text-[10px] bg-indigo-500 text-white">4</div>
                        <p className="text-[12px]">You have NOT answered the question, but have marked the question for review.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[50%] flex items-center justify-center text-[10px] bg-indigo-500 text-white relative">
                            5
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                        </div>
                        <p className="text-[12px]">You have answered the question, but marked it for review.</p>
                    </div>
                </div>
              </section>

              <section>
                <p className="font-bold">3. Navigation & Answering:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>To answer a question, click on the question number in the Question Palette to go to that question directly.</li>
                  <li>Click on <b>Save & Next</b> to save your answer for the current question and then go to the next question.</li>
                  <li>Click on <b>Mark for Review & Next</b> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                </ul>
              </section>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-10">
                <p className="text-[12px] text-amber-800 font-bold mb-1 italic">Important Note:</p>
                <p className="text-[11px] text-amber-900 leading-normal">
                  The &apos;Mark for Review&apos; status for a question simply indicates that you would like to look at that question again. If a question is answered and marked for review, your answer will be considered for evaluation unless the status is modified by you during the examination.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PROFILE SIDEBAR */}
        <div className="hidden md:flex w-72 border-l border-slate-200 bg-slate-50/50 flex-col items-center p-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                {session?.user?.image ? (
                    <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-4xl">👤</div>
                )}
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center uppercase tracking-wider">
                {session?.user?.name || "Candidate Registration"}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {session?.user?.email?.split('@')[0] || "MOCK-USER"}</p>
        </div>
      </div>

      {/* 🚀 BOTTOM BAR (ACTIONS) */}
      <footer className="h-auto md:h-16 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-0 sticky bottom-0 z-50 gap-4 md:gap-0">
        <Link 
            href={`/mock-tests/${paper.examId}`}
            className="text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:underline"
        >
            ← Back to Tests
        </Link>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="flex items-center justify-between md:justify-start gap-6 md:gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">View In:</span>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 ring-indigo-500/20"
                    >
                        <option>English</option>
                        <option>Hindi</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="declare" 
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="declare" className="text-[10px] font-bold text-slate-600 cursor-pointer">
                        I have read and understood
                    </label>
                </div>
            </div>

            <button 
                onClick={() => router.push(`/mock-tests/paper/${paperId}/test?lang=${language}`)}
                disabled={!agreed}
                className={`w-full md:w-auto px-10 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                    agreed 
                    ? 'bg-sky-500 text-white shadow-lg hover:bg-sky-400 hover:shadow-sky-100' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
                I am ready to begin
            </button>
        </div>
      </footer>
    </div>
  );
}
