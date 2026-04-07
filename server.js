const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active room states in memory
const rooms = new Map();

app.prepare()
  .then(() => {
    const httpServer = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
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

      socket.on('JOIN_SESSION', (data) => {
        const { sessionId, role, userId, userName } = data;
        
        if (!rooms.has(sessionId)) {
          rooms.set(sessionId, { 
              participants: [], 
              pendingParticipants: [],
              state: { status: 'LOBBY', type: 'QUIZ' } 
          });
        }
        
        const room = rooms.get(sessionId);

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
            // Broadcast active list to everyone in the room
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            socket.emit('STATE_UPDATE', { action: 'REHYDRATE', payload: room.state });
            
            // SECURITY SYNC: Force-push current pending list to the host immediately
            socket.emit('SYNC_PENDING', room.pendingParticipants);
            console.log(`👑 Commander ${userName} joined room ${sessionId}. Pending queue sent: ${room.pendingParticipants.length}`);
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
            
            // CRITICAL BROADCAST: Notify all HOSTS in the room about the new guest
            console.log(`💂 Guest ${userName} requesting clearance for room ${sessionId}. Broadcasting to room...`);
            io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            socket.emit('STATE_UPDATE', { action: 'PENDING_CLEARANCE', payload: { status: 'PENDING' } });
        }
      });

      socket.on('HOST_ACTION', (data) => {
        const { sessionId, action, payload } = data;
        const room = rooms.get(sessionId);
        if (!room) return;

        if (action === 'APPROVE_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                room.participants.push({ ...guest, score: 0, progress: 0, isOnline: true });
                
                io.to(guest.socketId).emit('STATE_UPDATE', { action: 'REHYDRATE', payload: room.state });
                const guestSocket = io.sockets.sockets.get(guest.socketId);
                if (guestSocket) guestSocket.join(sessionId);

                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                console.log(`✅ Approved: ${guest.userName}`);
            }
            return;
        }

        if (action === 'REJECT_GUEST') {
            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                io.to(guest.socketId).emit('STATE_UPDATE', { action: 'CLEARANCE_DENIED', payload: { status: 'REJECTED' } });
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                console.log(`❌ Rejected: ${guest.userName}`);
            }
            return;
        }

        if (action === 'KICK_PARTICIPANT') {
            const pIdx = room.participants.findIndex(p => p.userId === payload.userId);
            if (pIdx !== -1) {
                const p = room.participants[pIdx];
                room.participants.splice(pIdx, 1);
                io.to(p.socketId).emit('STATE_UPDATE', { action: 'DISCONTINUED', payload: { status: 'REJECTED' } });
                const pSocket = io.sockets.sockets.get(p.socketId);
                if (pSocket) pSocket.leave(sessionId);
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                console.log(`🛑 DISMISSED: ${p.userName}`);
            }
            return;
        }

        room.state = { ...room.state, ...payload };
        if (action === 'START_SESSION') {
            room.participants.forEach(p => { p.score = 0; p.progress = 0; });
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
        }
        io.in(sessionId).emit('STATE_UPDATE', { action, payload });
      });

      socket.on('SUBMIT_SCORE', (data) => {
        const { sessionId, userId, score, progress } = data;
        const room = rooms.get(sessionId);
        if (room && room.participants) {
            const p = room.participants.find(p => p.userId === userId);
            if (p) {
                p.score = score;
                p.progress = progress;
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            }
        }
      });

      socket.on('disconnect', () => {
        rooms.forEach((room, sessionId) => {
          const idx = room.participants.findIndex(p => p.socketId === socket.id);
          if (idx !== -1) {
            const p = room.participants[idx];
            if (room.state.status === 'ACTIVE') {
                p.isOnline = false;
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            } else {
                room.participants.splice(idx, 1);
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            }
          }
          const pIdx = room.pendingParticipants.findIndex(p => p.socketId === socket.id);
          if (pIdx !== -1) {
              const p = room.pendingParticipants[pIdx];
              room.pendingParticipants.splice(pIdx, 1);
              io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
              console.log(`🚫 Pending Guest ${p.userName} disconnected.`);
          }
        });
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
