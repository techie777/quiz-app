const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
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
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    const io = new Server(httpServer, {
      path: '/socket.io',
      cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected:', socket.id);

      socket.on('JOIN_SESSION', async (data) => {
        const dirtySessionId = data.sessionId;
        const sessionId = typeof dirtySessionId === 'string' ? dirtySessionId.trim() : dirtySessionId;
        const { role, userId, userName, rollNumber, studentClass, isB2B } = data;
        
        if (!sessionId || !role || !userId) {
            console.error(`❌ [IO] Invalid JOIN_SESSION attempt:`, data);
            return;
        }

        console.log(`📡 [HANDSHAKE] ${userName} (${role}) | Socket: ${socket.id} | Mission: ${sessionId} | Roll: ${rollNumber || 'N/A'} | Class: ${studentClass || 'N/A'}`);

        // 1. IMMERSE socket in the tactical room immediately
        await socket.join(sessionId);
        await socket.join(userId);
        if (role === 'HOST') {
            await socket.join(`${sessionId}_HOST`);
        }

        // Allow socket.io internal buffers to clear (Crucial for HMR/Fast Refresh reliability)
        await new Promise(r => setTimeout(r, 100));

        let room = await redisStore.getRoom(sessionId);
        if (!room) {
            const isB2BInit = !!isB2B || role === 'STUDENT' || role === 'student' || !!rollNumber;
            room = { 
                participants: [], 
                pendingParticipants: [], 
                messages: [], 
                state: { 
                    status: isB2BInit ? 'ACTIVE' : 'LOBBY', 
                    currentQuestion: 0, 
                    startTime: null, 
                    isB2B: isB2BInit,
                    type: isB2BInit ? 'B2B_EXAM' : 'QUIZ'
                },
                sessionId 
            };
            await redisStore.setRoom(sessionId, room);
            console.log(`📡 [INIT] New mission container created for ${sessionId} (B2B: ${isB2BInit})`);
        }

        if (role === 'HOST') {
            // Remove any existing host entries to ensure strictly ONE host in room participants
            room.participants = room.participants.filter(p => p.role !== 'HOST' && p.userId !== userId);
            
            const hostData = { 
                userId, 
                userName: userName || 'Quiz Master', 
                role: 'HOST', 
                socketId: socket.id, 
                isOnline: true, 
                status: 'ACTIVE' 
            };

            room.participants.unshift(hostData);
            console.log(`📡 [HOST] Commander ${userName} uplifted at ${socket.id}`);
            
            // Critical rehydration
            socket.emit('STATE_UPDATE', { 
                action: 'REHYDRATE', 
                payload: { ...room.state, sessionId, role, userId, userName } 
            });
        } else {
            // GUEST / STUDENT LOGIC
            room.kickedUsers = room.kickedUsers || [];
            room.authorizedUserIds = room.authorizedUserIds || [];
            const isKicked = room.kickedUsers.includes(userId);
            
            const isB2BContext = isB2B || role === 'STUDENT' || role === 'student' || room.state?.isB2B || !!rollNumber;
            if (isB2BContext) {
                room.state.isB2B = true;
                if (room.state.status === 'LOBBY') {
                    room.state.status = 'ACTIVE';
                }
                if (!room.state.type) {
                    room.state.type = 'B2B_EXAM';
                }
            }
            // Match existing student by userId OR by rollNumber
            let existingInSquad = room.participants.find(p => 
                p.userId === userId || 
                (isB2BContext && rollNumber && p.rollNumber && p.rollNumber.toString().trim().toUpperCase() === rollNumber.toString().trim().toUpperCase())
            );

            // Re-hydrate ALREADY APPROVED student on reconnection (must be in authorizedUserIds or recognized in squad)
            const isAuthorized = room.authorizedUserIds.includes(userId);
            if ((existingInSquad || isAuthorized) && !isKicked) {
                if (!existingInSquad && isAuthorized) {
                    existingInSquad = {
                        userId,
                        userName: userName || 'Student',
                        rollNumber: rollNumber || null,
                        studentClass: studentClass || null,
                        isB2B: !!isB2BContext,
                        role: 'GUEST',
                        socketId: socket.id,
                        score: 0,
                        progress: 0,
                        isOnline: true,
                        status: 'ACTIVE'
                    };
                    room.participants.push(existingInSquad);
                }

                existingInSquad.socketId = socket.id;
                existingInSquad.isOnline = true;
                existingInSquad.status = 'ACTIVE';
                existingInSquad.userId = userId;
                if (rollNumber) existingInSquad.rollNumber = rollNumber;
                if (studentClass) existingInSquad.studentClass = studentClass;
                if (isB2BContext) existingInSquad.isB2B = true;
                if (!room.authorizedUserIds.includes(userId)) {
                    room.authorizedUserIds.push(userId);
                }
                
                const currentStatus = room.state?.status || 'ACTIVE';
                socket.emit('STATE_UPDATE', { 
                    action: 'REHYDRATE', 
                    payload: { 
                        ...room.state, 
                        status: currentStatus,
                        isPendingApproval: false,
                        sessionId, 
                        role: existingInSquad.role || role || 'GUEST', 
                        userId, 
                        userName: existingInSquad.userName || userName,
                        rollNumber: existingInSquad.rollNumber || rollNumber,
                        savedScore: existingInSquad.score || 0,
                        savedProgress: existingInSquad.progress || 0
                    } 
                });
                console.log(`📡 [GUEST] Member ${existingInSquad.userName} (${existingInSquad.rollNumber || userId}) reconnected at ${socket.id} with status: ${currentStatus}`);
            } else if (isKicked) {
                // If they were kicked, emit KICKED state
                room.participants = room.participants.filter(p => p.userId !== userId);
                socket.emit('STATE_UPDATE', { 
                    action: 'KICKED', 
                    payload: { 
                        status: 'KICKED', 
                        isKicked: true,
                        sessionId,
                        type: room.state?.type || 'standard',
                        activeContentId: room.state?.activeContentId || null,
                        message: 'You have been kicked out by the admin.' 
                    } 
                });
                console.log(`📡 [GUEST] Kicked user ${userName} (${userId}) connected. Dispatched KICKED options.`);
                return;
            } else {
                // Fresh student / guest join request waiting for clearance: PENDING APPROVAL GATE!
                room.pendingParticipants = room.pendingParticipants.filter(p => p.userId !== userId && (!rollNumber || p.rollNumber !== rollNumber));
                const pendingRecord = { 
                    userId, 
                    userName: userName || 'Student', 
                    rollNumber: rollNumber || null,
                    studentClass: studentClass || null,
                    socketId: socket.id, 
                    requestedAt: Date.now(), 
                    isOnline: true, 
                    isB2B: !!isB2BContext,
                    role: 'GUEST'
                };
                room.pendingParticipants.push(pendingRecord);
                console.log(`📡 [GATEKEEPER] Request received from ${userName} (Roll: ${rollNumber || 'N/A'}). Waiting for teacher approval.`);
                
                // Authoritative Targeted Alerts to Host & Host Channel
                io.to(`${sessionId}_HOST`).emit('GUEST_JOIN_REQUEST', { guestId: userId, guestName: userName, rollNumber });
                io.to(`${sessionId}_HOST`).emit('SYNC_PENDING', room.pendingParticipants);
                
                const host = room.participants.find(p => p.role === 'HOST');
                if (host && host.socketId) {
                    io.to(host.socketId).emit('GUEST_JOIN_REQUEST', { guestId: userId, guestName: userName, rollNumber });
                    io.to(host.socketId).emit('SYNC_PENDING', room.pendingParticipants);
                }
                
                // Send pending state to student
                socket.emit('STATE_UPDATE', { 
                    action: 'PENDING_APPROVAL', 
                    payload: { 
                        status: 'PENDING_APPROVAL', 
                        isPendingApproval: true,
                        message: 'प्रतीक्षारत: शिक्षक की अनुमति का इंतजार है...', 
                        sessionId, 
                        role: 'GUEST', 
                        userId, 
                        userName,
                        rollNumber
                    } 
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
      });

        socket.on('LEAVE_SESSION', async (data) => {
            const { sessionId: rawSid, userId } = data;
            const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
            if (!sessionId || !userId) return;

            const room = await redisStore.getRoom(sessionId);
            if (room && room.participants) {
                const pIdx = room.participants.findIndex(p => p.userId === userId);
                if (pIdx !== -1) {
                    const participant = room.participants[pIdx];
                    const isB2BExaminee = participant.isB2B || !!participant.rollNumber || room.state?.isB2B;
                    if (isB2BExaminee) {
                        // PRESERVE examinee seat! Do not permanently delete their exam registration.
                        participant.isOnline = false;
                        participant.status = 'AWAY';
                        await redisStore.setRoom(sessionId, room);
                        io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                        console.log(`📡 [LEAVE_SESSION] Exam student ${participant.userName} (${participant.rollNumber}) marked AWAY in ${sessionId}`);
                    } else {
                        const userName = participant.userName;
                        room.participants.splice(pIdx, 1);
                        await redisStore.setRoom(sessionId, room);
                        io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                        io.in(sessionId).emit('PARTICIPANT_LEFT', { userName, userId });
                        console.log(`📡 [LEAVE_SESSION] Participant ${userName} left and removed from room ${sessionId}`);
                    }
                } else if (room.pendingParticipants) {
                    const pendIdx = room.pendingParticipants.findIndex(p => p.userId === userId);
                    if (pendIdx !== -1) {
                        const userName = room.pendingParticipants[pendIdx].userName;
                        room.pendingParticipants.splice(pendIdx, 1);
                        await redisStore.setRoom(sessionId, room);
                        io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                        console.log(`📡 [LEAVE_SESSION] Pending guest ${userName} left room ${sessionId}`);
                    }
                }
            }
            await socket.leave(sessionId);
        });

        socket.on('REQUEST_REENTRY', async (data) => {
            const { sessionId: rawSid, userId, userName } = data;
            const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
            if (!sessionId || !userId) return;

            const room = await redisStore.getRoom(sessionId);
            if (!room) return;

            // Prepare pending participant list with re-entry flag
            room.pendingParticipants = room.pendingParticipants || [];
            room.pendingParticipants = room.pendingParticipants.filter(p => p.userId !== userId);
            room.pendingParticipants.push({
                userId,
                userName: userName || 'Player',
                socketId: socket.id,
                requestedAt: Date.now(),
                isOnline: true,
                role: 'GUEST',
                isReentry: true
            });

            await redisStore.setRoom(sessionId, room);

            // Ensure socket joins room channel
            await socket.join(sessionId);

            // Direct pulse to host
            const host = room.participants?.find(p => p.role === 'HOST');
            if (host && host.socketId) {
                console.log(`📡 [SIGNAL] Sending re-entry pulse to host: ${host.socketId}`);
                io.to(host.socketId).emit('GUEST_JOIN_REQUEST', {
                    guestId: userId,
                    guestName: userName || 'Player',
                    isReentry: true
                });
                io.to(host.socketId).emit('SYNC_PENDING', room.pendingParticipants);
            }

            socket.emit('STATE_UPDATE', {
                action: 'REENTRY_REQUESTED',
                payload: {
                    status: 'PENDING_REENTRY',
                    isReentryPending: true,
                    message: 'Re-entry request sent to the admin. Waiting for approval...'
                }
            });
            console.log(`📡 [SERVER] Re-entry requested by ${userName} (${userId}) for room ${sessionId}`);
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
            room.kickedUsers = room.kickedUsers || [];
            room.kickedUsers = room.kickedUsers.filter(id => id !== payload.userId);

            const guestIdx = room.pendingParticipants.findIndex(p => p.userId === payload.userId);
            if (guestIdx !== -1) {
                const guest = room.pendingParticipants[guestIdx];
                room.pendingParticipants.splice(guestIdx, 1);
                room.authorizedUserIds = room.authorizedUserIds || [];
                if (!room.authorizedUserIds.includes(guest.userId)) {
                    room.authorizedUserIds.push(guest.userId);
                }
                const admittedStudent = {
                    userId: guest.userId,
                    userName: guest.userName,
                    rollNumber: guest.rollNumber || null,
                    isB2B: !!guest.isB2B,
                    role: 'GUEST',
                    socketId: guest.socketId,
                    score: 0,
                    progress: 0,
                    isOnline: true,
                    status: 'ACTIVE'
                };
                if (!room.participants.some(p => p.userId === guest.userId)) {
                    room.participants.push(admittedStudent);
                }
                
                await redisStore.setRoom(sessionId, room);
                
                const approvalPayload = { 
                    ...room.state,
                    status: room.state?.status || 'ACTIVE',
                    isKicked: false,
                    isReentryPending: false,
                    isPendingApproval: false,
                    message: 'You have been approved to join the session!' 
                };
                // Notify guest on both userId room and socketId
                io.to(guest.userId).emit('STATE_UPDATE', { action: 'APPROVED', payload: approvalPayload });
                if (guest.socketId) {
                    io.to(guest.socketId).emit('STATE_UPDATE', { action: 'APPROVED', payload: approvalPayload });
                }
                
                // Update all participants
                io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
                io.in(sessionId).emit('PARTICIPANT_JOINED', { userName: guest.userName, role: 'GUEST' });
                console.log(`📡 [SERVER] Approved student: ${guest.userName} (${guest.rollNumber || guest.userId})`);
            }
        }

        if (action === 'APPROVE_ALL_GUESTS') {
            room.kickedUsers = room.kickedUsers || [];
            room.authorizedUserIds = room.authorizedUserIds || [];
            const pendingToApprove = [...(room.pendingParticipants || [])];
            room.pendingParticipants = [];

            pendingToApprove.forEach((guest) => {
                room.kickedUsers = room.kickedUsers.filter(id => id !== guest.userId);
                if (!room.authorizedUserIds.includes(guest.userId)) {
                    room.authorizedUserIds.push(guest.userId);
                }
                const admittedStudent = {
                    userId: guest.userId,
                    userName: guest.userName,
                    rollNumber: guest.rollNumber || null,
                    isB2B: !!guest.isB2B,
                    role: 'GUEST',
                    socketId: guest.socketId,
                    score: 0,
                    progress: 0,
                    isOnline: true,
                    status: 'ACTIVE'
                };
                if (!room.participants.some(p => p.userId === guest.userId)) {
                    room.participants.push(admittedStudent);
                }

                const approvalPayload = {
                    ...room.state,
                    status: room.state?.status || 'ACTIVE',
                    isKicked: false,
                    isReentryPending: false,
                    isPendingApproval: false,
                    message: 'You have been approved to join the session!'
                };
                io.to(guest.userId).emit('STATE_UPDATE', { action: 'APPROVED', payload: approvalPayload });
                if (guest.socketId) {
                    io.to(guest.socketId).emit('STATE_UPDATE', { action: 'APPROVED', payload: approvalPayload });
                }
            });

            await redisStore.setRoom(sessionId, room);
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            console.log(`📡 [SERVER] Approved ALL (${pendingToApprove.length}) pending participants for room ${sessionId}`);
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

        if (action === 'KICK_PARTICIPANT' || action === 'REMOVE_PARTICIPANT') {
            room.kickedUsers = room.kickedUsers || [];
            if (!room.kickedUsers.includes(payload.userId)) {
                room.kickedUsers.push(payload.userId);
            }
            room.authorizedUserIds = (room.authorizedUserIds || []).filter(id => id !== payload.userId);

            const pIdx = room.participants.findIndex(p => p.userId === payload.userId);
            let kickedUserName = payload.userName || 'Player';
            if (pIdx !== -1) {
                const p = room.participants[pIdx];
                kickedUserName = p.userName || kickedUserName;
                if (p.socketId) {
                    io.to(p.socketId).emit('STATE_UPDATE', { 
                        action: 'KICKED', 
                        payload: { 
                            status: 'KICKED', 
                            isKicked: true,
                            sessionId,
                            type: room.state?.type || 'standard',
                            activeContentId: room.state?.activeContentId || null,
                            message: 'You have been kicked out by the admin.' 
                        } 
                    });
                }
                io.in(sessionId).emit('PARTICIPANT_KICKED', { userName: kickedUserName, userId: payload.userId });
            }

            // Completely remove from both lists
            room.participants = room.participants.filter(p => p.userId !== payload.userId);
            room.pendingParticipants = room.pendingParticipants.filter(p => p.userId !== payload.userId);

            await redisStore.setRoom(sessionId, room);
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            io.in(sessionId).emit('SYNC_PENDING', room.pendingParticipants);
            console.log(`📡 [SERVER] KICKED/REMOVED AND BLACKLISTED: ${payload.userId}`);
            return;
        }
        
        if (action === 'PAUSE_STUDENT') {
            const targetId = payload?.userId;
            const isPaused = Boolean(payload?.isPaused);
            if (room.participants) {
                const p = room.participants.find(p => p.userId === targetId);
                if (p) {
                    p.isIndividualPaused = isPaused;
                    await redisStore.setRoom(sessionId, room);
                    if (p.socketId) {
                        io.to(p.socketId).emit('INDIVIDUAL_PAUSE', { 
                            isPaused, 
                            reason: payload?.reason || (isPaused ? 'शिक्षक द्वारा आपकी परीक्षा अस्थायी रूप से रोक दी गई है।' : 'आपकी परीक्षा पुनः शुरू कर दी गई है।')
                        });
                    }
                    io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
                    console.log(`📡 [SERVER] Student ${p.userName} (${targetId}) individual pause: ${isPaused}`);
                }
            }
            return;
        }

        if (action === 'TERMINATE') {
            room.state.status = 'TERMINATED';
            room.terminatedAt = Date.now();
            await redisStore.setRoom(sessionId, room);
            
            io.in(sessionId).emit('STATE_UPDATE', { action: 'TERMINATED', payload: room.state });
            
            // Retain terminated room for 15 minutes so participants can review results or finish solo
            setTimeout(async () => {
                await redisStore.deleteRoom(sessionId);
                console.log(`📡 Room ${sessionId} purged after termination retention period.`);
            }, 15 * 60 * 1000);
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

      socket.on('SEND_BROADCAST', async (data) => {
        const { sessionId: rawSid, text } = data;
        const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
        const room = await redisStore.getRoom(sessionId);
        const broadcastItem = {
          id: `bc_${Date.now()}`,
          text,
          type: 'PROCLAMATION',
          timestamp: new Date().toISOString()
        };
        if (room) {
          room.broadcasts = room.broadcasts || [];
          room.broadcasts.push(broadcastItem);
          if (room.broadcasts.length > 30) room.broadcasts.shift();
          await redisStore.setRoom(sessionId, room);
        }
        io.in(sessionId).emit('MISSION_BROADCAST', broadcastItem);
      });

      // 💬 1-to-1 DIRECT MESSAGING (Teacher <-> Student)
      socket.on('SEND_DIRECT_MESSAGE', async (data) => {
        try {
          const { sessionId: rawSid, fromUserId, fromUserName, toUserId, text, role } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room && text && text.trim()) {
            const dm = {
              id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              fromUserId,
              fromUserName: fromUserName || 'User',
              toUserId,
              text: text.trim(),
              role: role || 'STUDENT',
              timestamp: new Date().toISOString()
            };

            room.directMessages = room.directMessages || [];
            room.directMessages.push(dm);
            if (room.directMessages.length > 200) room.directMessages.shift();
            await redisStore.setRoom(sessionId, room);

            // Forward to recipient (both specific socket and persistent channel)
            if (toUserId === 'HOST' || toUserId === 'all_teachers') {
              const host = room.participants.find(p => p.role === 'HOST');
              if (host && host.socketId) {
                io.to(host.socketId).emit('DIRECT_MESSAGE', dm);
              }
              io.to(`${sessionId}_HOST`).emit('DIRECT_MESSAGE', dm);
            } else {
              const recipient = room.participants.find(p => p.userId === toUserId);
              if (recipient && recipient.socketId) {
                io.to(recipient.socketId).emit('DIRECT_MESSAGE', dm);
              }
              io.to(toUserId).emit('DIRECT_MESSAGE', dm);
            }

            // Echo back to sender
            socket.emit('DIRECT_MESSAGE', dm);
            console.log(`✉️ [DM] ${fromUserName} -> ${toUserId}: ${dm.text.slice(0, 30)}`);
          }
        } catch (dmErr) {
          console.error('❌ Direct message error:', dmErr);
        }
      });

      socket.on('FETCH_DIRECT_MESSAGES', async ({ sessionId: rawSid, userId }) => {
        const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
        const room = await redisStore.getRoom(sessionId);
        if (room && room.directMessages) {
          const userDMs = room.directMessages.filter(
            m => m.fromUserId === userId || m.toUserId === userId || m.toUserId === 'HOST'
          );
          socket.emit('SYNC_DIRECT_MESSAGES', userDMs);
        }
      });

      // 👁️ LIVE PROCTORING: Periodic Camera Frame Snapshots Relay
      socket.on('PROCTOR_FRAME', async (data) => {
        try {
          const { sessionId: rawSid, userId, userName, rollNumber, frame } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room) {
            const host = room.participants.find(p => p.role === 'HOST');
            if (host && host.socketId) {
              io.to(host.socketId).emit('PROCTOR_FRAME_UPDATE', {
                userId,
                userName,
                rollNumber,
                frame,
                timestamp: Date.now()
              });
            }
            io.to(`${sessionId}_HOST`).emit('PROCTOR_FRAME_UPDATE', {
              userId,
              userName,
              rollNumber,
              frame,
              timestamp: Date.now()
            });
          }
        } catch (pErr) {}
      });

      // 📞 WebRTC Audio & Video Call Signaling (Teacher <-> Student)
      socket.on('PROCTOR_WEBRTC_SIGNAL', async (data) => {
        try {
          const { sessionId: rawSid, toUserId, signal, fromUserId, fromUserName, type } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room) {
            const payload = {
              fromUserId,
              fromUserName,
              toUserId,
              signal,
              type
            };

            if (toUserId === 'HOST') {
              const host = room.participants.find(p => p.role === 'HOST');
              if (host?.socketId) {
                io.to(host.socketId).emit('PROCTOR_WEBRTC_SIGNAL', payload);
              }
              io.to(`${sessionId}_HOST`).emit('PROCTOR_WEBRTC_SIGNAL', payload);
            } else {
              const target = room.participants.find(p => p.userId === toUserId || (p.rollNumber && p.rollNumber === toUserId));
              if (target?.socketId) {
                io.to(target.socketId).emit('PROCTOR_WEBRTC_SIGNAL', payload);
              }
              io.to(toUserId).emit('PROCTOR_WEBRTC_SIGNAL', payload);
            }

            // Guaranteed room broadcast fallback
            io.to(sessionId).emit('PROCTOR_WEBRTC_SIGNAL', payload);
          }
        } catch (sigErr) {
          console.error('WebRTC signal error:', sigErr);
        }
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
            const p = room.participants.find(p => p.userId === userId || (p.role === 'HOST' && (userId === 'host_base_operator' || p.userId === 'host_base_operator')));
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

      socket.on('STUDENT_TELEMETRY', async (data) => {
        try {
          const { sessionId: rawSid, userId, rollNumber, studentClass, userName, currentIndex, selectedOption, tabSwitches, timeRemaining, isSubmitted, score } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room && room.participants) {
            const p = room.participants.find(p => p.userId === userId);
            if (p) {
              if (userName && userName !== 'Student' && userName !== 'Anonymous') p.userName = userName;
              if (typeof rollNumber !== 'undefined') p.rollNumber = rollNumber || null;
              if (typeof studentClass !== 'undefined') p.studentClass = studentClass || null;
              if (typeof currentIndex !== 'undefined') p.currentIndex = currentIndex;
              if (typeof selectedOption !== 'undefined') p.selectedOption = selectedOption;
              if (typeof tabSwitches !== 'undefined') p.tabSwitches = tabSwitches;
              if (typeof timeRemaining !== 'undefined') p.timeRemaining = timeRemaining;
              if (typeof isSubmitted !== 'undefined') p.isSubmitted = isSubmitted;
              if (typeof score !== 'undefined') p.score = score;
              await redisStore.setRoom(sessionId, room);
              io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            }
            io.to(sessionId).emit('HOST_TELEMETRY_UPDATE', data);
          }
        } catch (tErr) {
          console.error('Telemetry error:', tErr);
        }
      });

      socket.on('TAB_SWITCH_ALERT', async (data) => {
        try {
          const { sessionId: rawSid, userId, userName, rollNumber, switchCount } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room && room.participants) {
            const p = room.participants.find(p => p.userId === userId);
            if (p) {
              p.tabSwitches = switchCount;
              await redisStore.setRoom(sessionId, room);
            }
            io.to(sessionId).emit('HOST_TAB_ALERT', data);
            io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
          }
        } catch (tabErr) {
          console.error('Tab switch alert error:', tabErr);
        }
      });

      socket.on('SUBMIT_EXAM', async (data) => {
        try {
          const {
            sessionId: rawSid,
            userId,
            userName,
            rollNumber,
            studentClass,
            answers,
            detailedAnswers,
            totalScore,
            accuracy,
            grade,
            gradeRemark,
            completedAt,
            startedAt,
            timeTakenSeconds,
            tabSwitches,
            correctCount,
            wrongCount,
            unattemptedCount,
            totalQuestions,
            maxScore
          } = data;
          const sessionId = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
          const room = await redisStore.getRoom(sessionId);
          if (room) {
            room.submissions = room.submissions || [];
            const submission = {
              userId,
              userName,
              rollNumber: rollNumber || 'N/A',
              studentClass: studentClass || 'N/A',
              answers: answers || [],
              detailedAnswers: detailedAnswers || [],
              totalScore: Number(totalScore) || 0,
              accuracy: Number(accuracy) || 0,
              grade: grade || 'N/A',
              gradeRemark: gradeRemark || 'N/A',
              correctCount: Number(correctCount) || 0,
              wrongCount: Number(wrongCount) || 0,
              unattemptedCount: Number(unattemptedCount) || 0,
              totalQuestions: Number(totalQuestions) || 0,
              maxScore: Number(maxScore) || 0,
              tabSwitches: Number(tabSwitches) || 0,
              timeTakenSeconds: Number(timeTakenSeconds) || 0,
              startedAt: startedAt || null,
              completedAt: completedAt || Date.now()
            };
            const existIdx = room.submissions.findIndex(s => s.userId === userId);
            if (existIdx !== -1) {
              room.submissions[existIdx] = submission;
            } else {
              room.submissions.push(submission);
            }
            if (room.participants) {
              const p = room.participants.find(p => p.userId === userId);
              if (p) {
                p.isSubmitted = true;
                p.status = 'COMPLETED';
                p.score = totalScore;
                p.accuracy = accuracy;
                if (studentClass) p.studentClass = studentClass;
                p.grade = grade || p.grade || null;
                p.correctCount = correctCount;
                p.wrongCount = wrongCount;
                p.unattemptedCount = unattemptedCount;
                p.tabSwitches = Number(tabSwitches) || p.tabSwitches || 0;
                p.timeTakenSeconds = Number(timeTakenSeconds) || p.timeTakenSeconds || 0;
                p.startedAt = startedAt || p.startedAt || null;
                p.completedAt = completedAt || Date.now();
                p.answers = answers;
                p.detailedAnswers = detailedAnswers;
              }
            }
            await redisStore.setRoom(sessionId, room);
            io.to(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            io.to(sessionId).emit('EXAM_SUBMISSION_BROADCAST', submission);
            io.to(`${sessionId}_HOST`).emit('EXAM_SUBMISSION_BROADCAST', submission);
          }
        } catch (subErr) {
          console.error('Submit exam error:', subErr);
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
            const userName = room.participants[idx].userName;
            const userId = room.participants[idx].userId;
            room.participants[idx].isOnline = false;
            room.participants[idx].status = 'AWAY';
            updated = true;
            io.in(sessionId).emit('SYNC_PARTICIPANTS', room.participants);
            io.in(sessionId).emit('PARTICIPANT_LEFT', { userName, userId });
            console.log(`📡 Participant ${userName} went offline (Room: ${sessionId})`);
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
