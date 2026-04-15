"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';
import axios from 'axios';

/**
 * MISSION CONTROL V3.0 - Desktop Evolution
 * Expanded layout for high-resolution screens and improved readability.
 */

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
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'approved') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {}
};

export default function SessionLobby({ sessionId, isHost, onApproveGuest, onDenyGuest }) {
  const { participants, pendingParticipants, session, sendAction, syncSquad } = useSessionEngine();
  const [mounted, setMounted] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  // Polling heartbeat for mission commander
  useEffect(() => {
    if (isHost && sessionId) {
       console.log('📡 [HEARTBEAT] Initiating Squad Pulse...');
       const interval = setInterval(() => {
          syncSquad();
       }, 10000); // 10s heartbeat
       return () => clearInterval(interval);
    }
  }, [isHost, sessionId, syncSquad]);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);

  useEffect(() => {
     console.log('📡 [LOBBY] Pending Count:', pendingParticipants.length, 'Prev:', prevPendingCount);
     if (isHost && pendingParticipants.length > prevPendingCount) {
         // Toast for EACH new request
         const newRequests = pendingParticipants.slice(prevPendingCount);
         newRequests.forEach(guest => {
             if (guest?.userName) {
                 playAudioAlert('new_request');
                 toast(`💂 ${guest.userName} requesting clearance!`, { icon: '📑' });
             }
         });
     }
     setPrevPendingCount(pendingParticipants.length);
  }, [pendingParticipants, isHost, prevPendingCount]);

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
            toast.error('Mission Library desynced.');
        } finally {
            setLoading(false);
        }
    };
    if (isHost) fetchCategories();
  }, [sessionId, isHost]);

  const filteredCategories = useMemo(() => {
    const list = categories.length > 0 ? categories : [];
    if (!search) return list.slice(0, 16);
    return list.filter(c => (c?.topic || c?.name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 16);
  }, [categories, search]);

  const squadMembers = useMemo(() => {
     return (participants || []).filter(p => p?.userId !== session?.userId);
  }, [participants, session?.userId]);

  const handleStart = () => {
    if (!selectedCategory) return toast.error('Commander, select a Mission Profile!');
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

  // Pending Approval View
  if (!isHost && session?.status === 'PENDING') {
      return (
          <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8">
               <div className="relative inline-block">
                  <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">💂</div>
               </div>
               <div className="space-y-6">
                  <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Clearance Pending</h2>
                  <p className="text-lg font-bold text-slate-500 max-w-lg mx-auto leading-relaxed">
                     Uplink secure. Standing by for **Commander {sessionId}** to authorize your entry into the Squadron.
                  </p>
               </div>
          </div>
      );
  }

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col p-6 sm:p-8 space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-50 pb-6">
        <div className="text-center md:text-left">
           {isHost && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Uplink Active</span>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                   Uplink Synchronized
                </div>
              </div>
            )}
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
               Mission Control
               <button 
                 onClick={() => { 
                   socketService.getSocket()?.emit('FORCE_ROOM_SYNC', { sessionId });
                   toast.success('Authoritative squadron re-sync initiated.'); 
                 }} 
                 className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 hover:rotate-180 transition-all duration-500"
                 title="Authoritative Room Sync"
               >
                 <span className="text-xs">🔄</span>
               </button>
            </h2>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Protocol Alpha: <span className="text-indigo-600 font-mono font-bold">{sessionId}</span></p>
         </div>
        {isHost && (
            <div className="w-full max-w-lg space-y-4">
                <div className="flex items-center justify-between pl-1">
                    <label className="text-sm font-black uppercase text-slate-400 tracking-widest">Live quiz link</label>
                    <button 
                      onClick={() => { if(window.confirm('ABORT MISSION? This will terminate the live room for everyone.')) sendAction('TERMINATE', { status: 'LOBBY' }); }}
                      className="text-[10px] font-black text-red-500 hover:text-red-700 transition-all uppercase tracking-widest border-b border-red-200"
                    >
                      Terminate Room 🛑
                    </button>
                </div>
                { (isHost || useSessionEngine().sessionReady) ? (
                    <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200 animate-in slide-in-from-right-4 duration-500">
                        <input readOnly value={inviteUrl} className="flex-1 bg-transparent px-6 text-sm font-bold text-slate-600 outline-none" />
                        <button onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success('Link Secured.'); }} className="bg-white text-indigo-600 font-extrabold text-sm px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-all">COPY LINK</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 animate-pulse">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating live quiz link...</span>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* SQUADRON SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Active Squadron</label>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[8px] font-black">
                        {(participants.length === 0 && isHost) ? 1 : participants.length} OPS
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                      {/* HOST CARD */}
                      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-indigo-600 shadow-md relative overflow-hidden group">
                         <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-600 text-white text-[7px] font-black uppercase tracking-tighter">Commander</div>
                         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-black">H</div>
                         <div>
                            <p className="text-sm font-black text-slate-900 uppercase">You</p>
                            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Base Operator</p>
                         </div>
                      </div>

                      {/* GUEST CARDS */}
                      {squadMembers.map(p => (
                        <div key={p.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-400 hover:bg-white">
                           <div className="flex items-center gap-3">
                               <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black uppercase">{p.userName?.[0]}</div>
                               <span className="text-sm font-extrabold text-slate-700 truncate max-w-[150px]">{p.userName}</span>
                           </div>
                           {isHost && (
                               <button onClick={() => sendAction('KICK_PARTICIPANT', { userId: p.userId })} className="text-red-400 hover:text-red-600 transition-all font-black text-[10px] px-2 opacity-0 group-hover:opacity-100 uppercase italic">Dismiss</button>
                           )}
                        </div>
                      ))}

                      {squadMembers.length === 0 && (
                          <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] opacity-40">
                              <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-300">Waiting for Squad...</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* PENDING APPROVALS (Host Only) */}
              {isHost && pendingParticipants.length > 0 && (
                <div className="bg-white rounded-3xl border border-indigo-200 shadow-lg p-8 space-y-4 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter">Mission Clearance Required</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Awaiting Authorization</p>
                        </div>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                            {pendingParticipants.length} NEW
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {pendingParticipants.map((guest) => (
                            <div key={guest.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all uppercase">
                                       {guest.userName.substring(0, 1)}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{guest.userName}</div>
                                        <div className="text-[10px] font-bold text-slate-400">UNAUTHORIZED GUEST</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onDenyGuest(guest.userId)} className="p-3 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all">
                                        ×
                                    </button>
                                    <button onClick={() => { playAudioAlert('approved'); onApproveGuest(guest.userId); }} className="p-3 bg-white text-green-500 hover:text-green-700 hover:bg-green-50 border border-green-100 rounded-xl shadow-sm transition-all group-hover:scale-110">
                                        ✓
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              )}
          </div>

          {/* MISSION SELECTION MAIN HUB */}
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/50 rounded-3xl border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
            {isHost ? (
               <div className="flex flex-col h-full space-y-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Quiz topics</h3>
                      <div className="relative w-full sm:max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
                        <input 
                            placeholder="Search quiz topic" 
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:border-indigo-600 outline-none shadow-sm transition-all" 
                        />
                      </div>
                  </div>

                  <div className="flex-1 min-h-[500px] max-h-[700px] overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pr-4 custom-scrollbar">
                        {loading ? <div className="p-20 text-center col-span-full text-slate-400 font-extrabold uppercase animate-pulse tracking-widest">Loading Quiz Data...</div> : 
                          filteredCategories.map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c)} className={`flex items-center gap-6 p-4 rounded-3xl border-4 transition-all group ${selectedCategory?.id === c.id ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xl scale-105' : 'bg-white border-white text-slate-900 hover:border-indigo-200'}`}>
                                <div className={`w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center text-5xl shadow-md group-hover:rotate-6 transition-transform ${selectedCategory?.id === c.id ? 'bg-indigo-500' : 'bg-slate-50'}`}>{c.emoji || '🎒'}</div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-black uppercase tracking-tight">{c.topic || c.name}</p>
                                    <p className="text-[11px] font-bold opacity-60 tracking-widest">{c.questionCount} ASSESSMENTS</p>
                                </div>
                            </button>
                        ))}
                  </div>

                  {/* ACTION BAR */}
                  <div className="space-y-8 mt-auto">
                      {selectedCategory && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                                  <div className="space-y-1">
                                      <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900 block">Assessment Density</span>
                                      <span className="text-xs font-bold text-indigo-400 uppercase">Available Units: {selectedCategory.questionCount}</span>
                                  </div>
                                  <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-inner border border-indigo-100">
                                      <button onClick={() => setMaxQuestions(prev => Math.max(1, prev - 1))} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-200 font-black text-lg">-</button>
                                      <span className="text-lg font-black w-8 text-center text-slate-900">{maxQuestions}</span>
                                      <button onClick={() => setMaxQuestions(prev => Math.min(selectedCategory.questionCount || 100, prev + 1))} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-200 font-black text-lg">+</button>
                                  </div>
                              </div>
                                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border-2 border-slate-800">
                                  <div className="space-y-1">
                                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">Tactical Timer</span>
                                      <span className="text-xs font-bold text-slate-600 uppercase">Per Interaction</span>
                                  </div>
                                  <select 
                                    value={timeLimit} 
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                    className="bg-slate-800 text-white text-xs font-black px-4 py-3 rounded-xl outline-none border border-slate-700 cursor-pointer appearance-none text-center min-w-[100px] hover:bg-slate-750"
                                  >
                                      <option value={0}>OFF</option>
                                      <option value={15}>15 SEC</option>
                                      <option value={30}>30 SEC</option>
                                      <option value={60}>60 SEC</option>
                                  </select>
                              </div>
                          </div>
                      )}

                      <button 
                        onClick={handleStart} disabled={!selectedCategory}
                        className={`w-full py-5 rounded-2xl text-lg font-black tracking-[0.4em] transition-all transform active:scale-95 ${selectedCategory ? 'bg-slate-900 text-white hover:bg-black shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-slate-100 text-slate-300'}`}
                      >INITIATE MISSION 🚀</button>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-12 py-20">
                    <div className="relative">
                        <div className="w-48 h-48 bg-indigo-50 rounded-full animate-pulse absolute -inset-4 blur-2xl opacity-50"></div>
                        <span className="text-9xl relative">📡</span>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Uplink Confirmed</h3>
                        <p className="text-base font-bold text-slate-500 max-w-md mx-auto leading-relaxed tracking-widest uppercase">
                            Secure command link established. Standing by for **Commander {sessionId}** to select mission parameters...
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => <div key={i} className={`w-3 h-3 rounded-full bg-indigo-600 animate-bounce delay-${i*150}`}></div>)}
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
