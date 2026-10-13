"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';

import { useLanguage } from '@/context/LanguageContext';

const SessionContext = createContext(null);

/**
 * SESSION PROVIDER V2.4 - Commander Security Edition
 * Added Pending Approval handling and Kick/Disconnect protocols.
 */

export function SessionProvider({ children, sessionId: propSessionId }) {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [lastEvent, setLastEvent] = useState('STANDBY');
  const [pulse, setPulse] = useState(false);
  const [reactions, setReactions] = useState([]); // { id, emoji, userId, userName }
  const [broadcast, setBroadcast] = useState(null); // { text, type }
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [connectionError, setConnectionError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const sessionRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    setConnectionStatus('connecting');
    setConnectionError(null);
    
    const s = socketService.connect();
    setSocket(s);

    if (s.connected) {
      setConnectionStatus('connected');
      console.log('📡 Session Provider: Socket already connected, ID:', s.id);
    }

    // Enhanced connection monitoring
    s.on('connect', () => {
      setConnectionStatus('connected');
      setConnectionError(null);
      console.log('📡 Session Provider: Socket connected successfully');
      
      // AUTO-REJOIN ON RECONNECT
      const current = sessionRef.current;
      if (current?.sessionId && current?.userId) {
        // STRICT VALIDATION: Only rejoin if the session ID matches the prop (URL)
        if (propSessionId && current.sessionId !== propSessionId) {
            console.warn('📡 [SECURITY] Blocked re-join pulse to ghost session:', current.sessionId);
            return;
        }

        console.log('📡 Re-emitting JOIN_SESSION for:', current.userId, current.rollNumber ? `(Roll: ${current.rollNumber})` : '');
        s.emit('JOIN_SESSION', {
          sessionId: current.sessionId,
          role: current.role,
          userId: current.userId,
          userName: current.userName,
          rollNumber: current.rollNumber,
          isB2B: current.isB2B
        });
      }
    });

    // Aggressive Commander Pulse (Host Only)
    const syncInterval = setInterval(() => {
      const current = sessionRef.current;
      if (current?.role === 'HOST' && current?.sessionId === propSessionId) {
        console.log('📡 [PULSE] Commander Sync Pulse...');
        socketService.getSocket()?.emit('SQUAD_SYNC_REQUEST', { sessionId: current.sessionId });
      }
    }, 5000); // 5s pulse
    
    // REHYDRATE FROM STORAGE ON MOUNT (Scoped to propSessionId)
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('active_quiz_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          if (propSessionId && parsed.sessionId !== propSessionId) {
             console.warn('📡 [BRIDGE] Ghost Mission Detected. Purging storage for:', parsed.sessionId);
             sessionStorage.removeItem('active_quiz_session');
          } else {
             console.log('📡 [RESTORE] Mission found in local uplink:', parsed.sessionId);
             setSession(parsed);
             sessionRef.current = parsed; // CRITICAL: Fix race condition for immediate connect listener
             
             // Trigger immediate join if socket is ready
             if (s.connected) {
               s.emit('JOIN_SESSION', parsed);
             }
          }
        } catch (e) {
          console.warn('📡 Failed to rehydrate mission from storage');
        }
      }
    }

    s.on('connect_error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);
      console.error('???? Session Provider: Connection failed:', error.message);
      toast.error(`${t('live.toasts.connFailed')}: ${error.message}`);
    });

    s.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      console.warn('📡 Session Provider: Disconnected:', reason);
      if (reason === 'io server disconnect') {
        s.connect();
      }
    });

    s.on('STATE_UPDATE', (data) => {
      console.log('📡 [BRIDGE] STATE_UPDATE Recv:', data.action, data.payload);
      setSessionReady(true);
      
      // RULE #1: Reset scores if a new session is starting
      if (data.action === 'START_SESSION') {
          console.log('📡 [RESET] Mission Restart detected. Zeroing squadron scores.');
          setParticipants(prev => prev.map(p => ({ ...p, score: 0, progress: 0, status: 'ACTIVE' })));
      }

      setSession(prev => {
         const isKicked = data.action === 'KICKED' || data.payload?.status === 'KICKED' || data.payload?.isKicked || data.action === 'DISCONTINUED' || data.payload?.status === 'DISCONTINUED';
         const newState = { 
            ...prev, 
            ...data.payload,
            userId: (data.action === 'REHYDRATE' || !prev?.userId) ? (data.payload?.userId || prev?.userId) : prev?.userId,
            userName: (data.action === 'REHYDRATE' || !prev?.userName) ? (data.payload?.userName || prev?.userName) : prev?.userName,
            role: (data.action === 'REHYDRATE' || !prev?.role) ? (data.payload?.role || prev?.role) : prev?.role,
            status: isKicked ? 'KICKED' : ((data.action === 'DENIED' || prev?.status === 'DENIED') ? 'DENIED' : (data.payload?.status || prev?.status)),
            isKicked: isKicked ? true : (data.payload?.isKicked ?? prev?.isKicked ?? false),
            type: data.payload?.type || prev?.type,
            activeContentId: data.payload?.activeContentId || prev?.activeContentId,
            sessionId: data.payload?.sessionId || prev?.sessionId,
            isPaused: data.payload?.hasOwnProperty('isPaused') ? data.payload.isPaused : prev?.isPaused
         };

         if (typeof window !== 'undefined' && newState.sessionId) {
            if (data.action === 'TERMINATED' || newState.status === 'TERMINATED') {
               localStorage.removeItem(`quiz_callsign_${newState.sessionId}`);
               localStorage.removeItem(`quiz_uid_${newState.sessionId}`);
               sessionStorage.removeItem('active_quiz_session');
            } else if (!isKicked) {
               sessionStorage.setItem('active_quiz_session', JSON.stringify(newState));
            }
         }
         return newState;
      });

      // Track action for status watcher (side effects handled by useEffect)
      setLastEvent(`STATE:${data.action}`);
    });

    s.on('SYNC_PARTICIPANTS', (list) => {
      console.log('📡 [SYNC] Active Squadron:', list.length);
      setSessionReady(true);
      setParticipants(list);

      // FAIL-SAFE: Only handle non-B2B guests where host explicitly purged them
      const current = sessionRef.current;
      const isB2BStudent = current?.isB2B || !!current?.rollNumber;
      if (!isB2BStudent && current?.role === 'GUEST' && current?.status !== 'PENDING' && current?.status !== 'KICKED' && !current?.isSoloMode) {
          const amIAuthorized = list.find(p => p.userId === current.userId);
          if (!amIAuthorized && list.length > 0) {
              console.warn('📡 [SECURITY] Non-B2B guest missing from mission authorization. Setting KICKED state...');
              setSession(prev => ({ ...prev, status: 'KICKED', isKicked: true }));
              setLastEvent('STATE:KICKED');
          }
      }
    });

    s.on('SYNC_PENDING', (list) => {
      console.log('💂 [SYNC] Pending Clearances:', list.length);
      setPendingParticipants(list);
    });

    s.on('GUEST_JOIN_REQUEST', (data) => {
      console.log('💂 [ALERT] Targeted Join Request:', data.guestName);
      // Self-correction pulse
      s.emit('SQUAD_SYNC_REQUEST', { sessionId: sessionRef.current?.sessionId });
    });

    s.on('PARTICIPANT_JOINED', (data) => {
      if (data?.userName) {
        toast.success(`Guest ${data.userName} joined the room ✨`);
      }
    });

    s.on('PARTICIPANT_LEFT', (data) => {
      if (data?.userName) {
        toast(`Guest ${data.userName} left the room 👋`, { icon: '🚪' });
      }
    });

    s.on('PARTICIPANT_KICKED', (data) => {
      if (data?.userName) {
        toast.error(`Guest ${data.userName} was kicked out from the quiz room 🚫`);
      }
    });

    s.on('SYNC_CHAT', (msgs) => {
      console.log('💬 [CLIENT] Chat Sync received:', msgs.length, 'messages');
      setLastEvent('CHAT_SYNC');
      setChatMessages(msgs);
    });

    s.on('CHAT_SIGNAL', (msg) => {
      console.log('💬 [CLIENT] Individual Signal received:', msg.text);
      setLastEvent('SIGNAL_RECV');
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
      setChatMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
      });
    });

    s.on('MISSION_REACTION', (data) => {
      setLastEvent('REACTION');
      setReactions(prev => [...prev.slice(-10), { ...data, id: Date.now() + Math.random() }]);
    });

    s.on('MISSION_BROADCAST', (data) => {
      setBroadcast(data);
      if (data) {
        setTimeout(() => setBroadcast(null), 8000); // Auto-clear broadcast after 8s
      }
    });

    return () => {
      clearInterval(syncInterval);
      socketService.disconnect();
    };
  }, [propSessionId, t]);

  // STATUS WATCHER - Prevents dual toasts by tracking status/action transitions
  const lastEffectRef = useRef(null);
  useEffect(() => {
    if (!session?.sessionId || !lastEvent) return;
    
    const effectKey = `${session.sessionId}-${lastEvent}`;
    if (lastEffectRef.current === effectKey) return;
    lastEffectRef.current = effectKey;

    if (lastEvent === 'STATE:TERMINATED') {
       toast.error(t('live.toasts.terminated'));
    } else if (lastEvent === 'STATE:START_SESSION') {
       toast.success(t('live.toasts.launched'));
    } else if (lastEvent === 'STATE:CLEARANCE_DENIED' || lastEvent === 'STATE:WAITING_FOR_HOST') {
       toast(t('live.toasts.waitingForHost'));
    } else if (lastEvent === 'STATE:KICKED') {
       toast.error("आपको एडमिन द्वारा निकाला गया है (Kicked by admin) 🚫", { duration: 5000 });
    } else if (lastEvent === 'STATE:DISCONTINUED') {
       toast.error("सत्र समाप्त हो गया है। भाग लेने के लिए धन्यवाद! 👋", { duration: 4000 });
    } else if (lastEvent === 'STATE:PENDING_APPROVAL') {
       toast(t('live.toasts.waitingApproval'));
    } else if (lastEvent === 'STATE:APPROVED') {
       toast.success(t('live.toasts.approved'));
    } else if (lastEvent === 'STATE:DENIED') {
       toast.error(t('live.toasts.denied'));
    }
  }, [session?.sessionId, lastEvent, t]);

  const joinSession = useCallback((sessionId, role, user) => {
    if (socket) {
      const finalUserId = user.id || `guest_${Math.random().toString(36).substring(7)}`;
      const finalUserName = user.name || 'Anonymous';
      const finalUserImage = user.image || user.avatar || null;
      
      console.log('📡 [BRIDGE] JOIN_SESSION Initializing:', { sessionId, role, finalUserId });
      
      // OPTIMISTIC UPDATE for Host to prevent UI lockup
      if (role === 'HOST') {
        console.log('📡 [BRIDGE] Optimistic readiness for Host');
        setSessionReady(true);
        setParticipants(prev => {
          if (prev.find(p => p.userId === finalUserId)) return prev;
          return [{
            userId: finalUserId,
            userName: finalUserName,
            userImage: finalUserImage,
            role: 'HOST',
            isOnline: true
          }, ...prev];
        });
      } else {
        setSessionReady(false);
      }

      const finalRollNumber = user.rollNumber || null;
      const finalIsB2B = Boolean(user.isB2B);

      socket.emit('JOIN_SESSION', {
        sessionId,
        role,
        userId: finalUserId,
        userName: finalUserName,
        userImage: finalUserImage,
        rollNumber: finalRollNumber,
        isB2B: finalIsB2B
      });
      console.log('📡 [BRIDGE] JOIN_SESSION Emitted:', sessionId, role, finalRollNumber ? `Roll: ${finalRollNumber}` : '');
      
      setSession({ 
        sessionId, 
        role, 
        status: 'LOBBY', 
        userId: finalUserId, 
        userName: finalUserName,
        userImage: finalUserImage,
        rollNumber: finalRollNumber,
        isB2B: finalIsB2B
      });
    }
  }, [socket]);

  const sendAction = useCallback((action, payload = {}) => {
    const current = sessionRef.current;
    if (socket && current?.role === 'HOST') {
      socket.emit('HOST_ACTION', {
        sessionId: current.sessionId,
        action,
        payload
      });
      
      // OPTIMISTIC UPDATES: Instantly remove the participant from the Host's view
      if (action === 'KICK_PARTICIPANT') {
          setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
      }

      // Optimistic update for mission state only (NOT administrative actions)
      const administrativeActions = ['APPROVE_GUEST', 'REJECT_GUEST', 'KICK_PARTICIPANT'];
      if (!administrativeActions.includes(action)) {
        setSession(prev => ({ ...prev, ...payload }));
      }
    }
  }, [socket]);

  const sendChatMessage = useCallback((text) => {
    const current = sessionRef.current;
    if (socket && current?.userId && current?.sessionId) {
      console.log('📡 [CLIENT] Emitting SEND_CHAT:', text);
      socket.emit('SEND_CHAT', {
        sessionId: current.sessionId.trim(),
        userId: current.userId,
        userName: current.userName,
        role: current.role,
        text
      });
    } else {
      console.warn('📡 [CLIENT] SEND_CHAT blocked - missing socket or identity');
      toast.error("Comms link unstable. Reconnecting...");
    }
  }, [socket]);

  const sendReaction = useCallback((emoji) => {
    const current = sessionRef.current;
    if (socket && current?.userId && current?.sessionId) {
      socket.emit('SEND_REACTION', {
        sessionId: current.sessionId,
        userId: current.userId,
        userName: current.userName,
        emoji
      });
    }
  }, [socket]);

  const sendBroadcast = useCallback((text) => {
    const current = sessionRef.current;
    if (socket && current?.role === 'HOST' && current?.sessionId) {
      socket.emit('SEND_BROADCAST', {
        sessionId: current.sessionId,
        text
      });
    }
  }, [socket]);

  const syncSquad = useCallback(() => {
    const current = sessionRef.current;
    if (socket && current?.sessionId) {
      socket.emit('SQUAD_SYNC_REQUEST', { sessionId: current.sessionId });
    }
  }, [socket]);

  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtxClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  }, []);

  // 🔊 AUDIO ENGINE V2.0
  const playSessionSound = (type) => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type) {
            case 'ting': // Chat / Notification
            case 'chat':
            case 'notify':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1318.51, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime); // Reduced volume
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
                break;
            case 'click': // Tactile Button Feedback
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2000, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
                break;
            case 'launch': // Mission Initiation Sweep
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.8);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
                break;
            case 'pause': // Mission State Change (Pause/Resume)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
                break;
            case 'fail': // Incorrect Answer / Denial
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
                break;
            case 'join': // New Player
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
                break;
            case 'leave': // Player Disconnection
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
                break;
            case 'tick': // 10s Timer Warning
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
                break;
            case 'success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
                break;
        }
    } catch (e) {
        console.warn('Audio Engine Failure:', e);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const s = socket;

    s.on('GUEST_JOINED', (data) => {
        console.log('💂 [SYNC] Guest Joined:', data.userName);
        playSessionSound('join');
        s.emit('SQUAD_SYNC_REQUEST', { sessionId: sessionRef.current?.sessionId });
    });

    s.on('PARTICIPANT_LEFT', (data) => {
        console.log('🏃 [SYNC] Participant Left:', data.userId);
        playSessionSound('leave');
        s.emit('SQUAD_SYNC_REQUEST', { sessionId: sessionRef.current?.sessionId });
    });

    s.on('NEW_MESSAGE', (data) => {
        if (data.userId !== sessionRef.current?.userId) {
            playSessionSound('chat');
        }
    });

    return () => {
        s.off('GUEST_JOINED');
        s.off('PARTICIPANT_LEFT');
        s.off('NEW_MESSAGE');
    };
  }, [socket]);

  const requestReentry = useCallback(() => {
    if (socket && session?.sessionId && session?.userId) {
      socket.emit('REQUEST_REENTRY', {
        sessionId: session.sessionId,
        userId: session.userId,
        userName: session.userName
      });
      setSession(prev => ({
        ...prev,
        status: 'PENDING_REENTRY',
        isReentryPending: true
      }));
      toast.success("पुनः प्रवेश का अनुरोध एडमिन को भेजा गया (Re-entry requested) ⏳");
    }
  }, [socket, session?.sessionId, session?.userId, session?.userName]);

  const continueAlone = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isKicked: false,
      isSoloMode: true,
      status: 'ACTIVE'
    }));
    toast.success("सोलो मोड सक्रिय: आप अकेले क्विज़ पूरा कर सकते हैं! 🎯");
  }, []);

  return (
    <SessionContext.Provider value={{ 
      session, 
      setSession,
      participants, 
      pendingParticipants, 
      chatMessages, 
      reactions,
      broadcast,
      setBroadcast,
      lastEvent,
      pulse,
      connectionStatus,
      connectionError,
      sessionReady,
      socket,
      joinSession, 
      sendAction, 
      sendChatMessage,
      sendReaction,
      sendBroadcast,
      syncSquad,
      playSessionSound,
      requestReentry,
      continueAlone
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionEngine = () => useContext(SessionContext);
