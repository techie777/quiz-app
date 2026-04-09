"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSessionEngine } from '@/engine/SessionProvider';
import socketService from '@/engine/lib/socket';

/**
 * TACTICAL PLAYER V3.0 - Timing & Grid Edition
 * Supporting mission timers and optimized for Desktop Sidebar layout.
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

  const [timeLeft, setTimeLeft] = useState(state.timeLimit || 0);

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

  // STATUS TRACKER: Busy/Active state detection
  useEffect(() => {
    const handleVisibility = () => {
        const socket = socketService.getSocket();
        if (socket && engineSession?.userId && engineSession?.sessionId) {
            socket.emit('UPDATE_STATUS', {
                sessionId: engineSession.sessionId,
                userId: engineSession.userId,
                status: document.visibilityState === 'visible' ? 'ACTIVE' : 'BUSY'
            });
        }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [engineSession]);

  // MISSION PULSE: Timer enforcement
  useEffect(() => {
    if (!showQuestions || finished || state.timeLimit === 0 || !!selectedOption) return;

    if (timeLeft <= 0) {
        handleAnswer('TIME_EXPIRED');
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showQuestions, finished, timeLeft, state.timeLimit, selectedOption]);

  // Reset timer on question change
  useEffect(() => {
     if (state.timeLimit > 0) setTimeLeft(state.timeLimit);
  }, [currentIndex, state.timeLimit]);

  const handleAnswer = (option) => {
    if (selectedOption) return;
    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);
    const correct = option === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setFinished(true);
            const socket = socketService.getSocket();
            if (socket && engineSession?.userId) {
                socket.emit('UPDATE_STATUS', {
                    sessionId: engineSession.sessionId,
                    userId: engineSession.userId,
                    status: 'DONE'
                });
            }
        }
    }, 1500);
  };

  const scoreboard = useMemo(() => {
     const list = (participants || []).map(p => ({
        ...p,
        isYou: p?.userId === engineSession?.userId,
        displayName: (p?.userId === engineSession?.userId) ? `${p?.userName || 'Operator'} (You)` : (p?.userName || 'Operator'),
        isDone: (p?.progress >= questionLimit) || p?.status === 'DONE',
        status: p?.status || (p?.isOnline === false ? 'LEFT' : 'ACTIVE')
     }));
     
     if (!list.find(p => p.isYou)) {
        list.push({ 
            userId: engineSession?.userId || 'temp',
            userName: engineSession?.userName || 'You', 
            displayName: `${engineSession?.userName || 'You'} (You)`,
            score, progress: currentIndex, role: engineSession?.role, isYou: true, isOnline: true,
            status: finished ? 'DONE' : 'ACTIVE'
        });
     }
     return list.sort((a,b) => (b.score || 0) - (a.score || 0));
  }, [participants, engineSession, score, currentIndex, questionLimit, finished]);

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

  const StatusBadge = ({ status }) => {
    const colors = {
        ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
        BUSY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        LEFT: 'bg-red-500/10 text-red-400 border-red-500/20',
        DONE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        KICKED: 'bg-red-700/10 text-red-500 border-red-700/20'
    };
    const labels = { ACTIVE: 'Active', BUSY: 'Busy', LEFT: 'Left 💀', DONE: 'Finished', KICKED: 'Kicked Off' };
    const dotColors = { ACTIVE: 'bg-green-500', BUSY: 'bg-orange-500 animate-pulse', LEFT: 'bg-red-600', DONE: 'bg-indigo-500', KICKED: 'bg-red-800' };

    return (
       <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${colors[status] || colors.ACTIVE}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.ACTIVE}`}></span>
          <span className="text-[7px] font-black uppercase tracking-tighter">{labels[status] || 'Active'}</span>
       </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 📡 HUD: Mobile Only */}
      {!finished && (
          <div className="flex lg:hidden bg-slate-900 rounded-3xl p-3 shadow-xl border border-slate-800 items-center gap-4 overflow-x-auto custom-scrollbar-hide h-[80px] w-full max-w-full">
             <div className="flex-shrink-0 bg-indigo-600 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                <p className="text-[7px] font-black text-indigo-200 uppercase tracking-widest">Squadron</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-white">{scoreboard.length}</span>
                   <span className="text-[8px] text-indigo-300 font-bold uppercase">Ops</span>
                </div>
             </div>
             <div className="flex items-center gap-3 pr-4">
                {scoreboard.map(p => (
                   <div key={p.userId || p.userName} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 ${p.isYou ? 'bg-indigo-500/10 border-indigo-500/20' : ''}`}>
                      <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                         p.role === 'HOST' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                         {p.userName?.[0] || '?'}
                         {p.isOnline === false && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full" />}
                      </div>
                      <div className="min-w-[60px]">
                         <p className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[60px] ${p.isYou ? 'text-indigo-400' : 'text-white'}`}>
                            {p.userName.split('_')[0]}
                         </p>
                         <StatusBadge status={p.status} />
                      </div>
                   </div>
                ))}
             </div>
          </div>
      )}

      {finished ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-8 animate-in zoom-in duration-500">
              <div className="text-center space-y-2">
                 <div className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Mission Complete</div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Squadron Results</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                 <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center md:text-left">Your Performance</h3>
                     <div className="bg-indigo-600 p-8 rounded-[3rem] border-2 border-indigo-400 text-center shadow-lg text-white flex flex-col items-center justify-center space-y-2">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Success Rate</p>
                         <p className="text-6xl font-black">{Math.round((score / questionLimit) * 100)}%</p>
                         <p className="text-sm font-black">{score} / {questionLimit} OBJECTIVES</p>
                     </div>
                 </div>
                 <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center md:text-left">Squadron Standings</h3>
                     <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                         {scoreboard.map((p, i) => (
                             <div key={i} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                 p.isYou ? 'bg-white border-indigo-600 shadow-md' : 'bg-white border-slate-100'
                             }`}>
                                 <div className="flex items-center gap-3">
                                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                                         i === 0 ? 'bg-yellow-400 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                                     }`}>{i + 1}</div>
                                     <div>
                                         <p className="text-[11px] font-black text-slate-900 leading-tight">{p.displayName}</p>
                                         <div className="flex items-center gap-1.5 mt-0.5">
                                             <StatusBadge status={p.status} />
                                         </div>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-lg font-black text-indigo-700">{p.score}</p>
                                     <p className="text-[8px] font-black text-slate-300 uppercase">PTS</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
              </div>
              {engineSession?.role === 'HOST' && (
                 <button onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })} className="bg-slate-900 border-2 border-slate-700 hover:bg-black text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">
                    Finalize Mission 🛫
                 </button>
              )}
          </div>
      ) : (
         <div className="space-y-12">
            {state.timeLimit > 0 && (
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${timeLeft < 5 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`} style={{ width: `${(timeLeft / state.timeLimit) * 100}%` }} />
                </div>
            )}
            <div className="flex items-center justify-between gap-6 px-2">
               <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{state.missionName}</h2>
                  <div className="flex items-center gap-3">
                     <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Assessment</p>
                     {state.timeLimit > 0 && (
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2 ${timeLeft < 5 ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'}`}>
                           <span className={timeLeft < 5 ? 'animate-bounce' : ''}>⏳</span>
                           {timeLeft}s REMAINING
                        </div>
                     )}
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-black text-indigo-700 tabular-nums">{currentIndex + 1} <span className="text-slate-200 text-lg">/ {questionLimit}</span></p>
               </div>
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-6 md:p-10 text-center space-y-8">
               <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
                  {questions[currentIndex]?.text}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {(questions[currentIndex]?.options || []).map((opt, i) => {
                     const isSelected = selectedOption === opt;
                     let btnClass = isSelected 
                        ? (isCorrect ? "bg-green-600 border-green-600 text-white shadow-lg" : "bg-red-600 border-red-600 text-white shadow-lg")
                        : "bg-white border border-slate-200 text-slate-900 hover:border-indigo-400 hover:-translate-y-1";
                     return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedOption} className={`group min-h-[70px] p-5 rounded-2xl text-left transition-all active:scale-95 flex items-center gap-4 ${btnClass}`}>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isSelected ? 'bg-white/20' : 'bg-slate-100/50'}`}>{String.fromCharCode(65 + i)}</div>
                           <span className="text-sm md:text-base font-black tracking-tight flex-1">{opt}</span>
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
