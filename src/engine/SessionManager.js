"use client";

import React, { useEffect, useState } from 'react';
import { useSessionEngine } from '@/engine/SessionProvider';
import SessionLobby from '@/components/engine/SessionLobby';
import { getPlayerComponent } from '@/engine/lib/mapper';
import { useSession } from 'next-auth/react';

/**
 * MISSION MANAGER V2.2 - Hard-Transition Logic
 * Ensures status changes (LOBBY -> ACTIVE) are prioritized instantly.
 */

export default function SessionManager({ sessionId }) {
  const { session, joinSession, sendAction } = useSessionEngine();
  const { data: authSession, status: authStatus } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsHost(urlParams.get('is_host') === 'true');
    }
  }, []);

  useEffect(() => {
    if (!mounted || authStatus === 'loading' || session) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('is_host') === 'true';

    if (authSession?.user) {
        joinSession(sessionId, hostParam ? 'HOST' : 'GUEST', authSession.user);
    } else {
        const guestId = Math.random().toString(36).substring(7);
        joinSession(sessionId, hostParam ? 'HOST' : 'GUEST', {
            id: `guest_${guestId}`,
            name: hostParam ? `Admin_Guest` : `Guest_${guestId.toUpperCase()}`
        });
    }
  }, [mounted, authSession, authStatus, session, sessionId, joinSession]);

  if (!mounted) return null;

  // CRITICAL: Hard-check for mission status 
  // If the status is NOT LOBBY, we switch to Player immediately
  const isMissionActive = session?.status === 'ACTIVE' && session?.type;

  if (isMissionActive) {
      const Player = getPlayerComponent(session.type);
      
      if (!Player) return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-red-100 shadow-xl">
            <p className="text-red-500 font-black text-lg uppercase tracking-tighter">🚨 Mission Execution Error</p>
            <p className="text-xs font-bold text-slate-400 mt-2">Unsupported Type: {session.type}</p>
        </div>
      );

      return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
          {/* Host Global Admin Bar */}
          {session.role === 'HOST' && (
            <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-indigo-100 shadow-xl animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black tracking-widest text-indigo-900 uppercase">Mission Commander: ACTIVE</span>
              </div>
              <button 
                onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })}
                className="bg-red-600 hover:bg-slate-900 text-white text-[10px] px-5 py-2.5 rounded-xl font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-100"
              >
                ABORT MISSION 🛑
              </button>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-12 border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
            <Player state={session} />
          </div>
          
          <div className="text-center py-4">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-60">
               Real-time Mission Player • <span className="text-indigo-500">{session.type} Protocol</span>
             </p>
          </div>
        </div>
      );
  }

  // DEFAULT: Show the Lobby
  return (
    <div className="flex justify-center w-full">
      <SessionLobby 
        sessionId={sessionId} 
        isHost={session?.role === 'HOST' || isHost} 
      />
    </div>
  );
}
