/**
 * STABLE REDIS-BYPASS V1.0
 * Bypasses ioredis entirely for application stability.
 */

class MockRedis {
  constructor() {
    this.store = new Map();
    console.log('✅ Redis Override: Active (using memory)');
  }

  async hset(key, field, value) {
    if (!this.store.has(key)) this.store.set(key, new Map());
    this.store.get(key).set(field, value);
    return 1;
  }

  async hget(key, field) {
    const map = this.store.get(key);
    return map ? map.get(field) : null;
  }

  async setex(key, seconds, value) {
    this.store.set(key, value);
    return 'OK';
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async expire(key, seconds) {
    return 1;
  }

  on(event, callback) {
    if (event === 'connect') {
        setTimeout(callback, 0);
    }
    return this;
  }
}

class RedisService {
  constructor() {
    this.client = new MockRedis();
  }

  async setSessionState(sessionId, state) {
    const key = `session:${sessionId}`;
    await this.client.hset(key, 'data', JSON.stringify(state));
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
