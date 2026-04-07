import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  constructor() {
    this.client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('✅ Redis Engine Connected'));
  }

  // Session State Storage (HSET/HGET)
  async setSessionState(sessionId, state) {
    const key = `session:${sessionId}`;
    await this.client.hset(key, 'data', JSON.stringify(state));
    await this.client.expire(key, 86400); // 24h TTL
  }

  async getSessionState(sessionId) {
    const key = `session:${sessionId}`;
    const data = await this.client.hget(key, 'data');
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    await this.client.del(`session:${sessionId}`);
  }
}

export const redis = new RedisService();
export default redis;
