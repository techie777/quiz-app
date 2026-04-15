"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import SessionLobby from '@/components/engine/SessionLobby';
import { getPlayerComponent } from '@/engine/lib/mapper';
import { useSession } from 'next-auth/react';
import { useAdmin } from '@/context/AdminContext';
import SquadronIntelligence from '@/components/engine/SquadronIntelligence';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MISSION MANAGER V3.0 - High-Resolution Edition
 * Optimized for large desktop screens with expanded layouts and clear typography.
 */

export default function SessionManager({ sessionId }) {
  const { session, joinSession, sendAction, reactions, broadcast, sendReaction, participants, pendingParticipants, connectionStatus } = useSessionEngine();
  const adminContext = useAdmin();
  const adminUser = adminContext?.adminUser;
  const { data: authSession, status: authStatus } = useSession();

  // STABLE STATE DECLARATIONS
  const [mounted, setMounted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [joining, setJoining] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(5);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Diagnostic Pulse
  useEffect(() => {
    if (mounted) {
      console.log('📡 [MANAGER] Session Pulse:', session?.status, 'Role:', session?.role, 'Admin:', adminUser?.username);
    }
  }, [mounted, session?.status, session?.role, adminUser]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsHost(urlParams.get('is_host') === 'true');
    }
  }, []);

  const lastJoinedRef = useRef(null);
  const { socket } = useSessionEngine();

  useEffect(() => {
    // ---- DEBUG LOGGING ----
    console.log(`[MANAGER HOOK] Connection Check:`, {
        mounted,
        authStatus,
        connectionStatus,
        socketId: socket?.id,
        hasSession: !!session
    });
    // -----------------------

    if (!mounted || authStatus === 'loading' || connectionStatus !== 'connected' || !socket?.id) {
        console.log(`[MANAGER HOOK] Aborting early setup.`);
        return;
    }
    
    // CRITICAL: Do not join again if we already have an active/rehydrated session!
    if (session) {
        console.log(`[MANAGER HOOK] Session already active, aborting new join.`);
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('is_host') === 'true';

    // Wait until credentials are fully loaded before marking as joined
    // If they have the host URL param, let them join regardless of auth state.
    const isReadyToJoin = (!hostParam) || authSession?.user || adminUser || hostParam;
    if (!isReadyToJoin) {
        console.log(`[MANAGER HOOK] isReadyToJoin resolved to FALSE.`);
        return;
    }
    
    // Prevent double-joining if the same socket is already registered
    if (lastJoinedRef.current === socket?.id) {
        console.log(`[MANAGER HOOK] Already joined with this socket ID! Aborting.`);
        return;
    }
    lastJoinedRef.current = socket.id;

    // 1. Check for regular NextAuth user
    if (authSession?.user) {
        joinSession(sessionId, hostParam ? 'HOST' : 'GUEST', authSession.user);
    } 
    // 2. Check for Admin from internal AdminContext OR fallback if they have the host link
    else if (adminUser || hostParam) {
        console.log(`📡 [MANAGER] Admin Host detected: ${adminUser?.username || 'Generic Commander'}`);
        console.log(`📡 [MANAGER] Host is joining mission area: ${sessionId}`);
        joinSession(sessionId, hostParam ? 'HOST' : 'GUEST', {
            id: adminUser?.id || `admin_base_operator`,
            name: adminUser?.displayName || adminUser?.username || 'Commander'
        });
    }
    // 3. Auto-join guest if persistent callsign exists
    else if (!hostParam) {
        const savedName = localStorage.getItem(`quiz_callsign_${sessionId}`);
        if (savedName) {
            console.log(`📡 [MANAGER] Guest re-joining with callsign: ${savedName} into mission ${sessionId}`);
            const savedId = localStorage.getItem(`quiz_uid_${sessionId}`) || `guest_${Math.random().toString(36).substring(7)}`;
            localStorage.setItem(`quiz_uid_${sessionId}`, savedId);
            setJoining(true); // Signal joining state
            joinSession(sessionId, 'GUEST', { 
                id: savedId,
                name: savedName 
            });
        } else {
             console.log(`📡 [MANAGER] Guest landing on mission ${sessionId}. Showing Entry Form.`);
        }
    }
  }, [mounted, authSession, authStatus, adminUser, session, sessionId, joinSession, connectionStatus, socket?.id]);

  useEffect(() => {
    let timer;
    if (session?.status === 'ACTIVE') {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(timer);
  }, [session?.status]);

  const leadingPlayer = useMemo(() => {
    if (!participants || participants.length === 0) return null;
    return [...participants].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  }, [participants]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 2. Navigation & Redirect Logic
  useEffect(() => {
    if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED') {
       if (exitCountdown > 0) {
           const timer = setTimeout(() => setExitCountdown(exitCountdown - 1), 1000);
           return () => clearTimeout(timer);
       } else {
           window.location.href = '/';
       }
    }
  }, [session?.status, exitCountdown]);

  const handleGuestJoin = (e) => {
    if (e) e.preventDefault();
    setJoining(true);
    const finalName = guestName.trim() || `Guest_${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    console.log(`📡 [MANAGER] Guest form submitted. Callsign: ${finalName}`);
    console.log(`📡 [MANAGER] Joining target mission room: ${sessionId}`);
    
    // Persist for reloads
    localStorage.setItem(`quiz_callsign_${sessionId}`, finalName);
    
    const finalId = localStorage.getItem(`quiz_uid_${sessionId}`) || `guest_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(`quiz_uid_${sessionId}`, finalId);

    joinSession(sessionId, 'GUEST', { 
        id: finalId,
        name: finalName 
    });
  };

  if (!mounted || authStatus === 'loading') {
      return (
          <div className="flex flex-col items-center justify-center p-40 animate-pulse text-slate-300">
              <span className="text-6xl">📡</span>
              <p className="text-sm font-black uppercase tracking-[0.5em] mt-8">Connecting to Mission Control...</p>
          </div>
      );
  }

  // 5. Termination UI with Countdown
  if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED') {
      const isExpired = session?.status === 'EXPIRED';
      return (
          <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white text-center space-y-8 animate-in zoom-in duration-500 max-w-xl mx-auto mt-24">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-3xl text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse">
                {isExpired ? '📡' : '🛑'}
              </div>
              <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {isExpired ? 'Mission Expired' : 'Session Terminated'}
                  </h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    {isExpired ? 'Uplink lost. This mission is no longer active.' : 'Commander has aborted the squad session.'}
                  </p>
              </div>
              <div className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xl tracking-[0.3em] uppercase shadow-xl">
                  Redirecting in {exitCountdown}...
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">PROTOCOL ALPHA: TERMINATED</p>
          </div>
      );
  }

  const isPendingApproval = session?.status === 'PENDING';

  if (isPendingApproval) {
    return (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-20">
            <div className="text-6xl animate-bounce">💂</div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Waiting for Approval</h2>
                <p className="text-lg font-bold text-slate-400">Entry request broadcasted. Stand by for host authorization.</p>
            </div>
            <button 
                onClick={() => { localStorage.removeItem(`quiz_callsign_${sessionId}`); window.location.reload(); }}
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all"
            >
                Edit Callsign
            </button>
        </div>
    );
  }

  if (!session && !isHost && !authSession?.user && !joining) {
    return (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-20">
            <div className="text-6xl">💂</div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Squadron Entry</h2>
                <p className="text-base font-bold text-slate-400 uppercase tracking-widest">Set your mission callsign</p>
            </div>
            <form onSubmit={handleGuestJoin} className="space-y-6">
                <input 
                    autoFocus
                    placeholder="CALLSIGN (e.g. Maverick)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-8 py-4 text-base font-black uppercase tracking-widest focus:border-indigo-600 outline-none transition-all"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-base uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    Join Session 📡
                </button>
            </form>
        </div>
    );
  }

  // 5. MISSION ACTIVE Check
  const isMissionActive = session?.status === 'ACTIVE' && session?.type;
  
  if (mounted) {
      console.log('📡 [DEBUG] Mission State Check:', { 
          status: session?.status, 
          type: session?.type, 
          isMissionActive,
          userId: session?.userId
      });
  }

  const handleApproveGuest = (guestId) => {
    sendAction('APPROVE_GUEST', { userId: guestId });
  };

  const handleDenyGuest = (guestId) => {
    sendAction('DENY_GUEST', { userId: guestId });
  };

  if (isMissionActive) {
      const Player = getPlayerComponent(session.type);
      
      if (!Player) return (
        <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[3rem] border-4 border-red-100 shadow-2xl max-w-2xl mx-auto mt-24">
            <p className="text-red-500 font-black text-3xl uppercase tracking-tighter">🚨 Mission Error</p>
            <p className="text-lg font-bold text-slate-400 mt-4">Unsupported Content Type: {session.type}</p>
        </div>
      );

      return (
        <>
          {/* 🕒 SESSION STATS BAR (Timer & Leader) */}
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 animate-in slide-in-from-top-4 duration-700">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-6">
                  <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Time</span>
                      <span className="text-xl font-black text-white tabular-nums">{formatDuration(sessionDuration)}</span>
                  </div>
                  {leadingPlayer && (
                      <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leading</span>
                          <span className="flex items-center gap-2">
                              <span className="text-lg">🔥</span>
                              <span className="text-sm font-black text-indigo-400 uppercase tracking-tighter truncate max-w-[120px]">
                                  {leadingPlayer.userId === session?.userId ? 'You' : leadingPlayer.userName}
                              </span>
                          </span>
                      </div>
                  )}
              </div>
          </div>

          <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 animate-in fade-in duration-500 px-4 md:px-8 py-6 md:py-12 pb-32">
            
            <div className="space-y-6 w-full min-w-0">
                {session.role === 'HOST' && (
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-white shadow-lg px-6 py-4 rounded-3xl border border-slate-100 gap-4">
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center">
                      <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-900 uppercase">Mission Commander</span>
                      
                      {/* 🚀 ADMIN FLYER BADGES */}
                      <div className="flex items-center gap-1.5 ml-4 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
                              <button 
                                  key={emoji}
                                  onClick={() => sendReaction(emoji)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:scale-110 active:scale-90 transition-all text-lg shadow-sm"
                              >
                                  {emoji}
                              </button>
                          ))}
                      </div>
                    </div>

                    {showAbortModal ? (
                        <div className="flex items-center gap-4 animate-in slide-in-from-right-2">
                            <span className="text-[10px] font-black text-red-600 uppercase">Abort?</span>
                            <button onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })} className="bg-red-600 text-white text-[10px] px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-red-100 transition-all hover:scale-105">Confirm</button>
                            <button onClick={() => setShowAbortModal(false)} className="bg-slate-100 text-slate-500 text-[10px] px-5 py-2.5 rounded-xl font-black uppercase">Cancel</button>
                        </div>
                    ) : (
                      <button 
                          onClick={() => setShowAbortModal(true)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-[10px] px-6 py-2.5 rounded-xl font-black transition-all border border-red-100 shadow-sm"
                      >
                          ABORT 🛑
                      </button>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[500px] overflow-hidden">
                  <Player 
                    key={`${session.activeContentId}-${session.status === 'ACTIVE'}`} 
                    state={session} 
                  />
                </div>
            </div>

            <div className="h-full min-w-0">
                 <div className="sticky top-10 space-y-8 w-full">
                      <SquadronIntelligence />
                 </div>
            </div>
          </div>

          {/* 🛰️ TACTICAL OVERLAYS */}
          <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
              <AnimatePresence>
                  {broadcast && (
                      <motion.div 
                          initial={{ y: -200, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -200, opacity: 0 }}
                          className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8"
                      >
                          <div className="bg-slate-900 border-4 border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.5)] p-10 rounded-[3rem] text-center">
                              <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.6em] mb-4 block animate-pulse">🛰️ Transmission Incoming</span>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                  {broadcast.text}
                              </h3>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              <AnimatePresence>
                  {reactions.map((r) => (
                      <motion.div
                          key={r.id}
                          initial={{ y: '110vh', x: `${Math.random() * 80 + 10}vw`, opacity: 1, scale: 0.5 }}
                          animate={{ y: '-20vh', opacity: 0, scale: 2.5, rotate: Math.random() * 60 - 30 }}
                          transition={{ duration: 5 + Math.random() * 2, ease: "easeOut" }}
                          className="absolute text-7xl select-none"
                      >
                          {r.emoji}
                          <span className="block text-xs font-black text-white bg-slate-900 px-4 py-2 rounded-full text-center mt-4 capitalize shadow-xl">{r.userName}</span>
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>
        </>
      );
  }

  return (
    <div className="flex justify-center w-full">
      <SessionLobby 
        sessionId={sessionId}
        isHost={isHost}
        participants={participants}
        pendingParticipants={pendingParticipants}
        reactions={reactions}
        broadcast={broadcast}
        onApproveGuest={handleApproveGuest}
        onDenyGuest={handleDenyGuest}
      />
    </div>
  );
}
