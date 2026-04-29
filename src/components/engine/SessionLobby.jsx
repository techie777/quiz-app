"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessionEngine } from '@/engine/SessionProvider';
import { useLanguage } from '@/context/LanguageContext';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';
import axios from 'axios';

/**
 * MISSION CONTROL V6.0 - UX REFINEMENT
 * Optimized mobile layout, contextual navigation, and standardized nomenclature.
 */


export default function SessionLobby({ sessionId, isHost, onApproveGuest, onDenyGuest, sessionDuration = 0, onLeave }) {
  const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const { participants, pendingParticipants, session, sendAction, syncSquad, sessionReady, playSessionSound } = useSessionEngine();
  const { t, isHindi } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const prevParticipantsCount = useRef(participants.length);
  const hubRef = useRef(null);
  const selectionRef = useRef(null);
  const setsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (participants.length < prevParticipantsCount.current) {
        toast(t('live.lobby.toasts.left'), { icon: '👋', duration: 3000 });
    }
    prevParticipantsCount.current = participants.length;
  }, [participants.length, t]);

  useEffect(() => {
    if (isHost && sessionId) {
       const interval = setInterval(() => {
          syncSquad();
       }, 10000);
       return () => clearInterval(interval);
    }
  }, [isHost, sessionId, syncSquad]);

  const [maxQuestions, setMaxQuestions] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeLimit, setTimeLimit] = useState(null);
  const [navStack, setNavStack] = useState([]); 
  const [currentParentId, setCurrentParentId] = useState(null);
  const [selectedSetIndex, setSelectedSetIndex] = useState(1);
  const [previewSetIndex, setPreviewSetIndex] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const isInitialLoad = useRef(true);
  const notifiedGuestIds = useRef(new Set()); 

  const fetchPreviewQuestions = async (setIdx) => {
    if (previewQuestions[setIdx]) {
        setPreviewSetIndex(previewSetIndex === setIdx ? null : setIdx);
        return;
    }

    setPreviewLoading(true);
    setPreviewSetIndex(setIdx);
    try {
        const skip = (setIdx - 1) * 20;
        const res = await axios.get(`/api/questions?categoryId=${selectedCategory?.id}&limit=20&skip=${skip}`);
        setPreviewQuestions(prev => ({ ...prev, [setIdx]: res.data || [] }));
    } catch (err) {
        toast.error(t('live.lobby.toasts.decryptFail'));
    } finally {
        setPreviewLoading(false);
    }
  };
  useEffect(() => {
    if (selectedCategory) {
        // Smoothly scroll to the package selection area
        setTimeout(() => {
            setsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 800); 
    }
  }, [selectedCategory]);


  useEffect(() => {
    if (selectedSetIndex && !isInitialLoad.current) {
        // Smoothly scroll to the timer/deploy area
        setTimeout(() => {
            timerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); 
    }
  }, [selectedSetIndex]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/live/${sessionId}`;
      setInviteUrl(url);

      const handleVisibility = () => {
          socketService.getSocket()?.emit('USER_STATUS_UPDATE', { 
              sessionId, 
              status: document.visibilityState === 'visible' ? 'active' : 'idle' 
          });
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [sessionId]);

  useEffect(() => {
    const fetchCategories = async (parentId = null) => {
        if (!isHost) return;
        setLoading(true);
        try {
            const urlCategoryId = searchParams.get('categoryId');
            const targetId = parentId || currentParentId;
            
            // 1. Authoritative Deep Link Check (Runs only ONCE on mount)
            if (urlCategoryId && isInitialLoad.current) {
                console.log("📡 [LOBBY] Deep linking from URL:", urlCategoryId);
                const res = await axios.get(`/api/categories?id=${urlCategoryId}&limit=1`);
                
                if (res.data.categories?.length > 0) {
                    const cat = res.data.categories[0];
                    setSelectedCategory(cat);
                    setNavStack([cat]);
                    if (cat.parentId) setCurrentParentId(cat.parentId);
                }
                isInitialLoad.current = false;
            }

            // 2. Standard Library Navigation
            let results = [];
            if (targetId) {
                const res = await axios.get(`/api/categories?parentId=${targetId}&limit=100`);
                results = res.data.categories || [];
                
                if (results.length === 0) {
                    const leaf = navStack.find(n => n.id === targetId);
                    if (leaf) {
                        setSelectedCategory(leaf);
                    } else {
                        const resCat = await axios.get(`/api/categories?id=${targetId}&limit=1`);
                        if (resCat.data.categories?.length > 0) {
                            setSelectedCategory(resCat.data.categories[0]);
                        }
                    }
                }
            } else {
                const res = await axios.get('/api/categories?limit=100');
                results = res.data.categories || [];
            }
            setCategories(results);
        } catch (err) {
            console.error("📡 Category Desync:", err);
            toast.error(t('live.lobby.toasts.desync'));
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    };
    fetchCategories();
  }, [sessionId, isHost, currentParentId, searchParams, t]);

  const filteredCategories = useMemo(() => {
    const list = categories.length > 0 ? categories : [];
    if (!search) return list.slice(0, 16);
    return list.filter(c => (c?.topic || c?.name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 16);
  }, [categories, search]);

  const hostMember = useMemo(() => {
     return (participants || []).find(p => p.role === 'HOST' || p.isHost);
  }, [participants]);

  const squadMembers = useMemo(() => {
     // If I am the host, show everyone else
     if (isHost) {
         return (participants || []).filter(p => p?.userId !== session?.userId);
     }
     // If I am a guest, the top card shows the Host, so the list should show everyone ELSE (including me)
     return (participants || []).filter(p => p?.userId !== hostMember?.userId);
  }, [participants, session?.userId, isHost, hostMember]);

  const handleStart = () => {
    if (!selectedCategory) return toast.error(t('live.lobby.toasts.noTopic'));
    if (timeLimit === null) return toast.error(t('live.lobby.toasts.noTimer'));
    
    sendAction('START_SESSION', { 
      status: 'ACTIVE', 
      type: 'QUIZ', 
      activeContentId: selectedCategory?.id,
      missionName: selectedCategory?.topic || selectedCategory?.name,
      questionLimit: maxQuestions,
      timeLimit: timeLimit,
      setIndex: selectedSetIndex
    });
  };

  if (!mounted) return null;

  if (!isHost && session?.status === 'PENDING') {
      return (
          <div className="w-full max-w-6xl bg-[var(--bg-secondary)] rounded-2xl shadow-2xl p-6 sm:p-12 text-center space-y-8 border border-[var(--card-border)]">
               <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 border-8 border-[var(--accent-light)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">💂</div>
               </div>
               <div className="space-y-6">
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter">{t('live.lobby.pending.title')}</h2>
                  <p className="text-base sm:text-lg font-bold text-slate-500 max-w-lg mx-auto leading-relaxed">
                     {t('live.lobby.pending.desc').replace('{host}', sessionId)}
                  </p>
               </div>
               <div className="pt-4">
                    <button 
                        onClick={onLeave}
                        className="text-xs font-black text-red-500/50 hover:text-red-600 uppercase tracking-widest transition-all p-4 border border-dashed border-red-100 rounded-xl"
                    >
                        {t('live.lobby.controls.exit')} 🚪
                    </button>
                </div>
          </div>
      );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
      

      {/* 🔴 TOP DASHBOARD STRIP (Global Control Hub) */}
      <div className="w-full bg-slate-900 text-white px-5 py-4 sm:px-8 sm:py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-green-400 whitespace-nowrap">{t('live.lobby.status.liveRoom')}</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-slate-700"></div>
              <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('live.lobby.status.uptime')}</span>
                    <span className="text-[10px] sm:text-[11px] font-black text-white tabular-nums">{formatDuration(sessionDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('live.lobby.status.players')}</span>
                    <span className="text-[10px] sm:text-[11px] font-black text-white px-2.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 shadow-sm">{participants.length}</span>
                  </div>
              </div>
          </div>
          
          {!isHost && (
               <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t border-slate-800 sm:border-t-0">
                   <button 
                    onClick={onLeave}
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                     <span>🚪</span>
                     <span>{t('live.lobby.controls.exit')}</span>
                   </button>
               </div>
           )}

          {isHost && (
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t border-slate-800 sm:border-t-0">
                  <button 
                    onClick={() => { socketService.getSocket()?.emit('FORCE_ROOM_SYNC', { sessionId }); toast.success(t('live.lobby.toasts.syncComplete')); }} 
                    className="flex-1 sm:flex-none h-11 sm:w-11 sm:h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all font-bold text-white shadow-sm gap-2 px-4 sm:px-0"
                    title={t('live.lobby.controls.sync')}
                  >
                    <span>🔄</span>
                    <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">{t('live.lobby.controls.sync')}</span>
                  </button>
                  <button 
                    onClick={() => { if(window.confirm(t('live.lobby.controls.terminateConfirm'))) sendAction('TERMINATE', { status: 'LOBBY' }); }}
                    className="flex-1 sm:flex-none h-11 sm:w-11 sm:h-11 rounded-xl bg-red-600 border border-red-500 flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 gap-2 px-4 sm:px-0"
                    title={t('live.lobby.controls.terminate')}
                  >
                    <span>🛑</span>
                    <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">{t('live.lobby.controls.terminate')}</span>
                  </button>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 🎯 MAIN HUB (Mission Selection & Recruitment) (70%) */}
          <div ref={hubRef} className="lg:col-span-8 flex flex-col gap-8 order-1 lg:order-2">
            
            {/* 👥 RECRUITMENT ZONE (Global Focus) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 sm:p-10 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                <div className="space-y-1 relative">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('live.lobby.invite.title')}</h3>
                    <p className="text-[10px] sm:text-xs font-black text-indigo-500 uppercase tracking-[0.2em] leading-none">{t('live.lobby.invite.subtitle')}</p>
                </div>

                { (isHost || sessionReady) ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                        <div className="flex bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 focus-within:border-indigo-300 transition-all shadow-inner">
                            <input readOnly value={inviteUrl} className="flex-1 bg-transparent px-4 text-xs font-bold text-slate-500 outline-none truncate" />
                            <button 
                                onClick={() => {
                                    playSessionSound('click');
                                    navigator.clipboard.writeText(inviteUrl);
                                    toast.success(t('live.lobby.toasts.linkCopied'));
                                    if (navigator.share) {
                                        setTimeout(() => { navigator.share({ title: t('live.lobby.invite.shareTitle'), url: inviteUrl }).catch(() => {}); }, 100);
                                    }
                                }}
                                className="w-12 h-12 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center transition-transform active:scale-90"
                            >🔗</button>
                        </div>
                        <p className="hidden sm:block text-[11px] font-bold text-slate-400 leading-relaxed">{t('live.lobby.invite.desc')}</p>
                    </div>
                    <div className="md:col-span-5 space-y-3">
                        <a 
                            href={`https://wa.me/?text=${encodeURIComponent(t('live.lobby.invite.whatsappText') + ' ' + inviteUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-5 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(34,197,94,0.2)] border-b-4 border-green-700 active:translate-y-0.5 active:border-b-0"
                        >
                            <span className="text-2xl">💬</span>
                            <span className="font-black text-xs uppercase tracking-widest">{t('live.lobby.invite.whatsappBtn')}</span>
                        </a>
                        <p className="text-[10px] font-bold text-green-600 text-center uppercase tracking-tighter">{t('live.lobby.invite.whatsappFooter')}</p>
                    </div>
                </div>
                ) : (
                <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl animate-pulse flex items-center justify-center text-xs font-black text-slate-300 uppercase tracking-widest">{t('live.lobby.invite.syncing')}</div>
                )}
            </div>

            {isHost ? (
               <div ref={selectionRef} className="flex-1 flex flex-col gap-8">
                  {/* SEARCH */}
                  {!selectedCategory && (
                    <div className="relative w-full group animate-in slide-in-from-bottom-4 duration-500">
                      <span className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 text-xl group-focus-within:scale-125 transition-transform duration-300">🔍</span>
                      <input 
                          placeholder={t('live.lobby.selection.searchPlaceholder')} 
                          value={search} onChange={(e) => setSearch(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] pl-16 sm:pl-20 pr-10 py-5 sm:py-6 text-sm font-black uppercase tracking-widest focus:border-indigo-600 focus:ring-8 focus:ring-indigo-100/50 outline-none shadow-2xl transition-all" 
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-8">
                        {/* 1. TOPICS (Knowledge Domain) */}
                        <div className={`space-y-6 sm:space-y-8 ${selectedCategory ? 'opacity-40 hover:opacity-100 transition-all duration-500' : ''}`}>
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                                    {selectedCategory ? t('live.lobby.selection.altInt') : t('live.lobby.selection.selectTopic')}
                                </h4>
                                {selectedCategory && (
                                    <button onClick={() => { setSelectedCategory(null); setNavStack([]); setCurrentParentId(null); }} className="text-[10px] font-black text-indigo-500 uppercase hover:text-indigo-400 tracking-widest border-b-2 border-indigo-500">{t('live.lobby.selection.reset')}</button>
                                )}
                            </div>
                            
                            {loading && categories.length === 0 ? (
                                <div className="py-24 sm:py-32 text-center text-sm font-black text-slate-300 uppercase animate-pulse tracking-[0.3em] sm:tracking-[0.5em]">{t('live.lobby.selection.scanning')}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    {filteredCategories.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => { 
                                                playSessionSound('click');
                                                if (selectedCategory?.id === c.id) return; 
                                                setNavStack(prev => [...prev, c]); 
                                                setCurrentParentId(c.id); 
                                                setSelectedCategory(c); 
                                                setSelectedSetIndex(1); 
                                            }} 
                                            className={`flex items-center gap-5 sm:gap-6 p-5 sm:p-6 rounded-2xl border-4 transition-all group relative overflow-hidden ${selectedCategory?.id === c.id ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-400 hover:shadow-2xl'}`}
                                        >
                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl sm:text-4xl shadow-xl transition-transform group-hover:scale-110 ${selectedCategory?.id === c.id ? 'bg-indigo-700/50 shadow-inner' : 'bg-slate-50'}`}>{c.emoji || '🎒'}</div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="text-sm font-black uppercase tracking-tight truncate">{c.topic || c.name}</p>
                                                <p className={`text-[9px] sm:text-[10px] font-bold opacity-60 tracking-widest uppercase truncate ${selectedCategory?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>{c.questionCount} {t('live.lobby.selection.assessments')}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. SETS (Package Selection) */}
                        {selectedCategory && (
                            <div ref={setsRef} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 scroll-mt-32">
                                
                                <div className="flex items-center gap-4">
                                     <button 
                                        onClick={() => { setSelectedCategory(null); setNavStack([]); setCurrentParentId(null); }}
                                        className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                        title={t('live.lobby.selection.backToTopics')}
                                     >←</button>
                                     <div className="space-y-0.5">
                                         <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter tracking-tight">{selectedCategory.topic || selectedCategory.name}</h4>
                                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t('live.lobby.selection.selectPkg')}</p>
                                     </div>
                                </div>

                                 <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 w-full">
                                         {Array.from({ length: Math.ceil((selectedCategory.questionCount || 0) / 20) || 1 }).map((_, i) => {
                                             const setNum = i + 1;
                                             const isActive = selectedSetIndex === setNum;
                                             const isPreviewing = previewSetIndex === setNum;
                                             const questions = previewQuestions[setNum] || [];

                                             return (
                                                 <div key={setNum} className="flex flex-col gap-2">
                                                     <div 
                                                         onClick={() => { playSessionSound('click'); setSelectedSetIndex(setNum); }}
                                                         className={`relative flex items-center p-4 sm:p-5 rounded-2xl border-2 transition-all group gap-5 w-full cursor-pointer ${isActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-[1.01]' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-400'}`}
                                                     >
                                                         <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-indigo-500' : 'bg-slate-50'}`}>
                                                             <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{t('live.lobby.selection.set')}</span>
                                                             <span className="text-lg sm:text-xl font-black italic">{setNum}</span>
                                                         </div>
                                                         <div className="flex-1 min-w-0 text-left space-y-1">
                                                             <p className={`text-sm sm:text-base font-black truncate uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{selectedCategory.topic || selectedCategory.name} {t('live.lobby.selection.package')} {setNum}</p>
                                                              <div className="flex items-center">
                                                                 <button 
                                                                     onClick={(e) => { e.stopPropagation(); playSessionSound('click'); fetchPreviewQuestions(setNum); }}
                                                                     className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                                                                         isActive 
                                                                         ? 'bg-indigo-500/50 border-indigo-400 text-white' 
                                                                         : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                                                                     }`}
                                                                 >
                                                                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">20 {t('live.lobby.selection.questions')}</span>
                                                                     <div className={`w-px h-3 ${isActive ? 'bg-indigo-400' : 'bg-slate-200'}`}></div>
                                                                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                         {isPreviewing ? t('common.hide') : t('common.view')} 👁️
                                                                     </span>
                                                                 </button>
                                                              </div>
                                                         </div>
                                                         <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2 ml-auto ${isActive ? 'bg-white border-white text-indigo-600 shadow-md scale-110' : 'bg-slate-50 border-slate-100 text-slate-100'}`}>
                                                             {isActive ? <span className="text-base sm:text-lg">✓</span> : <span className="text-base sm:text-lg">○</span>}
                                                         </div>
                                                     </div>

                                                     {/* QUESTION PREVIEW ACCORDION */}
                                                     {isPreviewing && (
                                                         <div className="animate-in slide-in-from-top-2 duration-300 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-inner p-4 sm:p-6 mb-4">
                                                             {previewLoading && questions.length === 0 ? (
                                                                 <div className="py-10 text-center text-xs font-black text-slate-300 uppercase tracking-widest animate-pulse">{t('live.lobby.selection.decrypting')}</div>
                                                             ) : (
                                                                 <div className="space-y-4">
                                                                     <div className="flex items-center justify-between px-2 mb-4">
                                                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('live.lobby.selection.pkgIntel')}</span>
                                                                         <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-md">{questions.length} {t('live.lobby.selection.questions')}</span>
                                                                     </div>
                                                                     <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                                                                         <table className="w-full text-left border-collapse">
                                                                             <thead>
                                                                                 <tr className="bg-slate-50">
                                                                                     <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-12 text-center">#</th>
                                                                                     <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('live.lobby.selection.statement')}</th>
                                                                                     <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 hidden sm:table-cell text-right w-24">{t('live.lobby.selection.diff')}</th>
                                                                                 </tr>
                                                                             </thead>
                                                                             <tbody className="divide-y divide-slate-50">
                                                                                 {questions.map((q, idx) => (
                                                                                     <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                                         <td className="px-4 py-4 text-xs font-black text-slate-300 text-center group-hover:text-indigo-400">{idx+1}</td>
                                                                                         <td className="px-4 py-4">
                                                                                             <div className="space-y-2">
                                                                                                 <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">{q.text}</p>
                                                                                                 <div className="flex flex-wrap gap-2 pt-1">
                                                                                                     {(q.options || []).map((opt, i) => (
                                                                                                         <span key={i} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border bg-slate-50 border-slate-100 text-slate-400">
                                                                                                             {opt}
                                                                                                         </span>
                                                                                                     ))}
                                                                                                 </div>
                                                                                             </div>
                                                                                         </td>
                                                                                         <td className="px-4 py-4 text-right hidden sm:table-cell">
                                                                                             <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border ${
                                                                                                 q.difficulty === 'hard' ? 'border-red-100 text-red-400 bg-red-50/30' : 
                                                                                                 q.difficulty === 'medium' ? 'border-orange-100 text-orange-400 bg-orange-50/30' : 
                                                                                                 'border-green-100 text-green-400 bg-green-50/30'
                                                                                             }`}>
                                                                                                 {q.difficulty === 'hard' ? t('common.difficulty.hard') : q.difficulty === 'medium' ? t('common.difficulty.medium') : t('common.difficulty.easy')}
                                                                                             </span>
                                                                                         </td>
                                                                                     </tr>
                                                                                 ))}
                                                                             </tbody>
                                                                         </table>
                                                                     </div>
                                                                 </div>
                                                             )}
                                                         </div>
                                                     )}
                                                 </div>
                                             );
                                         })}
                                 </div>

                                 {/* TIMER CONFIG */}
                                 <div ref={timerRef} className="bg-slate-900 rounded-[1.5rem] sm:rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-2xl gap-8 relative overflow-hidden group">
                                     <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                     <div className="space-y-1 text-center sm:text-left relative">
                                         <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">{t('live.lobby.selection.timer')}</h4>
                                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">{t('live.lobby.selection.timerSub')}</p>
                                     </div>
                                     <div className="flex items-center gap-2 sm:gap-3 relative">
                                         {[0, 15, 30, 60].map(val => (
                                             <button 
                                                 key={val}
                                                 onClick={() => { playSessionSound('click'); setTimeLimit(val); }}
                                                 className={`px-4 py-3 sm:px-6 sm:py-4 rounded-xl text-[10px] sm:text-xs font-black transition-all border-2 ${timeLimit === val ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-110' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-indigo-500/30'}`}
                                             >
                                                 {val === 0 ? t('common.off') : `${val}S`}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                            </div>
                        )}


                  </div>

                  <div className="fixed bottom-0 left-0 w-full p-4 lg:p-0 lg:static lg:mt-auto bg-white/60 backdrop-blur-xl lg:bg-transparent z-50">
                      <button 
                        onClick={() => { playSessionSound('launch'); handleStart(); }} disabled={!selectedCategory || timeLimit === null}
                        className={`w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black tracking-[0.3em] sm:tracking-[0.4em] transition-all transform active:scale-[0.98] shadow-[0_25px_50px_rgba(79,70,229,0.25)] flex items-center justify-center gap-6 border-b-4 ${selectedCategory && timeLimit !== null ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300'}`}
                      >
                         <span className="text-xl sm:text-2xl animate-pulse">🚀</span>
                         {t('live.lobby.controls.initiate')}
                      </button>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-12 sm:space-y-16 py-16 sm:py-28 px-6 sm:px-10">
                    <div className="relative">
                        <div className="w-48 h-48 sm:w-72 sm:h-72 bg-indigo-500/10 rounded-full animate-pulse blur-[80px] sm:blur-[100px] absolute -inset-10"></div>
                        <div className="w-40 h-40 sm:w-56 sm:h-56 bg-white border border-slate-100 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.1)] flex items-center justify-center text-[6rem] sm:text-[10rem] relative">🎮</div>
                    </div>
                    <div className="space-y-6 max-w-lg relative">
                        <h3 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{t('live.lobby.ready.title')}</h3>
                        <p className="text-[10px] sm:text-sm font-black text-indigo-500 uppercase tracking-[0.5em] animate-pulse">{t('live.lobby.ready.subtitle')}</p>
                        <p className="text-sm sm:text-base font-bold text-slate-500 leading-relaxed uppercase px-4 sm:px-8">
                            {t('live.lobby.ready.desc').replace('{host}', session?.hostName || '')}
                        </p>
                    </div>
                    <div className="flex gap-4 sm:gap-6">
                        {[1, 2, 3].map(i => <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 animate-bounce delay-${i*150} shadow-lg shadow-indigo-100`}></div>)}
                    </div>
                </div>
            )}
          </div>

          {/* 👥 SIDE COLUMN: ACTIVE PLAYERS (30%) */}
          <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-8 order-2 lg:order-1">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="p-8 sm:p-10 border-b border-slate-50 flex items-center justify-between bg-indigo-50/20">
                     <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('live.lobby.players.title')}</h3>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{participants.length} {t('live.lobby.players.ready')}</p>
                     </div>
                     <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl animate-pulse">🛰️</span>
                  </div>
                  
                  <div className="p-6 sm:p-8 space-y-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
                      <div className="flex items-center justify-between p-4 sm:p-5 bg-indigo-600 rounded-2xl border border-indigo-500 relative group text-white shadow-xl shadow-indigo-100">
                         <div className="absolute top-0 right-3 px-3 py-1 bg-white text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-b-md shadow-sm">{t('live.lobby.players.host')} 👑</div>
                         <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-black italic shadow-inner overflow-hidden">
                                   {isHost ? (
                                      session?.userImage ? <img src={session.userImage} alt="You" className="w-full h-full object-cover" /> : 'Y'
                                   ) : (
                                      hostMember?.userImage ? <img src={hostMember.userImage} alt={hostMember.userName} className="w-full h-full object-cover" /> : (hostMember?.userName?.[0] || 'L')
                                   )}
                                </div>
                               <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 h-4 bg-green-500 border-2 sm:border-4 border-slate-900 rounded-full shadow-sm"></span>
                            </div>
                            <div className="flex flex-col">
                               <p className="text-sm sm:text-base font-black uppercase tracking-tight">
                                   {isHost ? t('common.you') : (hostMember?.userName || t('live.lobby.players.leader'))}
                               </p>
                               <p className="text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                                   {isHost ? t('live.lobby.players.inControl') : t('live.lobby.players.commander')}
                               </p>
                            </div>
                         </div>
                      </div>

                      {squadMembers.map(p => {
                         const isMe = p.userId === session?.userId;
                        const isOffline = p.status === 'offline' || p.isOffline;
                        const isIdle = p.isIdle || p.status === 'idle';
                        const statusColor = isOffline ? 'bg-red-500' : isIdle ? 'bg-orange-500' : 'bg-green-500';

                        return (
                          <div key={p.userId} className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-400 hover:bg-white group transition-all">
                             <div className="flex items-center gap-3 sm:gap-4">
                                 <div className="relative">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm overflow-hidden">
                                        {p.userImage ? (
                                            <img src={p.userImage} alt={p.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            p.userName?.[0]
                                        )}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 ${statusColor} border-2 border-white rounded-full shadow-sm`}></span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm sm:text-base font-bold text-slate-700 truncate max-w-[120px] sm:max-w-[140px] uppercase tracking-tight leading-none">
                                        {p.userName} {isMe && `(${t('common.you')})`}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{isOffline ? t('live.lobby.players.left') : isIdle ? t('live.lobby.players.idle') : t('live.lobby.players.active')}</span>
                                 </div>
                             </div>
                             {isHost && (
                                 <button onClick={() => sendAction('KICK_PARTICIPANT', { userId: p.userId })} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100" title={t('live.lobby.players.kick')}>×</button>
                             )}
                          </div>
                        );
                      })}

                      {squadMembers.length === 0 && (
                          <div className="py-16 sm:py-20 px-8 text-center space-y-6 opacity-40 grayscale animate-pulse">
                               <div className="text-5xl sm:text-6xl">📡</div>
                               <div className="space-y-2">
                                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-slate-400">{t('live.lobby.players.awaiting')}</p>
                                  <div className="flex justify-center gap-2">
                                     {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                                  </div>
                                </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
