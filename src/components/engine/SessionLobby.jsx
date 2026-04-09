"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import toast from 'react-hot-toast';
import axios from 'axios';

/**
 * MISSION CONTROL V2.5 - Security Guard Update
 * Filtered self from active squadron list and fixed kick logic synchronization.
 */

// Web Audio API Synthesizer for Tactical UI Sounds
const playAudioAlert = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (type === 'new_request') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'approved') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            // sustain slightly
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {}
};

export default function SessionLobby({ sessionId, isHost }) {
  const { participants, pendingParticipants, session, sendAction } = useSessionEngine();
  const [mounted, setMounted] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  
  // Mission Params
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prevPendingCount, setPrevPendingCount] = useState(0);

  // Tactical Audio Alert for New Guests
  useEffect(() => {
     if (isHost && pendingParticipants.length > prevPendingCount) {
         playAudioAlert('new_request');
     }
     setPrevPendingCount(pendingParticipants.length);
  }, [pendingParticipants.length, isHost, prevPendingCount]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setInviteUrl(`${window.location.origin}/live/${sessionId}`);
    }

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories?limit=100');
            setCategories(res.data.categories || []);
        } catch (err) {
            console.error('Failed to load mission data:', err);
            toast.error('Mission Library desynced.');
        } finally {
            setLoading(false);
        }
    };
    if (isHost && session?.status !== 'REJECTED') fetchCategories();
  }, [sessionId, isHost, session?.status]);

  useEffect(() => {
      if (selectedCategory) {
          const total = selectedCategory.questionCount || 10;
          if (maxQuestions > total) setMaxQuestions(total);
      }
  }, [selectedCategory]);

  const filteredCategories = useMemo(() => {
    const list = categories.length > 0 ? categories : [];
    if (!search) return list.slice(0, 12);
    return list.filter(c => {
        const title = (c?.topic || c?.name || '').toLowerCase();
        const q = search.toLowerCase();
        return title.includes(q);
    }).slice(0, 12);
  }, [categories, search]);

  // SQUADRON RECON: Filter out current user from the list to avoid self-kicking
  const squadMembers = useMemo(() => {
     return (participants || []).filter(p => p?.userId !== session?.userId);
  }, [participants, session?.userId]);

  const [timeLimit, setTimeLimit] = useState(0); // 0 = unlimited

  const handleStart = () => {
    if (!selectedCategory) {
      toast.error('Commander, select a Mission Profile first!');
      return;
    }
    sendAction('START_SESSION', { 
      status: 'ACTIVE', 
      type: 'QUIZ', 
      activeContentId: selectedCategory?.id,
      missionName: selectedCategory?.topic || selectedCategory?.name,
      questionLimit: maxQuestions,
      timeLimit: timeLimit
    });
  };

  if (!mounted) return null;

  // GUEST STATUS VIEWS
  if (!isHost && session?.status === 'PENDING') {
      return (
          <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl p-16 text-center space-y-10">
               <div className="relative inline-block">
                  <div className="w-32 h-32 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">💂</div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Clearance Pending</h2>
                  <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto">
                     Uplink secure. Standing by for **Commander {sessionId}** to authorize entry.
                  </p>
               </div>
          </div>
      );
  }

  if (!isHost && (session?.status === 'REJECTED' || session?.status === 'KICKED')) {
      return (
          <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl p-16 text-center space-y-8">
               <div className="text-8xl">🚫</div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Mission Terminated</h2>
                  <p className="text-sm font-bold text-slate-500">You have been dismissed from the squadron or denied clearance.</p>
               </div>
               <button onClick={() => window.location.href = '/'} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Return to Base</button>
          </div>
      );
  }

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-4 sm:p-14 space-y-8 sm:space-y-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 border-b-2 border-slate-50 pb-6 sm:pb-12">
        <div className="text-center md:text-left">
           <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">Mission Control</h2>
           <p className="text-[11px] font-black text-slate-400 mt-2 tracking-widest uppercase">Room Protocol: <span className="text-indigo-600 font-black">{sessionId}</span></p>
        </div>
        {isHost && (
            <div className="w-full max-w-sm space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Join Link</label>
                <div className="flex bg-slate-100 p-2 rounded-2xl">
                    <input readOnly value={inviteUrl} className="flex-1 bg-transparent px-4 text-[10px] font-bold text-slate-500" />
                    <button onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success('Link Secured.'); }} className="bg-white text-indigo-600 font-black text-[10px] px-4 py-2 rounded-xl shadow-sm">Copy</button>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          
          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-8 sm:space-y-10">
              
              {/* 1. SECURITY STATUS (Always visible for host) */}
              {isHost && (
                  <div className="p-4 sm:p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Command Link Active</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-400">{(pendingParticipants || []).length} Waiting</span>
                  </div>
              )}

              {/* 2. PENDING CLEARANCES (Host Only) */}
              {isHost && (pendingParticipants || []).length > 0 && (
                  <div className="space-y-6">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Pending Admission ({(pendingParticipants || []).length})</label>
                    <div className="space-y-3">
                        {(pendingParticipants || []).map(p => (
                            <div key={p?.userId || Math.random()} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border-2 border-red-100">
                                <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">{p?.userName}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { playAudioAlert('approved'); sendAction('APPROVE_GUEST', { userId: p?.userId }); }} className="w-8 h-8 bg-green-500 text-white rounded-lg font-black transition-all hover:scale-110">✓</button>
                                    <button onClick={() => sendAction('REJECT_GUEST', { userId: p?.userId })} className="w-8 h-8 bg-red-500 text-white rounded-lg font-black transition-all hover:scale-110">×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              )}

              {/* ACTIVE */}
              <div className="space-y-4 sm:space-y-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Active Squadron</label>
                  <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-600 shadow-xl shadow-indigo-50">
                         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-sm">H</div>
                         <div><p className="text-xs font-black text-slate-900 uppercase">Commander (You)</p></div>
                      </div>

                      {squadMembers.map(p => (
                        <div key={p.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-400">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black uppercase">{p.userName?.[0]}</div>
                               <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{p.userName}</span>
                           </div>
                           {isHost && (
                               <button 
                                 onClick={() => sendAction('KICK_PARTICIPANT', { userId: p.userId })}
                                 className="text-red-400 hover:text-red-600 transition-all font-black text-[10px] px-2 opacity-0 group-hover:opacity-100 uppercase"
                               >Dismiss</button>
                           )}
                        </div>
                      ))}

                      {squadMembers.length === 0 && (
                          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-30 grayscale">
                              <p className="text-[10px] font-black uppercase tracking-widest">Waiting for squad...</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* MAIN */}
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/30 rounded-3xl sm:rounded-[3rem] border border-slate-100 p-5 sm:p-8 md:p-12">
            {isHost ? (
               <div className="flex flex-col h-full space-y-6 sm:space-y-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 px-1">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">Tactical Library</h3>
                      <input 
                        placeholder="SEARCH..." 
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-[240px] bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest focus:border-indigo-600 outline-none" 
                      />
                  </div>

                  <div className="flex-1 min-h-[250px] max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-2 custom-scrollbar">
                        {loading ? <div className="p-10 text-center col-span-full text-slate-400 font-bold uppercase animate-pulse">Scanning Protocols...</div> : 
                          filteredCategories.map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c)} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedCategory?.id === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[0.98]' : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-400'}`}>
                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl ${selectedCategory?.id === c.id ? 'bg-indigo-500' : 'bg-slate-50'}`}>{c.emoji || '🎒'}</div>
                                <div className="text-left truncate">
                                    <p className="text-[10px] font-black uppercase tracking-tight truncate">{c.topic || c.name}</p>
                                    <p className={`text-[8px] font-bold mt-0.5 opacity-70`}>{c.questionCount} Qs</p>
                                </div>
                            </button>
                        ))}
                  </div>

                  <div className="space-y-4">
                      {selectedCategory && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                  <div className="flex flex-col text-left">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-900">Objectives</span>
                                      <span className="text-[8px] font-bold text-indigo-500 uppercase">Max: {selectedCategory.questionCount || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-indigo-50">
                                      <button onClick={() => setMaxQuestions(Math.max(1, maxQuestions - 1))} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 font-black">-</button>
                                      <input 
                                         value={maxQuestions} 
                                         onChange={(e) => {
                                             let val = parseInt(e.target.value);
                                             if (isNaN(val)) val = 1;
                                             setMaxQuestions(Math.min(selectedCategory.questionCount || 10, Math.max(1, val)));
                                         }}
                                         className="text-xs font-black w-6 text-center text-slate-800 bg-transparent outline-none"
                                      />
                                      <button onClick={() => setMaxQuestions(Math.min(selectedCategory.questionCount || 10, maxQuestions + 1))} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 font-black">+</button>
                                  </div>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-2xl border border-slate-700">
                                  <div className="flex flex-col text-left">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Tactical Timer</span>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase">{timeLimit === 0 ? 'Off' : `${timeLimit}s/Q`}</span>
                                  </div>
                                  <select 
                                    value={timeLimit} 
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                    className="bg-slate-800 text-white text-[9px] font-black px-2 py-1.5 rounded-xl outline-none border border-slate-700 cursor-pointer appearance-none text-center min-w-[70px]"
                                  >
                                      <option value={0}>OFF</option>
                                      <option value={15}>15s</option>
                                      <option value={30}>30s</option>
                                      <option value={60}>60s</option>
                                  </select>
                              </div>
                          </div>
                      )}

                      <button 
                        onClick={handleStart} disabled={!selectedCategory}
                        className={`w-full py-4 rounded-2xl text-base font-black tracking-widest transition-all ${selectedCategory ? 'bg-slate-900 text-white hover:bg-black shadow-lg' : 'bg-slate-100 text-slate-300'}`}
                      >READY FOR LAUNCH 🚀</button>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-pulse">
                    <span className="text-6xl">📡</span>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase">Uplink Confirmed</h3>
                        <p className="text-[11px] font-bold text-slate-500 mt-3 tracking-[0.2em] uppercase leading-relaxed">Standing by for mission selection...</p>
                    </div>
                </div>
            )}
          </div>

      </div>

    </div>
  );
}
