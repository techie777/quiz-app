"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const { playSessionSound } = useSessionEngine();
  const notifiedGuestIds = useRef(new Set());

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
    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('is_host') === 'true';

    // CRITICAL: Do not join again if we already have an active/rehydrated session!
    if (session) {
        if (hostParam && session.role !== 'HOST') {
             console.log(`[MANAGER HOOK] Role mismatch detected. Clearing stale Guest identity...`);
             sessionStorage.removeItem('active_quiz_session');
             // Refresh to start with clean slate as Host
             window.location.reload();
             return;
        } else {
             console.log(`[MANAGER HOOK] Session already active, aborting new join.`);
             return;
        }
    }

    // Wait until credentials are fully loaded before marking as joined
    // For Guests, we wait for NextAuth or Guest Form. For Hosts, we proceed immediately.
    const isReadyToJoin = hostParam || authSession?.user;
    if (!isReadyToJoin && !hostParam) {
        // Just checking if we need to show the entry form or wait for NextAuth
        const savedName = localStorage.getItem(`quiz_callsign_${sessionId}`);
        if (!savedName && authStatus === 'loading') {
             return; // Wait for NextAuth
        }
    }
    
    // Prevent double-joining if the same socket is already registered
    if (lastJoinedRef.current === socket?.id) {
        console.log(`[MANAGER HOOK] Already joined with this socket ID! Aborting.`);
        return;
    }

    // 1. If hitting Host URL, unconditionally join as generic Commander
    if (hostParam) {
        lastJoinedRef.current = socket.id;
        console.log(`📡 [MANAGER] Host is joining mission area: ${sessionId}`);
        joinSession(sessionId, 'HOST', {
            id: `host_base_operator`,
            name: 'Commander'
        });
    }
    // 2. Otherwise it is a Guest flow. Check for NextAuth.
    else if (authSession?.user) {
        lastJoinedRef.current = socket.id;
        joinSession(sessionId, 'GUEST', authSession.user);
    } 
    // 3. Auto-join guest if persistent callsign exists
    else {
        const savedName = localStorage.getItem(`quiz_callsign_${sessionId}`);
        if (savedName) {
            lastJoinedRef.current = socket.id;
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

  // 👁️ GLOBAL VISIBILITY TRACKER: Active vs Busy
  useEffect(() => {
    const handleVisibility = () => {
        if (socket && session?.userId && session?.sessionId) {
            const status = document.visibilityState === 'visible' ? 'ACTIVE' : 'BUSY';
            console.log(`📡 [VISIBILITY] Operative is now: ${status}`);
            socket?.emit('UPDATE_STATUS', {
                sessionId: session.sessionId,
                userId: session.userId,
                status: status
            });
        }
    };

    const handleBeforeUnload = () => {
        if (socket && session?.userId && session?.sessionId && session?.role !== 'HOST') {
            socket?.emit('LEAVE_SESSION', { 
                sessionId: session.sessionId, 
                userId: session.userId 
            });
        }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session?.userId, session?.sessionId, session?.role, socket]);

  // 🔔 COMMANDER ALERTS: Standby for Squadron Movements
  const prevParticipantsRef = useRef(participants);
  useEffect(() => {
     if (isHost) {
          const prev = prevParticipantsRef.current;
          participants.forEach(p => {
              const prevP = prev.find(item => item.userId === p.userId);
              if (prevP && prevP.status !== p.status && p.status === 'LEFT') {
                  toast(`${p.userName} has left the mission area.`, { icon: '🏃' });
                  playSessionSound('leave');
              }
          });
          prevParticipantsRef.current = participants;
     }
  }, [participants, isHost, playSessionSound]);

  useEffect(() => {
     if (isHost && pendingParticipants.length > 0) {
          const newGuests = pendingParticipants.filter(g => g?.userId && !notifiedGuestIds.current.has(g.userId));
          if (newGuests.length > 0) {
              newGuests.forEach(guest => {
                  notifiedGuestIds.current.add(guest.userId);
                  playSessionSound('ting');
              });
          }
     }
  }, [pendingParticipants, isHost, playSessionSound]);

  const handleLeaveSession = () => {
    if (window.confirm("Are you sure you want to exit the quiz room? Your progress will be lost.")) {
        if (socket && session?.userId) {
            socket?.emit('LEAVE_SESSION', { 
                sessionId: session.sessionId, 
                userId: session.userId 
            });
            // Force eviction UI
            sendAction('DISCONTINUED', { status: 'DISCONTINUED' }); // Local pivot to terminated state
            setTimeout(() => { window.location.href = '/'; }, 2000);
        }
    }
  };

  useEffect(() => {
    let timer;
    if (session) { // Start timer as soon as session exists
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session?.sessionId]); // Depend on ID to handle re-joins

  // 🔒 SYSTEM LOCK: Prevent background scroll when mission modals are active
  useEffect(() => {
    const isModalActive = session?.isPaused || (isHost && pendingParticipants.length > 0);
    if (isModalActive && mounted) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [session?.isPaused, pendingParticipants.length, isHost, mounted]);

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
    if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED' || session?.status === 'DISCONTINUED') {
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
  if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED' || session?.status === 'DISCONTINUED') {
      const isExpired = session?.status === 'EXPIRED';
      const isDismissed = session?.status === 'DISCONTINUED';

      return (
          <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white text-center space-y-8 animate-in zoom-in duration-500 max-w-xl mx-auto mt-24">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white shadow-xl animate-pulse ${isDismissed ? 'bg-orange-500 shadow-orange-200' : 'bg-red-500 shadow-red-200'}`}>
                {isExpired ? '📡' : isDismissed ? '🫡' : '🛑'}
              </div>
              <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {isExpired ? 'Mission Expired' : isDismissed ? 'Mission Terminated' : 'Session Terminated'}
                  </h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    {isExpired ? 'Uplink lost. This mission is no longer active.' : 
                     isDismissed ? 'You have been professionally dismissed from this session by the Host.' : 
                     'The Host has terminated this live quiz room.'}
                  </p>
              </div>
              <div className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xl tracking-[0.3em] uppercase shadow-xl">
                  Evicting in {exitCountdown}...
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">PROTOCOL: {isDismissed ? 'EVICTION' : 'TERMINATED'}</p>
          </div>
      );
  }

  if (session?.status === 'DENIED') {
      return (
          <div className="w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-12 text-center space-y-10 animate-in zoom-in duration-500 border border-white mx-auto mt-24">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner">🚫</div>
              <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Access Declined</h2>
                  <p className="text-lg font-bold text-slate-500 leading-relaxed">
                      Your request to join this session was not approved by the mission commander.
                  </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <button 
                      onClick={() => { localStorage.removeItem(`quiz_callsign_${sessionId}`); window.location.reload(); }}
                      className="bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                      Retry 🔄
                  </button>
                  <button 
                      onClick={() => window.location.href = '/'}
                      className="bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                      Exit 🚪
                  </button>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Clearance Rejected</p>
          </div>
      );
  }

  const isPendingApproval = session?.status === 'PENDING';

  if (isPendingApproval) {
    const isActive = session?.status === 'ACTIVE';
    return (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-20">
            <div className="text-6xl animate-bounce">💂</div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {isActive ? 'Mission in Progress' : 'Waiting for Approval'}
                </h2>
                <p className="text-lg font-bold text-slate-400 leading-relaxed uppercase">
                    {isActive 
                        ? 'The session has already started. You are in the recruitment queue. Stand by for Commander approval.' 
                        : 'Entry request broadcasted. Stand by for host authorization.'}
                </p>
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
          {/* 🕒 SESSION STATS BAR (Timer & Leader) - SCROLLABLE VERSION */}
          <div className="flex items-center justify-center w-full mb-8 animate-in slide-in-from-top-4 duration-700">
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

          {/* ⏸️ PAUSE MODAL OVERLAY (Portal Mounted) */}
          {session?.isPaused && mounted && createPortal(
             <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-500 pointer-events-auto">
                  <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] max-w-md w-full text-center space-y-6 md:space-y-8 border border-slate-100 animate-in zoom-in duration-500">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl md:text-4xl mx-auto shadow-2xl animate-pulse">⏸️</div>
                    <div className="space-y-3 md:space-y-4">
                        <h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Mission Paused</h2>
                        <p className="text-xs md:text-base font-bold text-slate-500 leading-relaxed uppercase px-4">
                            The session has been paused by the commander. Stand by for resumption.
                        </p>
                    </div>
                    <div className="py-3 px-5 md:py-4 md:px-6 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-400 font-bold text-[10px] md:text-sm">
                        Comms Uplink remains active. You can still chat with the squadron.
                    </div>
                    {(session?.role === 'HOST' || isHost) && (
                        <button 
                            onClick={() => { playSessionSound('pause'); sendAction('RESUME_SESSION', { isPaused: false }); }}
                            className="w-full bg-indigo-600 text-white py-4 md:py-5 rounded-2xl font-black text-xs md:text-lg uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(79,70,229,0.3)]"
                        >
                            Resume Mission ▶️
                        </button>
                    )}
                 </div>
             </div>,
             document.body
          )}

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

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { playSessionSound('pause'); sendAction(session?.isPaused ? 'RESUME_SESSION' : 'PAUSE_SESSION', { isPaused: !session?.isPaused }); }}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-md group ${
                                    session?.isPaused ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'
                                }`}
                                title={session?.isPaused ? 'Resume Mission' : 'Pause Mission'}
                            >
                                <span className="text-xl group-active:scale-90 transition-transform">{session?.isPaused ? '▶️' : '⏸️'}</span>
                            </button>

                            {showAbortModal ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                    <span className="text-[10px] font-black text-red-600 uppercase">Confirm Abort?</span>
                                    <button onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })} className="bg-red-600 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase shadow-lg shadow-red-100 transition-all hover:scale-105">Yes</button>
                                    <button onClick={() => setShowAbortModal(false)} className="bg-slate-100 text-slate-500 text-[10px] px-4 py-2 rounded-xl font-black uppercase">No</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setShowAbortModal(true)}
                                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-[10px] px-6 py-2.5 h-12 rounded-2xl font-black transition-all border border-red-100 shadow-sm"
                                >
                                    ABORT 🛑
                                </button>
                            )}
                        </div>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[500px] overflow-hidden">
                  <Player 
                    key={`${session.activeContentId}-${session.status === 'ACTIVE'}`} 
                    state={session} 
                    onLeave={handleLeaveSession}
                  />
                </div>
            </div>

            <div className="h-full min-w-0">
                 <div className="sticky top-10 space-y-8 w-full">
                      <SquadronIntelligence />
                 </div>
            </div>
          </div>

          {/* 🚀 GLOBAL GLASSMORPHIC GUEST PORTAL (Portal Mounted) */}
          {isHost && pendingParticipants.length > 0 && mounted && createPortal(
             <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-500 pointer-events-auto">
                 <div className="bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/50 shadow-[0_50px_100px_rgba(0,0,0,0.5)] max-w-md w-full text-center space-y-8 relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <div className="space-y-3">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-white text-3xl shadow-xl animate-bounce">💂</div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Access Request</h3>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Mid-Mission Clearance Required</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
                        {pendingParticipants.map((guest) => (
                            <div key={guest.userId} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm shadow-inner overflow-hidden">
                                        {guest.userImage ? (
                                            <img src={guest.userImage} alt={guest.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            guest.userName[0]
                                        )}
                                    </div>
                                    <div className="text-left font-black text-slate-900 uppercase tracking-tight text-sm">{guest.userName}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { playSessionSound('fail'); handleDenyGuest(guest.userId); }} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">×</button>
                                    <button onClick={() => { playSessionSound('success'); handleApproveGuest(guest.userId); }} className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">✓</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60 px-4">New operatives are requesting clearance. Authorization required for deployment.</p>
                 </div>
             </div>,
             document.body
          )}

          {/* 🛰️ TACTICAL OVERLAYS */}
          <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex flex-col items-center">
              <AnimatePresence>
                  {broadcast && (
                      <motion.div 
                          initial={{ y: -200, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -200, opacity: 0 }}
                          className="w-full max-w-3xl px-8 mt-16"
                      >
                          <div className="bg-slate-900 border-4 border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.5)] p-10 rounded-[3rem] text-center pointer-events-auto">
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
      {/* 🚀 GLOBAL GLASSMORPHIC GUEST PORTAL (Host View) */}
      {isHost && pendingParticipants.length > 0 && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in zoom-in duration-300 pointer-events-auto">
             <div className="bg-white/90 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/50 shadow-[0_30px_100px_rgba(0,0,0,0.3)] max-w-md w-full text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl animate-bounce">💂</div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Access Request</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Entry Authorization Required</p>
                </div>
                
                <div className="space-y-4 max-h-[250px] overflow-y-auto px-2 custom-scrollbar">
                    {pendingParticipants.map((guest) => (
                        <div key={guest.userId} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 overflow-hidden">
                                    {guest.userImage ? (
                                        <img src={guest.userImage} alt={guest.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        guest.userName[0]
                                    )}
                                </div>
                                <div className="text-left font-black text-slate-900 uppercase tracking-tight text-sm">{guest.userName}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDenyGuest(guest.userId)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">×</button>
                                <button onClick={() => { playSessionSound('success'); handleApproveGuest(guest.userId); }} className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">✓</button>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Standard clearance protocol for mid-mission enrollment.</p>
             </div>
         </div>
      )}

      <SessionLobby 
        sessionId={sessionId}
        isHost={isHost}
        participants={participants}
        pendingParticipants={pendingParticipants}
        reactions={reactions}
        broadcast={broadcast}
        onApproveGuest={handleApproveGuest}
        onDenyGuest={handleDenyGuest}
        sessionDuration={sessionDuration}
        onLeave={handleLeaveSession}
      />
    </div>
  );
}
