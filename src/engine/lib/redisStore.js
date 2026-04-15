/**
 * STABLE MEMORY ENGINE V3.0
 * Replaces Redis with a thread-safe in-memory store.
 * Optimized for development stability and horizontal scaling on single instances.
 */

class MemoryStore {
  constructor() {
    this.rooms = new Map();
    console.log('✅ Stable Memory Engine Initialized');
  }

  // Room management
  async setRoom(sessionId, roomData) {
    // Add sessionId to the data object for easier discovery during cleanup
    const data = { ...roomData, sessionId };
    this.rooms.set(sessionId, data);
  }

  async getRoom(sessionId) {
    return this.rooms.get(sessionId) || null;
  }

  async deleteRoom(sessionId) {
    this.rooms.delete(sessionId);
  }

  async getAllRooms() {
    return Array.from(this.rooms.values());
  }

  // Session participant tracking (Legacy helpers)
  async addParticipant(sessionId, participant) {
    const room = await this.getRoom(sessionId);
    if (room) {
      if (!room.participants) room.participants = [];
      const exists = room.participants.find(p => p.userId === participant.userId);
      if (!exists) {
        room.participants.push(participant);
        await this.setRoom(sessionId, room);
      }
    }
  }

  async removeParticipant(sessionId, participantId) {
    const room = await this.getRoom(sessionId);
    if (room) {
      room.participants = (room.participants || []).filter(p => p.userId !== participantId);
      await this.setRoom(sessionId, room);
    }
  }

  async getParticipants(sessionId) {
    const room = await this.getRoom(sessionId);
    return room ? (room.participants || []) : [];
  }

  async cleanup() {
    const now = Date.now();
    for (const [sessionId, roomData] of this.rooms.entries()) {
      // Clean up rooms terminated more than 5 minutes ago
      if (roomData.state?.status === 'TERMINATED' && 
          roomData.terminatedAt && 
          (now - roomData.terminatedAt) > 5 * 60 * 1000) {
        this.rooms.delete(sessionId);
        console.log(`🧹 Memory Purge: Room ${sessionId} cleaned.`);
      }
    }
  }

  async disconnect() {
    // No-op for memory store
  }
}

const memoryStore = new MemoryStore();

// Export as both default and named for compatibility with server.js require
module.exports = memoryStore;
module.exports.default = memoryStore;
module.exports.redisStore = memoryStore;
