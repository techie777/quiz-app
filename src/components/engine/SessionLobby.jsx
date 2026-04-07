"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import toast from 'react-hot-toast';
import axios from 'axios';

/**
 * MISSION CONTROL V2.5 - Security Guard Update
 * Filtered self from active squadron list and fixed kick logic synchronization.
 */

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
        const title = (c.topic || c.name || '').toLowerCase();
        const q = search.toLowerCase();
        return title.includes(q);
    }).slice(0, 12);
  }, [categories, search]);

  // SQUADRON RECON: Filter out current user from the list to avoid self-kicking
  const squadMembers = useMemo(() => {
     return participants.filter(p => p.userId !== session?.userId);
  }, [participants, session?.userId]);

  const handleStart = () => {
    if (!selectedCategory) {
      toast.error('Commander, select a Mission Profile first!');
      return;
    }
    sendAction('START_SESSION', { 
      status: 'ACTIVE', 
      type: 'QUIZ', 
      activeContentId: selectedCategory.id,
      missionName: selectedCategory.topic || selectedCategory.name,
      questionLimit: maxQuestions
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
    <div className="w-full max-w-5xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-6 sm:p-14 space-y-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b-2 border-slate-50 pb-12">
        <div className="text-center md:text-left">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Mission Control</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-10">
              
              {/* 1. SECURITY STATUS (Always visible for host) */}
              {isHost && (
                  <div className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Command Link Active</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-400">{pendingParticipants.length} Waiting</span>
                  </div>
              )}

              {/* 2. PENDING CLEARANCES (Host Only) */}
              {isHost && pendingParticipants.length > 0 && (
                  <div className="space-y-6">
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Pending Admission ({pendingParticipants.length})</label>
                    <div className="space-y-3">
                        {pendingParticipants.map(p => (
                            <div key={p.userId} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border-2 border-red-100">
                                <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">{p.userName}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => sendAction('APPROVE_GUEST', { userId: p.userId })} className="w-8 h-8 bg-green-500 text-white rounded-lg font-black transition-all hover:scale-110">✓</button>
                                    <button onClick={() => sendAction('REJECT_GUEST', { userId: p.userId })} className="w-8 h-8 bg-red-500 text-white rounded-lg font-black transition-all hover:scale-110">×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              )}

              {/* ACTIVE */}
              <div className="space-y-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Active Squadron</label>
                  <div className="space-y-3">
                      <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border-2 border-indigo-600 shadow-xl shadow-indigo-50">
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
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/30 rounded-[3rem] border border-slate-100 p-8 md:p-12">
            {isHost ? (
               <div className="flex flex-col h-full space-y-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Tactical Library</h3>
                      <input 
                        placeholder="SEARCH..." 
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-[240px] bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest focus:border-indigo-600 outline-none" 
                      />
                  </div>

                  <div className="flex-1 min-h-[300px] max-h-[350px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-5 pr-3 custom-scrollbar">
                        {loading ? <div className="p-20 text-center col-span-2 text-slate-400 font-bold uppercase animate-pulse">Scanning Protocols...</div> : 
                          filteredCategories.map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c)} className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${selectedCategory?.id === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-white border-slate-50 text-slate-900 hover:border-indigo-600'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${selectedCategory?.id === c.id ? 'bg-indigo-500' : 'bg-slate-50'}`}>{c.emoji || '🎒'}</div>
                                <div className="text-left truncate">
                                    <p className="text-xs font-black uppercase tracking-tight truncate">{c.topic || c.name}</p>
                                    <p className={`text-[9px] font-bold mt-1 opacity-70`}>{c.questionCount} Qs</p>
                                </div>
                            </button>
                        ))}
                  </div>

                  <button 
                    onClick={handleStart} disabled={!selectedCategory}
                    className={`w-full py-6 rounded-[2.5rem] text-xl font-black tracking-tighter transition-all ${selectedCategory ? 'bg-slate-900 text-white hover:scale-[1.02]' : 'bg-slate-100 text-slate-300'}`}
                  >READY FOR LAUNCH 🚀</button>
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
