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
  const [socket, setSocket] = useState(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const s = socketService.connect();
    setSocket(s);

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
            toast.error("MISSION CLEARANCE DENIED BY COMMANDER. 🚫");
         }
         if (data.action === 'DISCONTINUED') {
            toast.error("MISSION TERMINATED: YOU HAVE BEEN DISMISSED. 🛑");
         }

         return newState;
      });

      if (data.action === 'START_SESSION') {
        toast.success("MISSION LAUNCHED! 🚀");
      }
    });

    s.on('SYNC_PARTICIPANTS', (list) => {
      console.log('👥 [SYNC] Active Squadron:', list.length);
      setParticipants(list);
    });

    s.on('SYNC_PENDING', (list) => {
      console.log('💂 [SYNC] Pending Clearances:', list.length);
      setPendingParticipants(list);
    });

    s.on('PARTICIPANT_JOINED', (data) => {
      toast.success(`${data.userName} joined the Squadron!`);
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

  return (
    <SessionContext.Provider value={{ session, participants, pendingParticipants, joinSession, sendAction }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionEngine = () => useContext(SessionContext);
