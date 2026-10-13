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
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import B2BLiveWarRoom from '@/components/engine/B2BLiveWarRoom';
import B2BMasterResultLedger from '@/components/engine/B2BMasterResultLedger';
import B2BStudentExamPlayer from '@/components/engine/B2BStudentExamPlayer';

/**
 * MISSION MANAGER V3.0 - High-Resolution Edition
 * Optimized for large desktop screens with expanded layouts and clear typography.
 */

export default function SessionManager({ sessionId }) {
  const { isHindi } = useLanguage();
  const { 
    session, 
    setSession,
    joinSession, 
    sendAction, 
    reactions, 
    broadcast, 
    setBroadcast, 
    sendReaction, 
    participants, 
    pendingParticipants, 
    connectionStatus,
    playSessionSound,
    requestReentry,
    continueAlone
  } = useSessionEngine();
  const adminContext = useAdmin();
  const adminUser = adminContext?.adminUser;
  const { data: authSession, status: authStatus } = useSession();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (authStatus !== 'loading') {
      setAuthReady(true);
    } else {
      const timer = setTimeout(() => setAuthReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, [authStatus]);

  // STABLE STATE DECLARATIONS
  const [mounted, setMounted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [joining, setJoining] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(5);
  const [sessionDuration, setSessionDuration] = useState(0);
  const notifiedGuestIds = useRef(new Set());
  const [isTopCollapsed, setIsTopCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [b2bTestData, setB2bTestData] = useState(null);

  useEffect(() => {
    const fetchB2B = async () => {
      try {
        const code = session?.testCode || sessionId;
        const res = await axios.get(`/api/b2b/tests/${code}?role=${isHost ? 'host' : 'student'}`);
        if (res.data && !res.data.error) {
          setB2bTestData(res.data);
        }
      } catch (e) {}
    };
    if (sessionId) fetchB2B();
  }, [sessionId, session?.testCode, isHost]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {}
  };

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
      const savedCollapsed = localStorage.getItem('quiz_top_bar_collapsed');
      if (savedCollapsed === 'true') {
        setIsTopCollapsed(true);
      }
    }
  }, []);

  const lastJoinedRef = useRef(null);
  const { socket } = useSessionEngine();

  useEffect(() => {
    // ---- DEBUG LOGGING ----
    console.log(`[MANAGER HOOK] Connection Check:`, {
        mounted,
        authStatus,
        authReady,
        connectionStatus,
        socketId: socket?.id,
        hasSession: !!session
    });
    // -----------------------

    const isSocketReady = (connectionStatus === 'connected' || socket?.connected) && !!socket?.id;
    if (!mounted || (!authReady && authStatus === 'loading') || !isSocketReady) {
        console.log(`[MANAGER HOOK] Aborting early setup.`);
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('is_host') === 'true';

    // CRITICAL: Do not join again if we already have an active/rehydrated session!
    const roleParam = urlParams.get('role');
    const isStudentParam = roleParam === 'student' || (!hostParam && urlParams.get('b2b') === 'true');

    if (session) {
        if (hostParam && session.role !== 'HOST') {
             console.log(`[MANAGER HOOK] Role mismatch detected (expected HOST). Clearing stale Guest identity...`);
             sessionStorage.removeItem('active_quiz_session');
             // Refresh to start with clean slate as Host
             window.location.reload();
             return;
        } else if (isStudentParam && session.role === 'HOST') {
             console.log(`[MANAGER HOOK] Role mismatch detected (expected student). Clearing stale HOST identity...`);
             sessionStorage.removeItem('active_quiz_session');
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
        if (!savedName && !authReady && authStatus === 'loading') {
             return; // Wait for NextAuth
        }
    }
    
    // Prevent double-joining if the same socket is already registered
    if (lastJoinedRef.current === socket?.id) {
        console.log(`[MANAGER HOOK] Already joined with this socket ID! Aborting.`);
        return;
    }

    // 1. If hitting Host URL, unconditionally join as Host
    if (hostParam) {
        lastJoinedRef.current = socket.id;
        console.log(`📡 [MANAGER] Host is joining mission area: ${sessionId}`);
        joinSession(sessionId, 'HOST', {
            id: authSession?.user?.id || `host_base_operator`,
            name: authSession?.user?.name || 'Quiz Master',
            image: authSession?.user?.image
        });
    }
    // 2. Otherwise it is a Guest flow. Check for NextAuth.
    else if (authSession?.user) {
        lastJoinedRef.current = socket.id;
        joinSession(sessionId, 'GUEST', authSession.user);
    } 
    // 3. Auto-join guest / student if persistent callsign or B2B params exist
    else {
        const nameParam = urlParams.get('name');
        const rollParam = urlParams.get('roll');
        const isB2BParam = urlParams.get('b2b') === 'true';

        if (nameParam) {
            const formattedName = rollParam ? `${nameParam} (${rollParam})` : nameParam;
            localStorage.setItem(`quiz_callsign_${sessionId}`, formattedName);
            if (rollParam) localStorage.setItem(`b2b_student_roll_${sessionId}`, rollParam);
            localStorage.setItem(`b2b_student_name_${sessionId}`, nameParam);
        }

        const savedName = localStorage.getItem(`quiz_callsign_${sessionId}`) || nameParam;
        const savedRoll = localStorage.getItem(`b2b_student_roll_${sessionId}`) || rollParam;
        const isB2B = isB2BParam || !!savedRoll;

        if (savedName) {
            lastJoinedRef.current = socket.id;
            console.log(`📡 [MANAGER] Student re-joining with callsign: ${savedName} (Roll: ${savedRoll || 'N/A'}) into mission ${sessionId}`);
            const savedId = localStorage.getItem(`quiz_uid_${sessionId}`) || `student_${Math.random().toString(36).substring(7)}`;
            localStorage.setItem(`quiz_uid_${sessionId}`, savedId);
            setJoining(true); // Signal joining state
            joinSession(sessionId, 'GUEST', { 
                id: savedId,
                name: savedName,
                rollNumber: savedRoll,
                isB2B: isB2B
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
        // Protect B2B exam students: never emit LEAVE_SESSION on refresh / tab switch
        const isB2B = session?.isB2B || !!session?.rollNumber || !!b2bTestData;
        if (!isB2B && socket && session?.userId && session?.sessionId && session?.role !== 'HOST') {
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
    const active = participants.filter(p => p.isOnline !== false && p.status !== 'offline' && p.status !== 'LEFT' && p.status !== 'KICKED' && p.status !== 'AWAY');
    if (active.length === 0) return null;
    return [...active].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  }, [participants]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 🎓 B2B CONTEXT DETECTION (Host Cockpit vs Student CBT Exam Portal)
  const isB2B = useMemo(() => {
    if (session?.isB2B || !!session?.b2bRules || !!b2bTestData) return true;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('b2b') === 'true' || urlParams.get('role') === 'student') return true;
      if (localStorage.getItem(`b2b_student_roll_${sessionId}`) || localStorage.getItem(`b2b_student_name_${sessionId}`)) return true;
    }
    return false;
  }, [session, b2bTestData, sessionId]);

  const isB2BHost = (session?.role === 'HOST' || isHost) && isB2B;
  const isB2BStudent = !isHost && session?.role !== 'HOST' && isB2B;

  // 2. Navigation & Redirect Logic (Only for arcade lobbies that expired/terminated before a quiz started)
  useEffect(() => {
    if (isB2B) return;
    if (!session?.type && (session?.status === 'EXPIRED' || session?.status === 'TERMINATED')) {
       if (exitCountdown > 0) {
           const timer = setTimeout(() => setExitCountdown(exitCountdown - 1), 1000);
           return () => clearTimeout(timer);
       } else {
           window.location.href = '/';
       }
    }
  }, [session?.status, session?.type, exitCountdown, isB2B]);

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

  if (!mounted || (!authReady && authStatus === 'loading')) {
      return (
          <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-lg space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-3xl shadow-xs animate-bounce">
                🎯
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-800">लाइव क्विज़ से जुड़ रहे हैं...</h3>
                <p className="text-xs text-slate-500 font-medium">Connecting to live quiz room...</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span>सत्र तैयार हो रहा है...</span>
              </div>
          </div>
      );
  }

  // 🎓 B2B DEDICATED ROUTING: Host Cockpit & Student CBT Exam Portal
  if (isB2BHost) {
    if (session?.status === 'TERMINATED') {
      return (
        <B2BMasterResultLedger
          testData={session?.b2bRules || b2bTestData}
          participants={participants}
          submissions={b2bTestData?.submissions || []}
          onBack={() => { window.location.href = '/institute/create-test'; }}
        />
      );
    }
    return (
      <B2BLiveWarRoom
        session={session}
        participants={participants}
        testData={session?.b2bRules || b2bTestData}
        sendAction={sendAction}
        onEndExam={() => sendAction('TERMINATE', { status: 'TERMINATED' })}
      />
    );
  }

  if (isB2BStudent) {
    return (
      <B2BStudentExamPlayer
        session={session}
        testData={session?.b2bRules || b2bTestData}
        sessionId={sessionId}
        onLeave={handleLeaveSession}
      />
    );
  }

  // 🚫 KICKED OUT BY ADMIN SCREEN (Inform user + 3 Options: Continue Alone, Request Re-entry, Exit)
  const isKicked = (session?.status === 'KICKED' || session?.status === 'DISCONTINUED' || session?.status === 'PENDING_REENTRY' || session?.isKicked) && !session?.isSoloMode;
  if (isKicked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden select-none">
        {/* Ambient Cosmic Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 bg-slate-900/95 border border-rose-500/35 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in zoom-in-95 duration-300">
          
          {/* Header Icon with pulse */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-2xl bg-rose-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-rose-500/30 border border-rose-400/40">
              🚫
            </div>
          </div>

          {/* Alert Badge & Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider">
              <span>ADMIN KICK ACTION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isHindi ? "एडमिन द्वारा निकाला गया" : "Kicked Out by Admin"}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-sm mx-auto">
              {isHindi
                ? "आपको एडमिन द्वारा इस लाइव रूम से निकाल दिया गया है (You have been kicked out by the admin)। आप नीचे दिए गए विकल्पों में से चुन सकते हैं:"
                : "You have been kicked out from this room by the admin. Please select an option below:"}
            </p>
          </div>

          {/* 3 Interactive Choices */}
          <div className="space-y-3 pt-2 text-left">
            {/* OPTION 1: CONTINUE ALONE */}
            <button
              type="button"
              onClick={() => {
                playSessionSound('success');
                if (!session?.type) {
                  toast.success(isHindi ? "सोलो प्रैक्टिस मोड पर जा रहे हैं... 🎯" : "Heading to Solo Practice Mode... 🎯");
                  setTimeout(() => { window.location.href = '/practice'; }, 800);
                } else {
                  if (continueAlone) {
                    continueAlone();
                  } else if (setSession) {
                    setSession(prev => ({ ...prev, isKicked: false, isSoloMode: true, status: 'ACTIVE' }));
                  }
                }
              }}
              className="w-full group p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-md shadow-indigo-600/25 active:scale-[0.98] cursor-pointer flex items-center gap-3.5 border border-indigo-400/30"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🎯
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">
                    {isHindi ? "अकेले क्विज़ जारी रखें" : "Continue Alone"}
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-white/20 text-white">
                    {isHindi ? "सोलो" : "SOLO"}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100 font-medium leading-tight mt-0.5">
                  {isHindi ? "बिना रुके अपने प्रश्नों को सोलो मोड में पूरा करें" : "Complete your quiz peacefully in solo mode"}
                </p>
              </div>
            </button>

            {/* OPTION 2: REQUEST TO LET IN */}
            <button
              type="button"
              disabled={session?.isReentryPending || session?.status === 'PENDING_REENTRY'}
              onClick={() => {
                playSessionSound('notify');
                if (requestReentry) requestReentry();
              }}
              className={`w-full group p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                (session?.isReentryPending || session?.status === 'PENDING_REENTRY')
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300 cursor-not-allowed"
                  : "bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 text-white hover:border-amber-500/50 active:scale-[0.98] cursor-pointer"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                {(session?.isReentryPending || session?.status === 'PENDING_REENTRY') ? "⏳" : "🙋‍♂️"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">
                    {(session?.isReentryPending || session?.status === 'PENDING_REENTRY')
                      ? (isHindi ? "अनुरोध भेजा गया है..." : "Request Sent...")
                      : (isHindi ? "वापस शामिल होने का अनुरोध करें" : "Request to Let In")}
                  </span>
                  {(session?.isReentryPending || session?.status === 'PENDING_REENTRY') && (
                    <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                      WAITING
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                  {(session?.isReentryPending || session?.status === 'PENDING_REENTRY')
                    ? (isHindi ? "एडमिन की स्वीकृति की प्रतीक्षा की जा रही है..." : "Waiting for admin approval...")
                    : (isHindi ? "एडमिन को दोबारा अनुमति देने का संदेश भेजें" : "Ask the host to let you back in")}
                </p>
              </div>
            </button>

            {/* OPTION 3: EXIT LIVE PLAY */}
            <button
              type="button"
              onClick={() => {
                if (socket && session?.userId) {
                  socket.emit('LEAVE_SESSION', { sessionId: session.sessionId, userId: session.userId });
                }
                localStorage.removeItem(`quiz_callsign_${session?.sessionId}`);
                localStorage.removeItem(`quiz_uid_${session?.sessionId}`);
                sessionStorage.removeItem('active_quiz_session');
                window.location.href = '/';
              }}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xs font-bold"
            >
              <span>🚪</span>
              <span>{isHindi ? "लाइव प्ले छोड़ें (Exit Live Play)" : "Exit Live Play"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Friendly Session Concluded UI with Countdown (Only if quiz was NOT loaded and room concluded)
  if (!session?.type && (session?.status === 'TERMINATED' || session?.status === 'EXPIRED')) {
      const isExpired = session?.status === 'EXPIRED';
      const isDismissed = session?.status === 'DISCONTINUED';

      return (
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-white rounded-3xl shadow-xl border border-slate-200 text-center space-y-6 animate-in zoom-in duration-300 max-w-md mx-auto mt-12 px-6">
              {/* Friendly Icon */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-3xl text-indigo-600 shadow-xs">
                {isExpired ? '⏱️' : isDismissed ? '👋' : '🏁'}
              </div>

              {/* Polite & Balanced Headings */}
              <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isExpired ? 'क्विज़ सत्र समाप्त' : isDismissed ? 'आप रूम से बाहर हैं' : 'लाइव क्विज़ समाप्त (Quiz Concluded)'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                    {isExpired 
                      ? 'समय सीमा समाप्त हो गई है। यह क्विज़ सत्र अब सक्रिय नहीं है।' 
                      : isDismissed 
                      ? 'होस्ट द्वारा यह सत्र समाप्त कर दिया गया है। भाग लेने के लिए धन्यवाद!'
                      : 'होस्ट ने यह लाइव क्विज़ रूम समाप्त कर दिया है। खेलने के लिए आपका बहुत-बहुत धन्यवाद!'}
                  </p>
              </div>

              {/* Countdown Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-bold border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span>{exitCountdown} सेकंड में होम पेज पर जा रहे हैं...</span>
              </div>

              {/* Direct Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
                  <button 
                    type="button"
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    होम पेज पर जाएं 🏠
                  </button>
                  <button 
                    type="button"
                    onClick={() => window.location.href = '/live-quiz'}
                    className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
                  >
                    अन्य क्विज़ खोजें 🔍
                  </button>
              </div>
          </div>
      );
  }

  if (session?.status === 'DENIED') {
      return (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center space-y-6 animate-in zoom-in duration-300 border border-slate-200 mx-auto mt-12 px-6">
              <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs">✋</div>
              <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">प्रवेश अस्वीकृत (Access Declined)</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                      क्विज़ में शामिल होने का आपका अनुरोध होस्ट द्वारा स्वीकार नहीं किया गया।
                  </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button 
                      onClick={() => { 
                          localStorage.removeItem(`quiz_callsign_${sessionId}`); 
                          localStorage.removeItem(`quiz_uid_${sessionId}`);
                          sessionStorage.removeItem('active_quiz_session');
                          window.location.reload(); 
                      }}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                      पुनः प्रयास करें 🔄
                  </button>
                  <button 
                      onClick={() => window.location.href = '/'}
                      className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 cursor-pointer"
                  >
                      होम पेज 🏠
                  </button>
              </div>
          </div>
      );
  }

  const isPendingApproval = session?.status === 'PENDING';

  if (isPendingApproval) {
    const isActive = session?.status === 'ACTIVE';
    return (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8 animate-in zoom-in duration-500 border border-slate-100 mx-auto mt-10">
            <div className="text-6xl animate-bounce">⏳</div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {isActive ? 'Quiz in Progress' : 'Waiting to Join'}
                </h2>
                <p className="text-lg font-bold text-slate-400 leading-relaxed uppercase">
                    {isActive 
                        ? "The quiz has already started. You're in the waiting room. Please wait for the host to let you in." 
                        : "You're in the waiting room! Please wait for the host to approve your entry."}
                </p>
            </div>
            <button 
                onClick={() => { 
                    if (socket && session?.userId) {
                        socket.emit('LEAVE_SESSION', { 
                            sessionId: session.sessionId, 
                            userId: session.userId 
                        });
                    }
                    localStorage.removeItem(`quiz_callsign_${sessionId}`); 
                    localStorage.removeItem(`quiz_uid_${sessionId}`);
                    sessionStorage.removeItem('active_quiz_session');
                    setTimeout(() => window.location.reload(), 100);
                }}
                className="bg-slate-100 text-slate-500 py-3 px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
                Cancel 🛑
            </button>
        </div>
    );
  }

  if (!session && !isHost && !authSession?.user && !joining) {
    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-10 text-center space-y-6 animate-in zoom-in duration-300 border border-slate-100 mx-auto my-6 sm:my-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-xs">
                👋
            </div>
            <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    लाइव क्विज़ में शामिल हों
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-400">
                    Enter your name to join live battle
                </p>
            </div>
            <form onSubmit={handleGuestJoin} className="space-y-4">
                <input 
                    placeholder="अपना नाम लिखें (e.g. Rahul)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-sm sm:text-base font-bold text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
                <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm sm:text-base uppercase tracking-wider hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                    क्विज़ में शामिल हों (Join) ✨
                </button>
            </form>
        </div>
    );
  }

  // 5. MISSION ACTIVE Check (Active, Terminated or Finished sessions with quiz content)
  const isMissionActive = (session?.status === 'ACTIVE' || session?.status === 'TERMINATED' || session?.status === 'FINISHED') && !!session?.type;
  
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
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-rose-200 shadow-xl max-w-md mx-auto mt-16 text-center space-y-4">
            <span className="text-4xl">⚠️</span>
            <p className="text-rose-600 font-bold text-xl tracking-tight">क्विज़ लोड त्रुटि (Quiz Error)</p>
            <p className="text-xs font-medium text-slate-500">अमान्य क्विज़ प्रारूप: {session.type}</p>
            <button
              onClick={() => window.location.href = '/live-quiz'}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              वापस जाएं ↩️
            </button>
        </div>
      );

      return (
        <>
          {/* 🎛️ TOP IMMERSIVE COLLAPSE BAR (Dropdown, Fullscreen, Settings Gear) */}
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-1.5 pb-0.5">
            <div className="flex items-center justify-between bg-white px-3 sm:px-4 py-1.5 rounded-2xl border border-slate-200/90 shadow-2xs gap-2">
              
              {/* Left: Minimal Room Indicator, Status & Compact Time when Collapsed */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200/60 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono tracking-wider text-slate-800">#{session?.code || sessionId}</span>
                </div>

                {/* When collapsed, show compact timer so player never loses track of time */}
                {isTopCollapsed && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200/70 rounded-lg text-xs font-bold text-indigo-700 font-mono shrink-0 animate-in fade-in duration-200">
                    <span className="text-indigo-400 text-[11px]">⏱️</span>
                    <span className="tabular-nums">{formatDuration(sessionDuration)}</span>
                  </div>
                )}

                {session?.isPaused && (
                  <span className="text-[10px] sm:text-xs font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 animate-pulse">
                    ⏸️ {isHindi ? "विराम (Paused)" : "Paused"}
                  </span>
                )}
              </div>

              {/* Right: ⚙️ Settings Gear, ⛶ Fullscreen, 🔽/🔼 Dropdown Collapse Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                
                {/* ⚙️ Setting Gear Icon */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-indigo-600 flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer border border-slate-200/70 shadow-2xs"
                  title={isHindi ? "गेम सेटिंग्स (Game Settings)" : "Game Settings"}
                >
                  <span>⚙️</span>
                </button>

                {/* ⛶ Full Screen Icon */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-indigo-600 flex items-center justify-center text-xs transition-all active:scale-95 cursor-pointer border border-slate-200/70 shadow-2xs"
                  title={isFullscreen ? (isHindi ? "फुलस्क्रीन से बाहर निकलें (Exit Fullscreen)" : "Exit Fullscreen") : (isHindi ? "फुलस्क्रीन (Fullscreen)" : "Fullscreen")}
                >
                  <span>{isFullscreen ? '🗗' : '⛶'}</span>
                </button>

                {/* 🔽 Dropdown Collapse / Expand Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTopCollapsed(prev => {
                      const next = !prev;
                      if (typeof window !== 'undefined') localStorage.setItem('quiz_top_bar_collapsed', String(next));
                      return next;
                    });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 h-8 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                    isTopCollapsed 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/20" 
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/70"
                  }`}
                  title={isTopCollapsed ? (isHindi ? "कंट्रोल दिखाएं (Expand Header)" : "Expand Header") : (isHindi ? "कंट्रोल छिपाएं (Collapse Header)" : "Collapse Header")}
                >
                  <span className="text-[11px] hidden sm:inline">
                    {isTopCollapsed ? (isHindi ? "कंट्रोल दिखाएं" : "Expand") : (isHindi ? "छिपाएं" : "Collapse")}
                  </span>
                  <span className={`text-xs transition-transform duration-200 inline-block ${isTopCollapsed ? 'rotate-180' : ''}`}>
                    ▲
                  </span>
                </button>

              </div>
            </div>
          </div>

          {/* 🌟 COLLAPSIBLE TOP HEADER ROW (Host, Timer, Pause, Samappt, Leader, Reactions) */}
          <AnimatePresence initial={false}>
            {!isTopCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-0.5 pb-1">
                  <div className="flex items-center justify-between bg-white px-3 sm:px-4 py-2 rounded-2xl border border-slate-200/90 shadow-xs gap-2 shrink-0">
                    
                    {/* Left: Host/Live Badge, Live Timer & Leader */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                        session?.role === 'HOST' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-indigo-50 border border-indigo-200/80 text-indigo-700'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{session?.role === 'HOST' ? (isHindi ? '👑 होस्ट' : '👑 Host') : (isHindi ? '⚔️ लाइव' : '⚔️ Live')}</span>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 font-mono shrink-0">
                        <span className="text-slate-400 text-xs">⏱️</span>
                        <span className="tabular-nums">{formatDuration(sessionDuration)}</span>
                      </div>

                      {leadingPlayer && participants.length > 2 && (
                        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/70 rounded-xl text-xs font-bold text-amber-800 shrink-0">
                          <span>🔥 लीडर:</span>
                          <span className="font-bold text-indigo-700 truncate max-w-[90px]">
                            {leadingPlayer.userId === session?.userId ? 'आप' : leadingPlayer.userName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Center: Quick Flyer Reactions (Desktop) */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-200/60 shrink-0">
                      {['🔥', '👏', '❤️', '💯', '🎯'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => sendReaction(emoji)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-2xs hover:scale-110 active:scale-90 transition-all text-sm cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Right: Controls (Host: Pause/Resume, Samappt; Guest: Exit Room) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {session?.role === 'HOST' ? (
                        session?.status === 'TERMINATED' ? (
                          <div className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/80 flex items-center gap-1">
                            <span>🏁</span>
                            <span>सत्र समाप्त</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => { playSessionSound('pause'); sendAction(session?.isPaused ? 'RESUME_SESSION' : 'PAUSE_SESSION', { isPaused: !session?.isPaused }); }}
                              className={`h-8 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
                                session?.isPaused ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                              }`}
                              title={session?.isPaused ? 'Resume Quiz' : 'Pause Quiz'}
                            >
                              <span>{session?.isPaused ? '▶️ शुरू' : '⏸️ रोकें'}</span>
                            </button>

                            {showAbortModal ? (
                              <div className="flex items-center gap-1 animate-in slide-in-from-right-2 shrink-0">
                                <span className="text-[11px] font-bold text-red-600 hidden sm:inline">समाप्त?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAbortModal(false);
                                    sendAction('TERMINATE', { status: 'TERMINATED' });
                                  }}
                                  className="bg-red-600 text-white text-xs px-2.5 py-1 rounded-xl font-bold hover:bg-red-700 cursor-pointer shadow-xs shrink-0"
                                >
                                  हाँ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAbortModal(false)}
                                  className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-xl font-bold hover:bg-slate-300 cursor-pointer shrink-0"
                                >
                                  नहीं
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowAbortModal(true)}
                                className="border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 px-2.5 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs shrink-0"
                              >
                                🛑 समाप्त
                              </button>
                            )}
                          </>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={handleLeaveSession}
                          className="border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-8 px-2.5 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                        >
                          <span>🚪</span>
                          <span className="hidden sm:inline">बाहर निकलें</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⚙️ QUICK GAME SETTINGS MODAL (Portal Mounted) */}
          {showSettingsModal && mounted && createPortal(
            <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">⚙️</span>
                    <h3 className="font-black text-base text-slate-900">{isHindi ? "गेम सेटिंग्स" : "Game Settings"}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3 text-xs">
                  {/* Room Code with Copy Link */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 font-bold">
                      <span>{isHindi ? "रूम कोड" : "Room Code"}</span>
                      <span className="font-mono text-indigo-600 font-black text-sm tracking-wider">{sessionId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/live/${sessionId}` : sessionId;
                        navigator.clipboard?.writeText(url);
                        toast.success(isHindi ? "रूम लिंक कॉपी हो गया! ✨" : "Room link copied! ✨");
                      }}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold border border-indigo-200/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>📋</span>
                      <span>{isHindi ? "रूम लिंक कॉपी करें (Copy Link)" : "Copy Room Link"}</span>
                    </button>
                  </div>

                  {/* Sound Effects Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <span>{soundEnabled ? '🔊' : '🔇'}</span>
                      <span>{isHindi ? "ध्वनि प्रभाव (Sound FX)" : "Sound Effects"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundEnabled(prev => !prev);
                        toast(soundEnabled ? "ध्वनि म्यूट की गई 🔇" : "ध्वनि चालू की गई 🔊");
                      }}
                      className={`px-3 py-1 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
                        soundEnabled ? "bg-emerald-500 text-white shadow-2xs" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {soundEnabled ? (isHindi ? "चालू (ON)" : "ON") : (isHindi ? "बंद (OFF)" : "OFF")}
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <span>{isFullscreen ? '🗗' : '⛶'}</span>
                      <span>{isHindi ? "फुलस्क्रीन मोड" : "Full Screen Mode"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[11px] cursor-pointer shadow-2xs"
                    >
                      {isFullscreen ? (isHindi ? "बाहर निकलें" : "Exit") : (isHindi ? "सक्रिय करें" : "Enter")}
                    </button>
                  </div>

                  {/* Header Collapse Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <span>{isTopCollapsed ? '🔽' : '🔼'}</span>
                      <span>{isHindi ? "टॉप कंट्रोल बार" : "Top Control Bar"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTopCollapsed(prev => {
                          const next = !prev;
                          if (typeof window !== 'undefined') localStorage.setItem('quiz_top_bar_collapsed', String(next));
                          return next;
                        });
                      }}
                      className={`px-3 py-1 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
                        isTopCollapsed ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isTopCollapsed ? (isHindi ? "छिपा हुआ (Hidden)" : "Hidden") : (isHindi ? "दिख रहा है (Visible)" : "Visible")}
                    </button>
                  </div>

                  {/* Host Quick Controls inside Settings */}
                  {session?.role === 'HOST' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isHindi ? "होस्ट त्वरित नियंत्रण" : "Host Quick Actions"}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playSessionSound('pause');
                            sendAction(session?.isPaused ? 'RESUME_SESSION' : 'PAUSE_SESSION', { isPaused: !session?.isPaused });
                          }}
                          className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
                            session?.isPaused ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                          }`}
                        >
                          <span>{session?.isPaused ? '▶️ शुरू' : '⏸️ रोकें'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSettingsModal(false);
                            setShowAbortModal(true);
                          }}
                          className="py-2 px-2.5 rounded-xl font-bold text-xs border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>🛑 समाप्त</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isHindi ? "पूर्ण (Done)" : "Done"}
                </button>
              </div>
            </div>,
            document.body
          )}

          {/* ⏸️ LIGHT-THEMED HIGH-TECH PAUSE MODAL OVERLAY (Portal Mounted) */}
          {session?.isPaused && mounted && createPortal(
              <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto select-none">
                  {/* Ambient Soft Aura */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative overflow-hidden bg-white/95 text-slate-900 border border-amber-200/90 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-9 max-w-lg w-full text-center space-y-6 shadow-[0_25px_70px_rgba(217,119,6,0.18)] backdrop-blur-2xl animate-in zoom-in-95 duration-300">
                    {/* Top Amber Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                    {/* Glowing Animated Radar Pause Badge */}
                    <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-2xl bg-amber-400/25 animate-ping" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-amber-500/35 border border-amber-300/60">
                        ⏸️
                      </div>
                    </div>

                    {/* Status Pill & Headings */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-black uppercase tracking-wider shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>{isHindi ? "लाइव मुकाबला विराम पर" : "BATTLE ON PAUSE"}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {isHindi ? "क्विज़ रोक दी गई है (Quiz Paused)" : "Quiz Paused"}
                        </h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed px-2">
                            {session?.role === 'HOST' || isHost
                              ? (isHindi ? "आपने क्विज़ को अस्थायी रूप से रोका है। टाइमर सुरक्षित है। जब आप तैयार हों, पुनः शुरू करें।" : "You paused the battle. Resume whenever you're ready.")
                              : (isHindi ? "होस्ट द्वारा क्विज़ को थोड़ी देर के लिए रोका गया है। टाइमर सुरक्षित है, दोबारा शुरू होने की प्रतीक्षा करें।" : "Host has paused the quiz temporarily. Wait for it to resume.")}
                        </p>
                    </div>

                    {/* Live Squad Presence Strip */}
                    <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-base">💬</span>
                            <span className="font-bold">{isHindi ? "लाइव चैट सक्रिय है" : "Live Chat Active"}</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            👥 {participants?.length || 1} {isHindi ? "खिलाड़ी" : "Players"}
                        </span>
                    </div>

                    {/* Action Buttons: Host vs Guest */}
                    {(session?.role === 'HOST' || isHost) ? (
                        <div className="space-y-2.5 pt-1">
                            <button 
                                type="button"
                                onClick={() => { playSessionSound('pause'); sendAction('RESUME_SESSION', { isPaused: false }); }}
                                className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span className="text-base">▶️</span>
                                <span>{isHindi ? "क्विज़ पुनः शुरू करें (Resume Quiz)" : "Resume Live Quiz"}</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowAbortModal(true)}
                                className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 py-2.5 px-4 rounded-xl font-bold text-xs border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                            >
                                <span>🛑 {isHindi ? "सत्र समाप्त करें (End Session)" : "End Session"}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 pt-1">
                            <button 
                                type="button"
                                onClick={() => {
                                    const chatBtn = document.querySelector('[data-chat-toggle="true"]');
                                    if (chatBtn) chatBtn.click();
                                }}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-indigo-600/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span>💬</span>
                                <span>{isHindi ? "चैट करें" : "Open Chat"}</span>
                            </button>
                            <button 
                                type="button"
                                onClick={handleLeaveSession}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border border-slate-200 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span>🚪</span>
                                <span>{isHindi ? "बाहर निकलें" : "Leave"}</span>
                            </button>
                        </div>
                    )}
                 </div>
             </div>,
             document.body
          )}

          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start animate-in fade-in duration-300 px-3 sm:px-4 pb-16">
            
            <div className="w-full min-w-0">
                <Player 
                  key={`${session.sessionId || 'session'}-${session.activeContentId || 'quiz'}`} 
                  state={session} 
                  onLeave={handleLeaveSession}
                />
            </div>

            <div className="h-full min-w-0" id="squad-intelligence-panel">
                 <div className="sticky top-4 w-full">
                      <SquadronIntelligence />
                 </div>
            </div>
          </div>

          {/* 🚀 GLOBAL GLASSMORPHIC GUEST PORTAL (Portal Mounted) */}
          {isHost && pendingParticipants.length > 0 && mounted && createPortal(
             <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-500 pointer-events-auto">
                 <div className="bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/50 shadow-[0_50px_100px_rgba(0,0,0,0.5)] max-w-md w-full text-center space-y-8 relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <div className="space-y-2">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-xl">👋</div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">रूम में शामिल होने का अनुरोध</h3>
                        <p className="text-xs font-bold text-indigo-600">नए खिलाड़ी क्विज़ में शामिल होना चाहते हैं</p>
                    </div>
                    
                    <div className="space-y-3 max-h-[250px] overflow-y-auto px-1 custom-scrollbar">
                        {pendingParticipants.map((guest) => (
                            <div key={guest.userId} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm overflow-hidden">
                                        {guest.userImage ? (
                                            <img src={guest.userImage} alt={guest.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            guest.userName[0]
                                        )}
                                    </div>
                                    <div className="text-left font-black text-slate-900 text-sm flex items-center gap-1.5">
                                        <span>{guest.userName}</span>
                                        {guest.isReentry && (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                                पुनः प्रवेश
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { playSessionSound('fail'); handleDenyGuest(guest.userId); }} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold cursor-pointer" title="अस्वीकार करें">✕</button>
                                    <button onClick={() => { playSessionSound('success'); handleApproveGuest(guest.userId); }} className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all font-bold cursor-pointer" title="स्वीकार करें">✓</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">खिलाड़ी को लाइव क्विज़ में शामिल करने के लिए स्वीकार करें।</p>
                 </div>
             </div>,
             document.body
          )}

          {/* 🛰️ TACTICAL OVERLAYS */}
          {/* 1. Host Broadcast Notification */}
          <div className="fixed top-4 inset-x-0 pointer-events-none z-[9999] flex flex-col items-center px-4">
              <AnimatePresence>
                  {broadcast && (
                      <motion.div 
                          initial={{ y: -80, opacity: 0, scale: 0.95 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          exit={{ y: -80, opacity: 0, scale: 0.95 }}
                          className="w-full max-w-md pointer-events-auto shadow-2xl"
                      >
                          <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-white">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-sm shrink-0">
                                  📢
                                </span>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">होस्ट का संदेश</span>
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                                    {broadcast.text}
                                  </p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setBroadcast && setBroadcast(null)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs shrink-0 cursor-pointer"
                                title="बंद करें"
                              >
                                ✕
                              </button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {/* 2. Floating Live Emoji Reactions (Drifting from bottom across full viewport) */}
          <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
              <AnimatePresence>
                  {reactions.map((r) => (
                      <motion.div
                          key={r.id}
                          initial={{ y: '100vh', x: `${Math.random() * 75 + 10}vw`, opacity: 0, scale: 0.4 }}
                          animate={{ 
                            y: '-15vh', 
                            opacity: [0, 1, 1, 0.8, 0], 
                            scale: [0.4, 1.4, 1.6, 1.8],
                            x: [`${Math.random() * 75 + 10}vw`, `${(Math.random() * 75 + 10) + (Math.random() * 10 - 5)}vw`]
                          }}
                          transition={{ duration: 4.2, ease: "easeOut" }}
                          className="absolute text-4xl sm:text-6xl select-none flex flex-col items-center filter drop-shadow-lg"
                      >
                          <span>{r.emoji}</span>
                          {r.userName && (
                            <span className="text-[9px] sm:text-[10px] font-black text-white bg-slate-900/90 px-2.5 py-0.5 rounded-full text-center mt-1 capitalize shadow-md border border-white/20 whitespace-nowrap">
                              {r.userName}
                            </span>
                          )}
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
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in zoom-in duration-300 pointer-events-auto">
             <div className="bg-white/95 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-white/50 shadow-2xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="space-y-2">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-xl">👋</div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">रूम में शामिल होने का अनुरोध</h3>
                    <p className="text-xs font-bold text-indigo-600">नए खिलाड़ी शामिल होना चाहते हैं</p>
                </div>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto px-1 custom-scrollbar">
                    {pendingParticipants.map((guest) => (
                        <div key={guest.userId} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 overflow-hidden">
                                    {guest.userImage ? (
                                        <img src={guest.userImage} alt={guest.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        guest.userName[0]
                                    )}
                                </div>
                                <div className="text-left font-black text-slate-900 text-sm flex items-center gap-1.5">
                                    <span>{guest.userName}</span>
                                    {guest.isReentry && (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                            पुनः प्रवेश
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { playSessionSound('fail'); handleDenyGuest(guest.userId); }} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold cursor-pointer" title="अस्वीकार करें">✕</button>
                                <button onClick={() => { playSessionSound('success'); handleApproveGuest(guest.userId); }} className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all font-bold cursor-pointer" title="स्वीकार करें">✓</button>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400">खिलाड़ी को लाइव क्विज़ में शामिल करने के लिए स्वीकार करें।</p>
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
