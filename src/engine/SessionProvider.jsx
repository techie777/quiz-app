"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';

const SessionContext = createContext(null);

/**
 * SESSION PROVIDER V2.4 - Commander Security Edition
 * Added Pending Approval handling and Kick/Disconnect protocols.
 */

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]); // { id, emoji, userId, userName }
  const [broadcast, setBroadcast] = useState(null); // { text, type }
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [connectionError, setConnectionError] = useState(null);
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
      console.log('???? Session Provider: Socket connected successfully');
    });

    s.on('connect_error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);
      console.error('???? Session Provider: Connection failed:', error.message);
      toast.error(`Connection failed: ${error.message}`);
    });

    s.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      console.warn('???? Session Provider: Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        s.connect();
      }
    });

    s.on('STATE_UPDATE', (data) => {
      setSession(prev => {
         const newState = { 
            ...prev, 
            ...data.payload,
            role: prev?.role || data.payload?.role,
            sessionId: prev?.sessionId || data.payload?.sessionId,
            userId: prev?.userId || data.payload?.userId 
         };

         // Security Triggers
         if (data.action === 'CLEARANCE_DENIED') {
            toast.error("MISSION CLEARANCE DENIED BY COMMANDER. ????");
         }
         if (data.action === 'DISCONTINUED') {
            toast.error("MISSION TERMINATED: YOU HAVE BEEN DISMISSED. ????");
         }

         return newState;
      });

      if (data.action === 'START_SESSION') {
        toast.success("MISSION LAUNCHED! ???");
      }
    });

    s.on('SYNC_PARTICIPANTS', (list) => {
      console.log('???? [SYNC] Active Squadron:', list.length);
      setParticipants(list);
    });

    s.on('SYNC_PENDING', (list) => {
      console.log('💂 [SYNC] Pending Clearances:', list.length);
      setPendingParticipants(list);
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
      socketService.disconnect();
    };
  }, []);

  const joinSession = useCallback((sessionId, role, user) => {
    if (socket) {
      const finalUserId = user.id || `guest_${Math.random().toString(36).substring(7)}`;
      const finalUserName = user.name || 'Anonymous';
      
      socket.emit('JOIN_SESSION', {
        sessionId,
        role,
        userId: finalUserId,
        userName: finalUserName
      });
      
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
      joinSession, 
      sendAction, 
      sendChatMessage,
      sendReaction,
      sendBroadcast
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionEngine = () => useContext(SessionContext);
