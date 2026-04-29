"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '@/engine/lib/socket';

/**
 * SQUADRON INTELLIGENCE V4.0 - Desktop Ultra
 * Scaled up fonts, improved chat readability, and larger reaction controls.
 */

export default function SquadronIntelligence() {
  const { 
    participants, 
    session, 
    chatMessages, 
    sendChatMessage, 
    sendReaction, 
    sendBroadcast,
    lastEvent,
    pulse
  } = useSessionEngine();
  const { t } = useLanguage();
  
  const [msg, setMsg] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const chatEndRef = useRef(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (chatMessages.length > 0) {
        // Only scroll if the container itself is likely visible or near view
        const container = containerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            // If the chat is in the viewport, then scroll to bottom
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
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
        KICKED: 'bg-red-900',
        DONE: 'bg-indigo-500'
    };
    return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-slate-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />;
  };

  const getStatusLabel = (status, isOnline) => {
    if (isOnline === false) return t('live.quiz.status.left');
    switch (status) {
        case 'ACTIVE': return t('live.quiz.status.active');
        case 'BUSY': return t('live.quiz.status.busy');
        case 'DONE': return t('live.quiz.status.done');
        default: return t('live.quiz.status.active');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-10">
      
      {/* 🏆 STRATEGIC STANDINGS */}
      <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.3em]">{t('live.quiz.intel.standings')}</h3>
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg uppercase">{participants.length} {t('live.quiz.intel.ops')}</span>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-50 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead className="bg-slate-50/50">
                      <tr>
                          <th className="px-3 py-3 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase w-12">#</th>
                          <th className="px-3 py-3 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase">{t('live.quiz.intel.operator')}</th>
                          <th className="px-3 py-3 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase text-right w-20">{t('live.quiz.intel.score')}</th>
                          {session?.role === 'HOST' && <th className="px-3 py-3 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase text-center w-12"></th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                       {sortedSquad.map((p, i) => (
                           <motion.tr 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={p.userId} 
                                className={`transition-all h-20 ${p.userId === session?.userId ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                           >
                               <td className="px-4 py-2">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                                       i === 0 ? 'bg-yellow-400 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                   }`}>
                                       {i + 1}
                                   </div>
                               </td>
                               <td className="px-4 py-2">
                                   <div className="flex items-center gap-4">
                                       <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                            {p.userImage ? (
                                                <img src={p.userImage} alt={p.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-black text-slate-400">{p.userName?.[0] || '?'}</span>
                                            )}
                                       </div>
                                       <div className="flex flex-col min-w-0">
                                           <span className={`text-base font-extrabold truncate ${p.userId === session?.userId ? 'text-indigo-600' : 'text-slate-700'}`}>
                                               {p.userName}
                                               {p.userId === session?.userId && ` (${t('common.you')})`}
                                           </span>
                                           <div className="flex items-center gap-1">
                                               <StatusDot status={p.status || (p.isOnline === false ? 'LEFT' : 'ACTIVE')} />
                                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                   {getStatusLabel(p.status, p.isOnline)}
                                               </span>
                                           </div>
                                       </div>
                                   </div>
                               </td>
                                <td className="px-3 py-2 text-right">
                                   <span className="text-base font-black text-slate-900 tabular-nums">{p.score || 0}</span>
                               </td>
                               {session?.role === 'HOST' && (
                                   <td className="px-4 py-2 text-center">
                                       {p.role !== 'HOST' && (
                                           <button 
                                             onClick={() => {
                                                 if (window.confirm(`${t('live.lobby.players.kick')} ${p.userName}?`)) {
                                                     socketService.getSocket()?.emit('HOST_ACTION', {
                                                         sessionId: session.sessionId,
                                                         action: 'KICK_PARTICIPANT',
                                                         payload: { userId: p.userId }
                                                     });
                                                 }
                                             }}
                                             className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black shadow-sm"
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
                             <td colSpan="4" className="py-20 text-center text-sm font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">{t('live.quiz.intel.scanning')}</td>
                           </motion.tr>
                       )}
                    </AnimatePresence>
                  </tbody>
              </table>
          </div>
      </div>

      {/* 🚀 QUICK REACTIONS */}
      <div className="flex flex-wrap justify-center sm:justify-between items-center bg-white/70 backdrop-blur-xl rounded-2xl p-2 gap-2 border border-white shadow-lg">
          {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
              <button 
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl hover:bg-white hover:scale-110 active:scale-95 transition-all text-xl md:text-2xl"
              >
                  {emoji}
              </button>
          ))}
      </div>

      {/* 🛰️ GLOBAL PROCLAMATION (HOST ONLY) */}
      {session?.role === 'HOST' && (
          <div className="bg-slate-900 rounded-2xl p-5 border-t-4 border-indigo-600 space-y-4 shadow-lg">
               <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t('live.quiz.intel.broadcast')}</h3>
               </div>
               <div className="flex gap-1.5">
                   <input 
                       placeholder={t('live.quiz.intel.directive')}
                       value={broadcastText}
                       onChange={(e) => setBroadcastText(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-white/20"
                   />
                   <button 
                       type="button"
                       onClick={() => {
                           if (broadcastText.trim()) {
                               sendBroadcast(broadcastText);
                               setBroadcastText('');
                           }
                       }}
                       className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-500 transition-all shadow-md"
                   >
                       {t('common.send')}
                   </button>
               </div>
          </div>
      )}

      {/* 💬 COMBAT COMMS CHAT */}
      <div ref={containerRef} className={`flex-1 min-h-[400px] md:min-h-[550px] flex flex-col bg-[#050816] rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-4 ${pulse ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'border-slate-900'} transition-all duration-300 overflow-hidden relative`}>
          <div className="px-6 md:px-8 py-5 md:py-7 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${pulse ? 'bg-indigo-400 scale-150' : 'bg-green-500'} shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse transition-all`}></div>
                  <h3 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.4em]">{t('live.quiz.intel.comms')}</h3>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-6">
                      <div className="text-7xl drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">📡</div>
                      <p className="text-sm font-black text-slate-300 uppercase tracking-[0.5em]">{t('live.quiz.intel.uplink')}</p>
                  </div>
              )}
              {chatMessages.map((m) => (
                  <div key={m.id} className={`flex flex-col space-y-2.5 ${m.userId === session?.userId ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 px-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${m.role === 'HOST' ? 'text-indigo-400' : 'text-slate-500'}`}>
                               {m.role === 'HOST' ? `👑 ${t('live.lobby.players.commander')}` : `💂 ${m.userName}`}
                          </span>
                      </div>
                      <div className={`max-w-[85%] px-7 py-4.5 rounded-[1.5rem] text-base font-bold leading-relaxed shadow-xl ${
                          m.userId === session?.userId 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white/5 text-slate-100 rounded-tl-none border border-white/10 backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]'
                      }`}>
                          {m.text}
                      </div>
                  </div>
              ))}
              <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-black/60 border-t border-white/5 backdrop-blur-2xl">
              <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/5 rounded-full p-1.5 focus-within:ring-2 ring-indigo-500/50 transition-all border border-white/10 group">
                  <input 
                      placeholder={t('live.quiz.intel.transmit')}
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-white px-6 text-sm font-black uppercase tracking-[0.2em] py-4 placeholder:text-slate-700 min-w-0"
                  />
                  <button 
                    type="submit"
                    className="w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 hover:scale-105 transition-all flex items-center justify-center text-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-90 flex-shrink-0"
                  >
                    🚀
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
}
