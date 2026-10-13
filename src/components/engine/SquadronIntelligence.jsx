"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '@/engine/lib/socket';

/**
 * SQUADRON INTELLIGENCE V5.0 - Esports Live Battle Edition
 * Segmented Tab Switcher (Leaderboard vs Live Chat),
 * Responsive card-based standings (no horizontal scrollbar),
 * Clean gaming terminology, bounded height.
 */

export default function SquadronIntelligence() {
  const { 
    participants, 
    session, 
    chatMessages, 
    sendChatMessage, 
    sendReaction, 
    sendBroadcast,
    pulse
  } = useSessionEngine();
  const { t, isHindi } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'chat'
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastSeenChatCountRef = useRef(chatMessages?.length || 0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (activeTab === 'chat') {
      lastSeenChatCountRef.current = chatMessages?.length || 0;
      setUnreadCount(0);
      if (chatMessages?.length > 0) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      const diff = Math.max(0, (chatMessages?.length || 0) - lastSeenChatCountRef.current);
      setUnreadCount(diff);
    }
  }, [chatMessages, activeTab]);

  const isHost = session?.role === 'HOST' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('is_host') === 'true');

  const sortedSquad = useMemo(() => {
    const list = [...(participants || [])];
    const seen = new Set();
    let hostSeen = false;
    const unique = [];

    for (const p of list) {
      if (!p || p.isOnline === false || p.status === 'offline' || p.status === 'LEFT' || p.status === 'KICKED' || p.status === 'AWAY') continue;
      const key = p.userId || p.userName;
      if (p.role === 'HOST') {
        if (hostSeen) continue;
        hostSeen = true;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }

    return unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [participants]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    sendChatMessage(msg);
    setMsg('');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return { icon: '🥇', bg: 'bg-amber-100 text-amber-700 border-amber-300 shadow-amber-100' };
    if (index === 1) return { icon: '🥈', bg: 'bg-slate-200 text-slate-700 border-slate-300 shadow-slate-100' };
    if (index === 2) return { icon: '🥉', bg: 'bg-orange-100 text-orange-700 border-orange-300 shadow-orange-100' };
    return { icon: `#${index + 1}`, bg: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  const StatusDot = ({ status }) => {
    const colors = {
      ACTIVE: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
      BUSY: 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      LEFT: 'bg-red-500',
      KICKED: 'bg-red-800',
      DONE: 'bg-indigo-500'
    };
    return <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-slate-400'}`} />;
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
    <div className="flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden min-h-[460px] max-h-[580px]">
      
      {/* 🧭 SEGMENTED TAB SWITCHER */}
      <div className="p-2 bg-slate-50 border-b border-slate-100">
        <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🏆</span>
            <span className="truncate">{isHindi ? 'लीडरबोर्ड' : 'Standings'}</span>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-md">
              {sortedSquad.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all cursor-pointer relative ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>💬</span>
            <span className="truncate">{isHindi ? 'लाइव चैट' : 'Live Chat'}</span>
            {unreadCount > 0 ? (
              <span className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs">
                  {unreadCount}
                </span>
              </span>
            ) : chatMessages.length > 0 ? (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-md">
                {chatMessages.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* 🏆 TAB CONTENT: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="flex flex-col flex-1 p-4 overflow-hidden">
          
          {/* PLAYER CARDS LIST (No Table, Zero Horizontal Scroll) */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {sortedSquad.map((p, i) => {
                const badge = getRankBadge(i);
                const isYou = p.userId === session?.userId;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={p.userId || p.userName}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isYou 
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Left: Rank & Avatar & Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border shadow-xs flex-shrink-0 ${badge.bg}`}>
                        {badge.icon}
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/80 flex-shrink-0">
                        {p.userImage ? (
                          <img src={p.userImage} alt={p.userName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-slate-500">{p.userName?.[0] || '?'}</span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-black truncate max-w-[110px] sm:max-w-[130px] ${isYou ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {p.userName}
                          </span>
                          {isYou && (
                            <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-md flex-shrink-0">
                              {t('common.you')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StatusDot status={p.status || (p.isOnline === false ? 'LEFT' : 'ACTIVE')} />
                          <span className="text-[9px] font-bold text-slate-400 leading-none">
                            {getStatusLabel(p.status, p.isOnline)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score & Host Action */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="bg-slate-100/80 px-2.5 py-1 rounded-xl text-right">
                        <span className="text-xs font-black text-indigo-600 tabular-nums">{p.score || 0}</span>
                        <span className="text-[9px] font-bold text-slate-400 ml-1">{t('live.quiz.intel.score')}</span>
                      </div>

                      {isHost && p.role !== 'HOST' && !isYou && (
                        <button
                          type="button"
                          onClick={() => {
                            const actionLabel = (p.isOnline === false || p.status === 'LEFT' || p.status === 'AWAY') ? 'Remove' : 'Kick';
                            if (window.confirm(`${actionLabel} ${p.userName}?`)) {
                              socketService.getSocket()?.emit('HOST_ACTION', {
                                sessionId: session.sessionId,
                                action: 'KICK_PARTICIPANT',
                                payload: { userId: p.userId, purge: true }
                              });
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                          title="Remove player"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {sortedSquad.length === 0 && (
                <div className="py-12 text-center text-xs font-black text-slate-400 uppercase animate-pulse">
                  {t('live.quiz.intel.scanning')}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* 🚀 QUICK REACTIONS TRAY */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/70 rounded-2xl px-2 py-1.5">
            {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => sendReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:scale-125 active:scale-90 transition-all text-base cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* 💬 SWITCH TO CHAT BUTTON */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-200/60 shadow-2xs active:scale-98 relative"
            >
              <span>💬</span>
              <span>लाइव चैट खोलें ({chatMessages.length})</span>
              {unreadCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
              <span className="text-[10px]">→</span>
            </button>
          </div>
        </div>
      )}

      {/* 💬 TAB CONTENT: REAL LIVE CHAT */}
      {activeTab === 'chat' && (
        <div ref={containerRef} className="flex flex-col flex-1 bg-slate-50/50 overflow-hidden min-h-[420px] max-h-[520px]">
          
          {/* Real Chat Subheader */}
          <div className="px-3.5 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>लाइव रूम चैट ({chatMessages.length})</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {isHost ? '👑 आप होस्ट हैं' : 'होस्ट व सभी खिलाड़ी'}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar bg-slate-50/60">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-xs">
                  💬
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">लाइव चैट शुरू करें</h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    होस्ट और साथी खिलाड़ियों से बातचीत करें। शुभकामनाएं दें या उत्तरों पर चर्चा करें!
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center pt-2 max-w-xs">
                  {["नमस्ते! 👋", "ऑल द बेस्ट! 🎯", "तैयार हैं! 🔥", "शानदार सवाल! 💡"].map(starter => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => sendChatMessage(starter)}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((m) => {
              const isYou = m.userId === session?.userId;
              const isHostMessage = m.role === 'HOST';

              if (isYou) {
                return (
                  <div key={m.id} className="flex flex-col items-end space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="flex items-center gap-1.5 pr-1">
                      <span className="text-[10px] font-bold text-indigo-600">
                        आप {isHost && '(होस्ट)'}
                      </span>
                      <span className="text-[9px] text-slate-400">{formatTime(m.timestamp)}</span>
                    </div>
                    <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-xs bg-indigo-600 text-white text-xs font-medium leading-relaxed shadow-xs break-words">
                      {m.text}
                    </div>
                  </div>
                );
              }

              if (isHostMessage) {
                return (
                  <div key={m.id} className="flex items-start gap-2 max-w-[90%] animate-in fade-in slide-in-from-bottom-1 duration-200">
                    {/* Host Avatar with Crown */}
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs ring-2 ring-amber-200">
                      👑
                    </div>
                    <div className="flex flex-col space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 pl-0.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          👑 होस्ट · {m.userName}
                        </span>
                        <span className="text-[9px] text-slate-400">{formatTime(m.timestamp)}</span>
                      </div>
                      <div className="px-3.5 py-2 rounded-2xl rounded-tl-xs bg-white border-2 border-amber-300 text-slate-900 text-xs font-semibold leading-relaxed shadow-xs break-words">
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex items-start gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                    {m.userName?.[0] || '?'}
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <span className="text-[10px] font-bold text-slate-700">{m.userName}</span>
                      <span className="text-[9px] text-slate-400">{formatTime(m.timestamp)}</span>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl rounded-tl-xs bg-white border border-slate-200 text-slate-800 text-xs font-normal leading-relaxed shadow-xs break-words">
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reactions Bar inside Chat */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex justify-between items-center">
            {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => sendReaction(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 hover:scale-120 active:scale-90 transition-all text-sm cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Real Chat Message Input */}
          <div className="p-2.5 bg-white border-t border-slate-200/80">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-100/80 rounded-xl px-3 py-1.5 border border-slate-200/90 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-150 transition-all">
                <input
                  placeholder={isHost ? "होस्ट के रूप में संदेश लिखें..." : "संदेश लिखें..."}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium min-w-0"
                />
              </div>
              <button
                type="submit"
                disabled={!msg.trim()}
                className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
              >
                <span>भेजें</span>
                <span className="text-[10px]">➤</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
