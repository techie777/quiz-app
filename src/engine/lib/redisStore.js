const Redis = require('ioredis');

class RedisStore {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.init();
  }

  async init() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // Robust exponential backoff for production
          const delay = Math.min(times * 100, 3000);
          console.log(`???? Redis connection failed (attempt ${times}). Retrying in ${delay}ms...`);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) return true;
          return false;
        },
        maxRetriesPerRequest: null, // Allow infinite retries for production stability
        connectTimeout: 10000, 
      });

      this.redis.on('connect', () => {
        console.log('???? Redis connected successfully');
        this.connected = true;
        this.errorLogged = false; // Reset error log on successful reconnect
      });

      this.redis.on('error', (err) => {
        if (!this.errorLogged) {
          console.error('???? Redis connection error - falling back to memory storage:', err.message);
          this.errorLogged = true;
        }
        this.connected = false;
      });

      this.redis.on('close', () => {
        console.warn('???? Redis connection closed. Engine transitioning to failover memory mode.');
        this.connected = false;
      });

      // Eagerly connect but don't hard-fail if it misses the first window
      await this.redis.connect().catch(err => {
        console.warn('???? Initial Redis connection attempt failed. Background retries started.');
      });
      
    } catch (error) {
      console.log('???? Redis not available - using in-memory storage');
      this.connected = false;
      // Fallback to in-memory storage if Redis fails
      this.fallbackStore = new Map();
    }
  }

  // Room management
  async setRoom(sessionId, roomData) {
    const key = `room:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        await this.redis.setex(key, 86400, JSON.stringify(roomData)); // 24 hours expiry
      } else {
        // Fallback to memory
        this.fallbackStore?.set(key, roomData);
      }
    } catch (error) {
      console.error('???? Failed to set room:', error);
      // Fallback to memory
      this.fallbackStore?.set(key, roomData);
    }
  }

  async getRoom(sessionId) {
    const key = `room:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to memory
        return this.fallbackStore?.get(key) || null;
      }
    } catch (error) {
      console.error('???? Failed to get room:', error);
      // Fallback to memory
      return this.fallbackStore?.get(key) || null;
    }
  }

  async deleteRoom(sessionId) {
    const key = `room:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        await this.redis.del(key);
      } else {
        // Fallback to memory
        this.fallbackStore?.delete(key);
      }
    } catch (error) {
      console.error('???? Failed to delete room:', error);
      // Fallback to memory
      this.fallbackStore?.delete(key);
    }
  }

  async getAllRooms() {
    try {
      if (this.connected && this.redis) {
        const keys = await this.redis.keys('room:*');
        const rooms = await Promise.all(
          keys.map(async (key) => {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
          })
        );
        return rooms.filter(room => room !== null);
      } else {
        // Fallback to memory
        const rooms = [];
        if (this.fallbackStore) {
          for (const [key, value] of this.fallbackStore.entries()) {
            if (key.startsWith('room:')) {
              rooms.push(value);
            }
          }
        }
        return rooms;
      }
    } catch (error) {
      console.error('???? Failed to get all rooms:', error);
      return [];
    }
  }

  // Session participant tracking
  async addParticipant(sessionId, participant) {
    const key = `participants:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        await this.redis.sadd(key, JSON.stringify(participant));
        await this.redis.expire(key, 3600); // 1 hour expiry
      } else {
        // Fallback to memory
        const participants = this.fallbackStore?.get(key) || new Set();
        participants.add(JSON.stringify(participant));
        this.fallbackStore?.set(key, participants);
      }
    } catch (error) {
      console.error('???? Failed to add participant:', error);
    }
  }

  async removeParticipant(sessionId, participantId) {
    const key = `participants:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        const participants = await this.redis.smembers(key);
        const filtered = participants.filter(p => {
          const parsed = JSON.parse(p);
          return parsed.userId !== participantId;
        });
        await this.redis.del(key);
        if (filtered.length > 0) {
          await this.redis.sadd(key, ...filtered);
          await this.redis.expire(key, 3600);
        }
      } else {
        // Fallback to memory
        const participants = this.fallbackStore?.get(key) || new Set();
        const toRemove = Array.from(participants).find(p => {
          const parsed = JSON.parse(p);
          return parsed.userId === participantId;
        });
        if (toRemove) {
          participants.delete(toRemove);
          this.fallbackStore?.set(key, participants);
        }
      }
    } catch (error) {
      console.error('???? Failed to remove participant:', error);
    }
  }

  async getParticipants(sessionId) {
    const key = `participants:${sessionId}`;
    try {
      if (this.connected && this.redis) {
        const participants = await this.redis.smembers(key);
        return participants.map(p => JSON.parse(p));
      } else {
        // Fallback to memory
        const participants = this.fallbackStore?.get(key) || new Set();
        return Array.from(participants).map(p => JSON.parse(p));
      }
    } catch (error) {
      console.error('???? Failed to get participants:', error);
      return [];
    }
  }

  async cleanup() {
    try {
      if (this.connected && this.redis) {
        // Clean up expired sessions
        const keys = await this.redis.keys('room:*');
        const now = Date.now();
        
        for (const key of keys) {
          const room = await this.redis.get(key);
          if (room) {
            const roomData = JSON.parse(room);
            // Clean up rooms terminated more than 5 minutes ago
            if (roomData.state?.status === 'TERMINATED' && 
                roomData.terminatedAt && 
                (now - roomData.terminatedAt) > 5 * 60 * 1000) {
              await this.redis.del(key);
              await this.redis.del(`participants:${key.replace('room:', '')}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('???? Failed to cleanup Redis:', error);
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

const redisStore = new RedisStore();
module.exports = redisStore;
module.exports.default = redisStore;
