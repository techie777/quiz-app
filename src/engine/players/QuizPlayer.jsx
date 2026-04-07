"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSessionEngine } from '@/engine/SessionProvider';
import socketService from '@/engine/lib/socket';

/**
 * TACTICAL PLAYER V2.5 - Persistence Edition
 * Final standings remain even for participants who disconnect or finish first.
 */

export default function QuizPlayer({ state }) {
  const { participants, session: engineSession, sendAction } = useSessionEngine();
  const [countdown, setCountdown] = useState(3);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const questionLimit = state.questionLimit || 10;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`/api/categories/${state.activeContentId}`);
        const allQuestions = res.data.questions || [];
        setQuestions(allQuestions.slice(0, questionLimit));
      } catch (err) {
        console.error('Failed to load mission questions:', err);
        toast.error('Mission Data Corrupted.');
      } finally {
        setLoading(false);
      }
    };
    if (state.activeContentId) fetchContent();
  }, [state.activeContentId, questionLimit]);

  useEffect(() => {
     if (!loading && questions.length > 0 && countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
     } else if (!loading && questions.length > 0 && countdown === 0) {
        setShowQuestions(true);
     }
  }, [countdown, loading, questions]);

  // BROADCAST SCAN: Instant score/progress emission
  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket && engineSession?.userId) {
        socket.emit('SUBMIT_SCORE', {
            sessionId: engineSession.sessionId,
            userId: engineSession.userId,
            score,
            progress: currentIndex + (selectedOption ? 1 : 0)
        });
    }
  }, [score, currentIndex, engineSession, selectedOption]);

  const handleAnswer = (option) => {
    if (selectedOption) return;
    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setFinished(true);
        }
    }, 1500);
  };

  // SCOREBOARD HANDLER: Filters and labels squad clearly
  const scoreboard = useMemo(() => {
     const list = participants.map(p => ({
        ...p,
        isYou: p.userId === engineSession?.userId,
        displayName: (p.userId === engineSession?.userId) ? `${p.userName} (You)` : p.userName,
        isDone: p.progress >= questionLimit
     }));
     
     if (!list.find(p => p.isYou)) {
        list.push({ 
            userName: engineSession?.userName || 'You', 
            displayName: `${engineSession?.userName || 'You'} (You)`,
            score, progress: currentIndex, role: engineSession?.role, isYou: true, isOnline: true 
        });
     }
     return list.sort((a,b) => b.score - a.score);
  }, [participants, engineSession, score, currentIndex, questionLimit]);

  if (loading) return null;

  if (!showQuestions) {
    return (
        <div className="flex flex-col items-center justify-center py-24 space-y-12 animate-in zoom-in duration-500">
             <div className="relative">
                <div className="w-40 h-40 border-[14px] border-indigo-50 border-t-indigo-600 rounded-full animate-bounce"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-indigo-700">{countdown}</div>
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Syncing Tactical Standings...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 📡 HUD: Watch the Squad LIVE */}
      {!finished && (
          <div className="flex bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-2xl border border-slate-700 items-center justify-between gap-6 overflow-x-auto custom-scrollbar-hide h-[80px]">
             <div className="flex items-center gap-8 divide-x divide-slate-700">
                {scoreboard.map(p => (
                   <div key={p.userId || p.userName} className={`flex items-center gap-3 px-6 h-10 transition-all ${p.isYou ? 'scale-110' : 'opacity-80'}`}>
                      <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                         p.role === 'HOST' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                         {p.userName?.[0] || '?'}
                         {p.isOnline === false && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-900 rounded-full" />}
                      </div>
                      <div className="min-w-[90px]">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${p.isYou ? 'text-indigo-400' : 'text-white'}`}>
                            {p.userName.split('_')[0]}
                         </p>
                         <p className="text-[9px] font-bold text-slate-400 whitespace-nowrap">🎯 {p.score} PTS • Q{p.isDone ? questionLimit : (p.progress < 1 ? 0 : p.progress)}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
      )}

      {finished ? (
         <div className="flex flex-col items-center justify-center py-12 space-y-12 animate-in zoom-in duration-700">
             <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Mission Complete</div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Squadron Results</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2 text-center md:text-left">Your Performance</h3>
                    <div className="bg-indigo-600 p-10 rounded-[4rem] border-4 border-indigo-400 text-center shadow-2xl shadow-indigo-200 text-white flex flex-col items-center justify-center space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Success Rate</p>
                        <p className="text-8xl font-black">{Math.round((score / questionLimit) * 100)}%</p>
                        <p className="text-lg font-black">{score} / {questionLimit} OBJECTIVES</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Squadron Standings</h3>
                    <div className="bg-slate-50 rounded-[3rem] border-2 border-slate-100 p-6 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {scoreboard.map((p, i) => (
                            <div key={i} className={`flex items-center justify-between p-5 rounded-[2.5rem] border-2 transition-all ${
                                p.isYou ? 'bg-white border-indigo-600 ring-8 ring-indigo-50 shadow-xl' : 'bg-white border-slate-200'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                                        i === 0 ? 'bg-yellow-400 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">
                                            {p.displayName} 
                                            {p.isOnline === false && <span className="ml-2 text-[8px] text-red-400 uppercase">[OFFLINE]</span>}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.role === 'HOST' ? 'Commander' : 'Participant'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-indigo-700">{p.score}</p>
                                    <p className="text-[9px] font-black text-slate-300 uppercase">PTS</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             {engineSession?.role === 'HOST' && (
                <button 
                  onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })}
                  className="bg-slate-900 border-4 border-slate-700 hover:bg-slate-800 text-white px-12 py-5 rounded-[2rem] font-black text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                   Finalize & Return to Base 🛫
                </button>
             )}
         </div>
      ) : (
         /* ACTIVE MISSION VIEW */
         <div className="space-y-12">
            <div className="flex items-center justify-between gap-6 border-b-4 border-slate-100 pb-10 px-2">
               <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{state.missionName}</h2>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Live Squadron Assessment</p>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-black text-indigo-700 tabular-nums">
                      {currentIndex + 1} <span className="text-slate-300 text-lg">/ {questionLimit}</span>
                  </p>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[3.5rem] border-2 border-slate-200/50 p-8 md:p-16 text-center space-y-12">
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto">
                  {questions[currentIndex]?.text}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {(questions[currentIndex]?.options || []).map((opt, i) => {
                     const isSelected = selectedOption === opt;
                     let btnClass = isSelected 
                        ? (isCorrect ? "bg-green-600 border-green-600 text-white shadow-2xl" : "bg-red-600 border-red-600 text-white shadow-2xl")
                        : "bg-white border-2 border-slate-200 text-slate-900 hover:border-indigo-600 hover:-translate-y-2";
                     
                     return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedOption} 
                          className={`group min-h-[90px] p-7 rounded-[2.5rem] text-left transition-all active:scale-95 flex items-center gap-6 ${btnClass}`}>
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                              {String.fromCharCode(65 + i)}
                           </div>
                           <span className="text-base md:text-lg font-black tracking-tight flex-1">{opt}</span>
                        </button>
                     );
                  })}
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
