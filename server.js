const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const redisStore = require('./src/engine/lib/redisStore.js').default;

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0'; // Use localhost for dev, bind to all for prod
const port = parseInt(process.env.PORT || '3000', 10);

// Ensure NextAuth + SEO base URLs match the actual dev port.
// This prevents Google OAuth callbacks from pointing to localhost:3000 when running on another port.
if (dev) {
  const baseUrl = `http://${hostname}:${port}`;
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || baseUrl;
  process.env.NEXTAUTH_URL_INTERNAL = process.env.NEXTAUTH_URL_INTERNAL || baseUrl;
  process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || baseUrl;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Redis store
// redisStore is already initialized from its module

app.prepare()
  .then(() => {
    const httpServer = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    const io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected:', socket.id);

      socket.on('JOIN_SESSION', async (data) => {
        const dirtySessionId = data.sessionId;
        const sessionId = typeof dirtySessionId === 'string' ? dirtySessionId.trim() : dirtySessionId;
        const { role, userId, userName } = data;
        
        if (!sessionId || !role || !userId) {
            console.error(`❌ [IO] Invalid JOIN_SESSION attempt:`, data);
            return;
        }

        console.log(`📡 [HANDSHAKE] ${userName} (${role}) | Socket: ${socket.id} | Mission: ${sessionId}`);

        // 1. IMMERSE socket in the tactical room immediately
        await socket.join(sessionId);

        // Allow socket.io internal buffers to clear (Crucial for HMR/Fast Refresh reliability)
        await new Promise(r => setTimeout(r, 100));

        let room = await redisStore.getRoom(sessionId);
        if (!room) {
            room = { 
                participants: [], 
                pendingParticipants: [], 
                messages: [], 
                state: { status: 'LOBBY', currentQuestion: 0, startTime: null },
                sessionId 
            };
            await redisStore.setRoom(sessionId, room);
            console.log(`📡 [INIT] New mission container created for ${sessionId}`);
        }

        if (role === 'HOST') {
            const existingIdx = room.participants.findIndex(p => p.userId === userId);
            const hostData = { 
                userId, 
                userName: userName || 'Commander', 
                role: 'HOST', 
                socketId: socket.id, 
                isOnline: true, 
                status: 'ACTIVE' 
            };

            if (existingIdx !== -1) {
                room.participants[existingIdx] = hostData;
            } else {
                room.participants.unshift(hostData);
            }
            console.log(`📡 [HOST] Commander ${userName} uplifted at ${socket.id}`);
            
            // Critical rehydration
            socket.emit('STATE_UPDATE', { 
                action: 'REHYDRATE', 
                payload: { ...room.state, sessionId, role, userId, userName } 
            });
        } else {
            // GUEST LOGIC
            const existingInSquad = room.participants.find(p => p.userId === userId);
            if (existingInSquad) {
                existingInSquad.socketId = socket.id;
                existingInSquad.isOnline = true;
                existingInSquad.status = 'ACTIVE';
                socket.emit('STATE_UPDATE', { action: 'APPROVED', payload: { ...room.state, status: 'APPROVED' } });
                console.log(`📡 [GUEST] Member ${userName} reconnected at ${socket.id}`);
            } else {
                // Refresh pending
                room.pendingParticipants = room.pendingParticipants.filter(p => p.userId !== userId);
                room.pendingParticipants.push({ 
                    userId, 
                    userName: userName || 'Refugee', 
                    socketId: socket.id, 
                    requestedAt: Date.now(), 
                    isOnline: true,
                    role: 'GUEST'
                });
                console.log(`📡 [GUEST] Request received from ${userName} (${socket.id}). Waiting for clearance.`);
                
                // Authoritative Targeted Alerts
                const host = room.participants.find(p => p.role === 'HOST');
                if (host && host.socketId) {
                    console.log(`📡 [SIGNAL] Sending direct pulse to host: ${host.socketId}`);
                    io.to(host.socketId).emit('GUEST_JOIN_REQUEST', { guestId: userId, guestName: userName });
                    io.to(host.socketId).emit('SYNC_PENDING', room.pendingParticipants);
                }
                
                socket.emit('STATE_UPDATE', { 
                    action: 'REHYDRATE', 
                    payload: { status: 'PENDING', message: 'Waiting for commander clearance...', sessionId, role, userId, userName } 
                });
            }
        }

        await redisStore.setRoom(sessionId, room);
        
        // 2. Authoritative Sync Blast
        console.log(`📡 [EMIT] Room ${sessionId} | Syncing ${room.participants.length} members & ${room.pendingParticipants.length} pending...`);
        io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
        io.to(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
        // Ensure robust fallback for chat property migration
        const chatHistory = room.messages || room.chatMessages || [];
        io.to(sessionId).emit('SYNC_CHAT', chatHistory);
        
        // Detailed room debug
        const roomSockets = await io.in(sessionId).fetchSockets();
        console.log(`📡 [DEBUG] Room: ${sessionId} | Active Sockets IN ROOM: ${roomSockets.length} | Host Socket: ${room.participants.find(p => p.role === 'HOST')?.socketId}`);
      });

        socket.on('SQUAD_SYNC_REQUEST', async ({ sessionId: rawSid }) => {
            const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
            const room = await redisStore.getRoom(sessionId);
            if (room) {
                socket.emit('SYNC_PARTICIPANTS', room.participants);
                socket.emit('SYNC_PENDING', room.pendingParticipants);
                console.log(`📡 [SYNC] Manual sync completed for ${sessionId}`);
            }
        });

        socket.on('FORCE_ROOM_SYNC', async ({ sessionId: rawSid }) => {
            const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
            const room = await redisStore.getRoom(sessionId);
            if (room) {
                io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                io.to(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                io.to(sessionId).emit('STATE_UPDATE', { action: 'REHYDRATE', payload: room.state });
                console.log(`📡 [FORCE_SYNC] Authoritative broadcast for room ${sessionId}`);
            }
        });

        socket.on('HOST_ACTION', async (data) => {
        const { sessionId: rawSid, action, payload } = data;
        const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
        const room = await redisStore.getRoom(sessionId);
        if (!room) return;

        if (action === 'APPROVE_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                // Move guest from pending to participants
                room.pendingParticipants.splice(guestIdx, 1);
                room.participants.push({
                    userId: guest.userId,
                    userName: guest.userName,
                    role: 'GUEST',
                    socketId: guest.socketId,
                    score: 0,
                    progress: 0,
                    isOnline: true
                });
                
                await redisStore.setRoom(sessionId, room);
                
                // Notify guest of approval
                if (guest.socketId) {
                    io.to(guest.socketId).emit('STATE_UPDATE', {
                        action: 'APPROVED',
                        payload: { status: 'APPROVED', message: 'You have been approved to join the session!' }
                    });
                }
                
                // Update all participants
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            }
        }
        
        if (action === 'DENY_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                
                await redisStore.setRoom(sessionId, room);
                
                // Notify guest of denial
                if (guest.socketId) {
                    io.to(guest.socketId).emit('STATE_UPDATE', {
                        action: 'DENIED',
                        payload: { status: 'DENIED', message: 'Your request to join was denied by the host.' }
                    });
                }
                
                // Update all pending participants
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            }
        }
        
        
        if (action === 'REJECT_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                
                io.to(guest.socketId).emit('STATE_UPDATE', { action: 'CLEARANCE_DENIED', payload: { status: 'REJECTED' } });
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                console.log(`???? Rejected: ${guest.userName}`);
            }
            return;
        }

        if (action === 'KICK_PARTICIPANT') {
            const pIdx = room.participants.findIndex(p => p.userId === payload.userId);
            if (pIdx !== -1) {
                const p = room.participants[pIdx];
                p.status = 'KICKED';
                p.isOnline = false;
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                
                io.to(p.socketId).emit('STATE_UPDATE', { action: 'DISCONTINUED', payload: { status: 'KICKED' } });
                const pSocket = io.sockets.sockets.get(p.socketId);
                if (pSocket) pSocket.leave(sessionId);
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                console.log(`???? KICKED OFF: ${p.userName}`);
            }
            return;
        }
        
        if (action === 'TERMINATE') {
            room.state.status = 'TERMINATED';
            room.terminatedAt = Date.now();
            await redisStore.setRoom(sessionId, room);
            
            io.in(sessionId).emit('STATE_UPDATE', { action: 'TERMINATED', payload: room.state });
            
            // Immediate purge for reuse/safety
            setTimeout(async () => {
                await redisStore.deleteRoom(sessionId);
                console.log(`📡 Room ${sessionId} purged after termination.`);
            }, 5000); // 5s grace period for client redirect animations
            return;
        }

        room.state = { ...room.state, ...payload };
        if (action === 'START_SESSION') {
            room.participants.forEach(p => { 
                p.score = 0; 
                p.progress = 0;
                p.status = 'ACTIVE';
            });
            // Update the room state in storage
            await redisStore.setRoom(sessionId, room);
            // Broadcast initial sync
            io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
        }
        // Broadcast updated state to all participants
        console.log(`📡 [SERVER] Broadcasting ${action} to room ${sessionId}. Type: ${room.state.type}`);
        io.in(sessionId).emit('STATE_UPDATE', { action, payload: room.state });
      });

      socket.on('SEND_CHAT', async (data) => {
        try {
            const { sessionId: rawSid, userId, userName, text, role } = data;
            const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
            const room = await redisStore.getRoom(sessionId);
            
            if (room) {
                const msg = { 
                    id: Date.now() + Math.random().toString(36).substr(2, 5),
                    userId, userName, text, role, 
                    timestamp: new Date().toISOString() 
                };
                
                // Standardize on .messages property
                if (!room.messages) room.messages = room.chatMessages || [];
                room.messages.push(msg);
                if (room.messages.length > 50) room.messages.shift();
                
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                
                console.log(`💬 [CHAT_SIGNAL] ${userName} in ${sessionId}: ${text}`);
                
                // DUAL SIGNAL BROADCAST:
                // 1. Authoritative history sync (Array)
                io.to(sessionId).emit('SYNC_CHAT', room.messages);
                // 2. Individual message pulse (Single Object) - More robust for live sync
                io.to(sessionId).emit('CHAT_SIGNAL', msg);
            }
        } catch (err) {
            console.error('❌ [SERVER] Chat Emission Error:', err);
        }
      });

      socket.on('SEND_REACTION', (data) => {
        const { sessionId, userId, userName, emoji } = data;
        io.in(sessionId).emit('MISSION_REACTION', { userId, userName, emoji });
      });

      socket.on('SEND_BROADCAST', (data) => {
        const { sessionId, text } = data;
        io.in(sessionId).emit('MISSION_BROADCAST', { text, type: 'PROCLAMATION' });
      });

      socket.on('UPDATE_STATUS', async (data) => {
        const { sessionId: rawSid, userId, status } = data;
        const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
        const room = await redisStore.getRoom(sessionId);
        if (room && room.participants) {
            const p = room.participants.find(p => p.userId === userId);
            if (p) {
                p.status = status;
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            }
        }
      });

      socket.on('SUBMIT_SCORE', async (data) => {
        const { sessionId: rawSid, userId, score, progress } = data;
        const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
        const room = await redisStore.getRoom(sessionId);
        if (room && room.participants) {
            const p = room.participants.find(p => p.userId === userId);
            if (p) {
                p.score = score;
                p.progress = progress;
                // If they are submitting score, they are Active
                if (p.status !== 'ACTIVE') p.status = 'ACTIVE'; 
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            }
        }
      });

      socket.on('disconnect', async () => {
        const allRooms = await redisStore.getAllRooms();
        for (const room of allRooms) {
          const sessionId = room.sessionId;
          if (!sessionId) continue;
          
          let updated = false;
          
          const idx = room.participants.findIndex(p => p.socketId === socket.id);
          if (idx !== -1) {
            room.participants[idx].isOnline = false;
            room.participants[idx].status = 'AWAY';
            updated = true;
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            console.log(`📡 Participant ${room.participants[idx].userName} went offline (Room: ${sessionId})`);
          }
          
          const pIdx = room.pendingParticipants.findIndex(p => p.socketId === socket.id);
          if (pIdx !== -1) {
              room.pendingParticipants[pIdx].isOnline = false;
              updated = true;
              io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
              console.log(`📡 Pending Guest ${room.pendingParticipants[pIdx].userName} went offline.`);
          }
          
          if (updated) {
            await redisStore.setRoom(sessionId, room);
            break; // Socket associated with one room at a time usually
          }
        }
      });
    });

    httpServer.listen(port, () => {
      console.log(`🚀 Engine Live: http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ FATAL: Next.js preparation failed:', err);
    process.exit(1);
  });
