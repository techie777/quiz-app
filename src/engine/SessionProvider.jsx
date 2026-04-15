"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';

const SessionContext = createContext(null);

/**
 * SESSION PROVIDER V2.4 - Commander Security Edition
 * Added Pending Approval handling and Kick/Disconnect protocols.
 */

export function SessionProvider({ children, sessionId: propSessionId }) {
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
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

        console.log('📡 Re-emitting JOIN_SESSION for:', current.userId);
        s.emit('JOIN_SESSION', {
          sessionId: current.sessionId,
          role: current.role,
          userId: current.userId,
          userName: current.userName
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
      toast.error(`Connection failed: ${error.message}`);
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
      
      setSession(prev => {
         const newState = { 
            ...prev, 
            ...data.payload,
            // Ensure server-sent status and type ALWAYS take precedence
            status: data.payload?.status || prev?.status,
            type: data.payload?.type || prev?.type,
            sessionId: data.payload?.sessionId || prev?.sessionId,
            userId: data.payload?.userId || prev?.userId 
         };

         // PERSIST TO STORAGE
         if (typeof window !== 'undefined' && newState.sessionId) {
            sessionStorage.setItem('active_quiz_session', JSON.stringify(newState));
         }

         // If mission terminated
         if (data.action === 'TERMINATED') {
            toast.error("MISSION TERMINATED BY COMMANDER.");
         }
         
         // Ensure status PENDING is handled but kept ready for UI
         if (data.payload?.status === 'PENDING') {
            setSessionReady(true);
         }

         // Security Triggers
         if (data.action === 'CLEARANCE_DENIED') {
            toast("Waiting for host to create this session...");
         }
         if (data.action === 'DISCONTINUED') {
            toast.error("MISSION TERMINATED: YOU HAVE BEEN DISMISSED. ????");
         }
         if (data.action === 'WAITING_FOR_HOST') {
            toast("Waiting for host to create this session...");
         }
         if (data.action === 'PENDING_APPROVAL') {
            toast("Waiting for host approval...");
         }
         if (data.action === 'APPROVED') {
            toast.success("You have been approved to join the session!");
         }
         if (data.action === 'DENIED') {
            toast.error("Your request to join was denied by the host.");
         }

         return newState;
      });

      if (data.action === 'START_SESSION') {
        toast.success("MISSION LAUNCHED! ???");
      }
    });

    s.on('SYNC_PARTICIPANTS', (list) => {
      console.log('???? [SYNC] Active Squadron:', list.length);
      setSessionReady(true);
      setParticipants(list);
    });

    s.on('SYNC_PENDING', (list) => {
      console.log('💂 [SYNC] Pending Clearances:', list.length);
      setPendingParticipants(list);
    });

    s.on('GUEST_JOIN_REQUEST', (data) => {
      console.log('💂 [ALERT] Targeted Join Request:', data.guestName);
      toast(`💂 ${data.guestName} requesting clearance!`, { icon: '📑', duration: 5000 });
      // Self-correction pulse
      s.emit('SQUAD_SYNC_REQUEST', { sessionId: sessionRef.current?.sessionId });
    });

    s.on('PARTICIPANT_JOINED', (data) => {
      toast.success(`${data.userName} joined the Squadron!`);
    });

    s.on('SYNC_CHAT', (msgs) => {
      setChatMessages(msgs);
    });

    s.on('MISSION_REACTION', (data) => {
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
  }, [propSessionId]);

  const joinSession = useCallback((sessionId, role, user) => {
    if (socket) {
      const finalUserId = user.id || `guest_${Math.random().toString(36).substring(7)}`;
      const finalUserName = user.name || 'Anonymous';
      
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
            role: 'HOST',
            isOnline: true
          }, ...prev];
        });
      } else {
        setSessionReady(false);
      }

      socket.emit('JOIN_SESSION', {
        sessionId,
        role,
        userId: finalUserId,
        userName: finalUserName
      });
      console.log('📡 [BRIDGE] JOIN_SESSION Emitted:', sessionId, role);
      
      setSession({ 
        sessionId, 
        role, 
        status: 'LOBBY', 
        userId: finalUserId, 
        userName: finalUserName 
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
      socket.emit('SEND_CHAT', {
        sessionId: current.sessionId,
        userId: current.userId,
        userName: current.userName,
        role: current.role,
        text
      });
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

  return (
    <SessionContext.Provider value={{ 
      session, 
      participants, 
      pendingParticipants, 
      chatMessages, 
      reactions,
      broadcast,
      connectionStatus,
      connectionError,
      sessionReady,
      socket,
      joinSession, 
      sendAction, 
      sendChatMessage,
      sendReaction,
      sendBroadcast,
      syncSquad
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionEngine = () => useContext(SessionContext);
