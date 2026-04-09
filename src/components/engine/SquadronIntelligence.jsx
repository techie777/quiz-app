"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import { motion, AnimatePresence } from 'framer-motion';

import socketService from '@/engine/lib/socket';

/**
 * SQUADRON INTELLIGENCE V3.5 - Tactical Edge Edition
 * Features: Live Sorted Rankings (Animated), Combat Comms (Chat), 
 * Mission Reactions (Floating), and Commander Proclamations.
 */

export default function SquadronIntelligence() {
  const { 
    participants, 
    session, 
    chatMessages, 
    sendChatMessage, 
    sendReaction, 
    sendBroadcast 
  } = useSessionEngine();
  
  const [msg, setMsg] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sortedSquad = useMemo(() => {
    return [...(participants || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [participants]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    sendChatMessage(msg);
    setMsg('');
  };

  const StatusDot = ({ status }) => {
    const colors = {
        ACTIVE: 'bg-green-500',
        BUSY: 'bg-orange-500 animate-pulse',
        LEFT: 'bg-red-500',
        KICKED: 'bg-red-900'
    };
    return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-slate-500'}`} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 🏆 LIVE STRATEGIC RANKINGS */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tactical Standings</h3>
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">{participants.length} Ops</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-50">
              <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50/50">
                      <tr>
                          <th className="px-2 py-2.5 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase w-8">#</th>
                          <th className="px-2 py-2.5 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase">Operator</th>
                          <th className="px-2 py-2.5 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase text-right w-12">Score</th>
                          {session?.role === 'HOST' && <th className="px-2 py-2.5 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase text-center w-8"></th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                       {sortedSquad.map((p, i) => (
                           <motion.tr 
                               layout
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, scale: 0.9 }}
                               key={p.userId} 
                               className={`transition-colors h-11 ${p.userId === session?.userId ? 'bg-indigo-50/20' : 'hover:bg-slate-50/20'}`}
                           >
                               <td className="px-2 py-1">
                                   <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                       i === 0 ? 'bg-yellow-400 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                                   }`}>
                                       {i + 1}
                                   </div>
                               </td>
                               <td className="px-2 py-1">
                                   <div className="flex items-center gap-2 min-w-0">
                                       <StatusDot status={p.status || (p.isOnline ? 'ACTIVE' : 'LEFT')} />
                                       <span className={`text-xs font-black truncate ${p.userId === session?.userId ? 'text-indigo-600' : 'text-slate-700'}`}>
                                           {p.userName}
                                       </span>
                                   </div>
                               </td>
                               <td className="px-2 py-1 text-right">
                                   <span className="text-sm font-black text-slate-900 tabular-nums">{p.score || 0}</span>
                               </td>
                               {session?.role === 'HOST' && (
                                   <td className="px-2 py-1 text-center">
                                       {p.role !== 'HOST' && (
                                           <button 
                                             onClick={() => {
                                                 if (window.confirm(`Dismiss ${p.userName}?`)) {
                                                     socketService.getSocket().emit('HOST_ACTION', {
                                                         sessionId: session.sessionId,
                                                         action: 'KICK_PARTICIPANT',
                                                         payload: { userId: p.userId }
                                                     });
                                                 }
                                             }}
                                             className="w-5 h-5 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[9px]"
                                           >
                                               ✖
                                           </button>
                                       )}
                                   </td>
                               )}
                           </motion.tr>
                       ))}
                       {sortedSquad.length === 0 && (
                           <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="loading">
                             <td colSpan="4" className="py-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-pulse">Scanning Signal...</td>
                           </motion.tr>
                       )}
                    </AnimatePresence>
                  </tbody>
              </table>
          </div>
      </div>

      {/* 🚀 QUICK ACTIONS (REACTIONS) */}
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-md rounded-2xl p-2 border border-white">
          {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
              <button 
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:scale-110 active:scale-90 transition-all text-xl shadow-sm border border-transparent hover:border-slate-100"
              >
                  {emoji}
              </button>
          ))}
      </div>

      {/* 🛰️ COMMANDER BROADCAST (HOST ONLY) */}
      {session?.role === 'HOST' && (
          <div className="bg-slate-900 rounded-3xl p-5 border-t-4 border-indigo-500 space-y-3 shadow-xl">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Proclamation</h3>
               <div className="flex gap-2">
                   <input 
                       placeholder="Type proclamation..."
                       value={broadcastText}
                       onChange={(e) => setBroadcastText(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                   />
                   <button 
                       type="button"
                       onClick={() => {
                           if (broadcastText.trim()) {
                               sendBroadcast(broadcastText);
                               setBroadcastText('');
                           }
                       }}
                       className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-500 transition-colors"
                   >
                       SEND
                   </button>
               </div>
          </div>
      )}

      {/* 💬 COMBAT COMMS (LIVE CHAT) */}
      <div className="flex-1 min-h-[350px] flex flex-col bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Combat Comms</h3>
              <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-1">
                      <span className="text-2xl grayscale">📡</span>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Uplink Secured.</p>
                  </div>
              )}
              {chatMessages.map((m) => (
                  <div key={m.id} className={`flex flex-col space-y-1 ${m.userId === session?.userId ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${m.role === 'HOST' ? 'text-indigo-400' : 'text-white/40'}`}>
                              {m.userName}
                          </span>
                      </div>
                      <div className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-normal ${
                          m.userId === session?.userId 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/10'
                      }`}>
                          {m.text}
                      </div>
                  </div>
              ))}
              <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5">
              <form onSubmit={handleSend} className="flex gap-2 bg-white/5 rounded-2xl p-1.5 focus-within:ring-1 ring-indigo-500/50 transition-all">
                  <input 
                      placeholder="SIGNAL..."
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-white px-4 text-[11px] font-bold uppercase tracking-widest py-2"
                  />
                  <button 
                    type="submit"
                    className="aspect-square bg-indigo-600 text-white rounded-xl px-4 hover:bg-indigo-500 transition-colors flex items-center justify-center font-black"
                  >
                    🚀
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
}
