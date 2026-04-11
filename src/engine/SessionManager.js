"use client";

import React, { useEffect, useState } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import SessionLobby from '@/components/engine/SessionLobby';
import { getPlayerComponent } from '@/engine/lib/mapper';
import { useSession } from 'next-auth/react';
import SquadronIntelligence from '@/components/engine/SquadronIntelligence';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MISSION MANAGER V2.2 - Hard-Transition Logic
 * Ensures status changes (LOBBY -> ACTIVE) are prioritized instantly.
 */

export default function SessionManager({ sessionId }) {
  const { session, joinSession, sendAction, reactions, broadcast, sendReaction } = useSessionEngine();

  const { data: authSession, status: authStatus } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [endedAsHost, setEndedAsHost] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsHost(urlParams.get('is_host') === 'true');
    }
  }, []);

  useEffect(() => {
    if (!mounted || authStatus === 'loading' || session) return;

    // Only auto-join if the user is signed in. Guests go through entry screen.
    if (authSession?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const hostParam = urlParams.get('is_host') === 'true';
        joinSession(sessionId, hostParam ? 'HOST' : 'GUEST', authSession.user);
    }
  }, [mounted, authSession, authStatus, session, sessionId, joinSession]);

  const [hasBeenActive, setHasBeenActive] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [joining, setJoining] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(5);

  // REDIRECT PROTOCOL: Mission Expiration & Termination
  useEffect(() => {
    if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED') {
        const timer = setInterval(() => {
            setExitCountdown(prev => {
                if (prev <= 1) {
                    window.location.href = '/';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [session?.status]);

  useEffect(() => {
    if (session?.status === 'ACTIVE' && session?.type) setHasBeenActive(true);
  }, [session?.status, session?.type]);

  const handleGuestJoin = (e) => {
    if (e) e.preventDefault();
    setJoining(true);
    const finalName = guestName.trim() || `Guest_${Math.random().toString(36).substring(7).toUpperCase()}`;
    joinSession(sessionId, 'GUEST', { 
        id: `guest_${Math.random().toString(36).substring(7)}`,
        name: finalName 
    });
  };

  // 0. LOADING BLOCK: Stabilize before rendering mission states
  if (!mounted || authStatus === 'loading') {
      return (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse text-slate-300">
              <span className="text-4xl">📡</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Establishing Uplink...</p>
          </div>
      );
  }

  // 1. TERMINATED / EXPIRED state: 5-4-3-2-1 Redirect
  if (session?.status === 'TERMINATED' || session?.status === 'EXPIRED') {
      const isExpired = session?.status === 'EXPIRED';
      return (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] shadow-2xl border-4 border-red-50 text-center space-y-8 animate-in zoom-in duration-500 max-w-xl mx-auto mt-24">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-4xl animate-pulse">
                {isExpired ? '📡' : '🛑'}
              </div>
              <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {isExpired ? 'Mission Expired' : 'Session Terminated'}
                  </h2>
                  <p className="text-slate-500 font-bold">
                    {isExpired ? 'This mission link is no longer active.' : 'Commander has aborted the live session.'}
                  </p>
              </div>
              <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xl tracking-widest uppercase">
                  Redirecting in {exitCountdown}...
              </div>
          </div>
      );
  }

  // 2. PENDING APPROVAL STATE - Show waiting for host approval
  if (isPendingApproval) {
    return (
        <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-20">
            <div className="text-6xl">⏳</div>
            <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Waiting for Approval</h2>
                <p className="text-xs font-bold text-slate-400">Your request to join the session has been sent to the host.</p>
                <p className="text-xs font-bold text-slate-400">Please wait for the host to approve your request.</p>
            </div>
        </div>
    );
  }

  // 3. GUEST NAME ENTRY (Optional) - Only show if we don't have a session yet AND not host
  if (!session && !isHost && !authSession?.user && !joining) {
    return (
        <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-20">
            <div className="text-6xl">💂</div>
            <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Squadron Entry</h2>
                <p className="text-xs font-bold text-slate-400">Set your mission callsign (Optional)</p>
            </div>
            <form onSubmit={handleGuestJoin} className="space-y-4">
                <input 
                    autoFocus
                    placeholder="CALLSIGN (e.g. Maverick)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-indigo-600 outline-none transition-all"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                    Join Session 📡
                </button>
            </form>
        </div>
    );
  }

  // 3. PENDING APPROVAL Check
  const isPendingApproval = session?.status === 'PENDING';
  
  // 4. MISSION ACTIVE Check
  const isMissionActive = session?.status === 'ACTIVE' && session?.type;

  // 5. HOST CONTROLS for guest approval
  const handleApproveGuest = (guestId) => {
    sendAction('APPROVE_GUEST', { userId: guestId });
  };

  const handleDenyGuest = (guestId) => {
    sendAction('DENY_GUEST', { userId: guestId });
  };

  if (isMissionActive) {
      const Player = getPlayerComponent(session.type);
      
      if (!Player) return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-red-100 shadow-xl max-w-xl mx-auto mt-24">
            <p className="text-red-500 font-black text-lg uppercase tracking-tighter">🚨 Mission Execution Error</p>
            <p className="text-xs font-bold text-slate-400 mt-2">Unsupported Type: {session.type}</p>
        </div>
      );

      return (
        <>
          <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 animate-in fade-in duration-500 px-4 pb-12">
            
            <div className="lg:col-span-2 space-y-6">
                {session.role === 'HOST' && (
                  <div className="flex justify-between items-center bg-white shadow-md px-6 py-4 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase">Mission Commander: Active</span>
                      
                      {/* 🚀 ADMIN FLYER BADGES */}
                      <div className="flex items-center gap-1 ml-4 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          {['🔥', '👏', '❤️', '💯', '😲', '🎯'].map(emoji => (
                              <button 
                                  key={emoji}
                                  onClick={() => sendReaction(emoji)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:scale-110 active:scale-90 transition-all text-base shadow-sm border border-transparent hover:border-slate-200"
                                  title={`Send ${emoji} to Squadron`}
                              >
                                  {emoji}
                              </button>
                          ))}
                      </div>
                    </div>

                    
                    {showAbortModal ? (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                            <span className="text-[9px] font-black text-red-600 uppercase">Abort Mission?</span>
                            <button onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })} className="bg-red-600 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase shadow-lg shadow-red-100">Confirm</button>
                            <button onClick={() => setShowAbortModal(false)} className="bg-slate-100 text-slate-500 text-[10px] px-4 py-2 rounded-xl font-black uppercase">Cancel</button>
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
                  <Player state={session} />
                </div>
            </div>

            <div className="lg:col-span-1 h-full min-w-0">
                 <div className="sticky top-6 space-y-6 w-full">
                      <SquadronIntelligence />
                 </div>
            </div>
          </div>

          {/* 🛰️ TACTICAL OVERLAYS */}
          <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
              <AnimatePresence>
                  {broadcast && (
                      <motion.div 
                          initial={{ y: -100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -100, opacity: 0 }}
                          className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
                      >
                          <div className="bg-slate-900 border-2 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] p-6 rounded-3xl text-center">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-2 block animate-pulse">🛰️ Transmission Incoming</span>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
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
                          initial={{ y: '100vh', x: `${Math.random() * 80 + 10}vw`, opacity: 1, scale: 0.5 }}
                          animate={{ y: '-10vh', opacity: 0, scale: 1.5, rotate: Math.random() * 40 - 20 }}
                          transition={{ duration: 4 + Math.random() * 2, ease: "easeOut" }}
                          className="absolute text-4xl select-none"
                      >
                          {r.emoji}
                          <span className="block text-[8px] font-black text-slate-400 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-center mt-2 capitalize">{r.userName}</span>
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>
        </>
      );
  }


  // 4. LOBBY / DEFAULT: Render Lobby if no mission active
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
