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
let rooms = new Map(); // Fallback in-memory storage

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
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected:', socket.id);

      socket.on('JOIN_SESSION', async (data) => {
        const { sessionId, role, userId, userName } = data;
        
        let room = await redisStore.getRoom(sessionId);
        
        if (!room) {
            if (role === 'HOST') {
                room = { 
                    participants: [], 
                    pendingParticipants: [],
                    messages: [],
                    state: { status: 'LOBBY', type: 'QUIZ', timeLimit: 0 },
                    createdAt: Date.now()
                };
                await redisStore.setRoom(sessionId, room);
            } else {
                socket.emit('STATE_UPDATE', { action: 'EXPIRED', payload: { status: 'EXPIRED' } });
                return;
            }
        }

        if (role === 'HOST') {
            socket.join(sessionId);
            const existsIdx = room.participants.findIndex(p => p.userId === userId);
            if (existsIdx !== -1) {
                room.participants[existsIdx].socketId = socket.id;
                room.participants[existsIdx].isOnline = true;
            } else {
                room.participants.push({ 
                    userId, userName, role, socketId: socket.id,
                    score: 0, progress: 0, isOnline: true
                });
            }
            // Save to Redis
            await redisStore.setRoom(sessionId, room);
            
            // Broadcast active list to everyone in the room
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            socket.emit('STATE_UPDATE', { action: 'REHYDRATE', payload: room.state });
            
            // SECURITY SYNC: Force-push current pending list to the host immediately
            socket.emit('SYNC_PENDING', room.pendingParticipants);
            console.log(` Commander ${userName} joined room ${sessionId}. Pending queue sent: ${room.pendingParticipants.length}`);
        } else {
            // GUEST SECURITY: Put in pending first
            const guestExists = room.pendingParticipants.find(p => p.userId === userId);
            if (!guestExists) {
                room.pendingParticipants.push({ userId, userName, role, socketId: socket.id });
            } else {
                // Update socket id if they rejoined
                const g = room.pendingParticipants.find(p => p.userId === userId);
                g.socketId = socket.id;
            }
            // Save to Redis
            await redisStore.setRoom(sessionId, room);
            
            // CRITICAL BROADCAST: Notify all HOSTS in the room about the new guest
            console.log(` Guest ${userName} requesting clearance for room ${sessionId}. Broadcasting to room...`);
            io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            socket.emit('STATE_UPDATE', { action: 'PENDING_CLEARANCE', payload: { status: 'PENDING' } });
        }
      });

      socket.on('HOST_ACTION', async (data) => {
        const { sessionId, action, payload } = data;
        const room = await redisStore.getRoom(sessionId);
        if (!room) return;

        if (action === 'APPROVE_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                room.participants.push({ ...guest, score: 0, progress: 0, isOnline: true });
                
                // Save to Redis
                await redisStore.setRoom(sessionId, room);
                
                io.to(guest.socketId).emit('STATE_UPDATE', { action: 'REHYDRATE', payload: room.state });
                const guestSocket = io.sockets.sockets.get(guest.socketId);
                if (guestSocket) guestSocket.join(sessionId);

                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                console.log(`???? Approved: ${guest.userName}`);
            }
            return;
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
            // Save to Redis
            await redisStore.setRoom(sessionId, room);
            
            io.in(sessionId).emit('STATE_UPDATE', { action: 'TERMINATED', payload: room.state });
            setTimeout(async () => {
                const checkRoom = await redisStore.getRoom(sessionId);
                if (checkRoom && checkRoom.state.status === 'TERMINATED') {
                    await redisStore.deleteRoom(sessionId);
                    console.log(`???? Room ${sessionId} purged.`);
                }
            }, 30000);
            return;
        }

        room.state = { ...room.state, ...payload };
        if (action === 'START_SESSION') {
            room.participants.forEach(p => { p.score = 0; p.progress = 0; });
        }
        // Save to Redis
        await redisStore.setRoom(sessionId, room);
        
        if (action === 'START_SESSION') {
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
        }
        io.in(sessionId).emit('STATE_UPDATE', { action, payload });
      });

      socket.on('SEND_CHAT', async (data) => {
        const { sessionId, userId, userName, text, role } = data;
        const room = await redisStore.getRoom(sessionId);
        if (room) {
            const msg = { 
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                userId, userName, text, role, 
                timestamp: new Date().toISOString() 
            };
            room.messages.push(msg);
            if (room.messages.length > 50) room.messages.shift();
            // Save to Redis
            await redisStore.setRoom(sessionId, room);
            
            io.in(sessionId).emit('SYNC_CHAT', room.messages);
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
        const { sessionId, userId, status } = data;
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
        const { sessionId, userId, score, progress } = data;
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
          // Find sessionId from room data or skip
          const sessionId = room.sessionId || 'unknown';
          if (sessionId === 'unknown') continue;
          
          let updated = false;
          
          const idx = room.participants.findIndex(p => p.socketId === socket.id);
          if (idx !== -1) {
            const p = room.participants[idx];
            // Always mark as offline instead of removing to allow for reconnection grace periods
            p.isOnline = false;
            p.status = 'AWAY';
            updated = true;
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            console.log(`📡 Participant ${p.userName} went offline (Room: ${sessionId})`);
          }
          
          const pIdx = room.pendingParticipants.findIndex(p => p.socketId === socket.id);
          if (pIdx !== -1) {
              const p = room.pendingParticipants[pIdx];
              // For pending guests, we still mark offline so the host knows they dropped
              // but we don't necessarily need to keep them forever.
              // For now, let's keep them in the list so they can 're-request' or auto-approve.
              p.isOnline = false;
              updated = true;
              io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
              console.log(`📡 Pending Guest ${p.userName} went offline.`);
          }
          
          if (updated) {
            await redisStore.setRoom(sessionId, room);
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
