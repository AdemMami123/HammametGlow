import { redis } from '../config/redis';

/**
 * Cache service for Redis operations
 */
export class CacheService {
  private static TTL = {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
  };

  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data as T | null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = this.TTL.MEDIUM): Promise<void> {
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delPattern error:', error);
    }
  }

  // User cache operations
  static async cacheUser(userId: string, userData: any): Promise<void> {
    await this.set(`user:${userId}`, userData, this.TTL.LONG);
  }

  static async getCachedUser(userId: string): Promise<any | null> {
    return await this.get(`user:${userId}`);
  }

  static async invalidateUserCache(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
    await this.delPattern(`user:${userId}:*`);
  }

  // Challenge cache operations
  static async cacheChallenge(challengeId: string, challengeData: any): Promise<void> {
    await this.set(`challenge:${challengeId}`, challengeData, this.TTL.LONG);
  }

  static async getCachedChallenge(challengeId: string): Promise<any | null> {
    return await this.get(`challenge:${challengeId}`);
  }

  static async cacheChallenges(challenges: any[]): Promise<void> {
    await this.set('challenges:all', challenges, this.TTL.MEDIUM);
  }

  static async getCachedChallenges(): Promise<any[] | null> {
    return await this.get('challenges:all');
  }

  static async invalidateChallengeCache(challengeId?: string): Promise<void> {
    if (challengeId) {
      await this.del(`challenge:${challengeId}`);
    }
    await this.del('challenges:all');
  }

  // Leaderboard cache operations
  static async cacheLeaderboard(type: string, data: any): Promise<void> {
    await this.set(`leaderboard:${type}`, data, this.TTL.SHORT);
  }

  static async getCachedLeaderboard(type: string): Promise<any | null> {
    return await this.get(`leaderboard:${type}`);
  }

  static async invalidateLeaderboardCache(): Promise<void> {
    await this.delPattern('leaderboard:*');
  }

  // Submission cache operations
  static async invalidateSubmissionCache(userId: string, challengeId: string): Promise<void> {
    await this.delPattern(`submissions:user:${userId}*`);
    await this.delPattern(`submissions:challenge:${challengeId}*`);
    await this.invalidateLeaderboardCache();
  }

  // Session cache operations
  static async cacheSession(sessionId: string, sessionData: any): Promise<void> {
    await this.set(`session:${sessionId}`, sessionData, this.TTL.DAY);
  }

  static async getCachedSession(sessionId: string): Promise<any | null> {
    return await this.get(`session:${sessionId}`);
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Rate limiting helper
  static async incrementRateLimit(key: string, ttl: number): Promise<number> {
    if (!redis) return 0;
    
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, ttl);
      }
      return current;
    } catch (error) {
      console.error('Rate limit increment error:', error);
      return 0;
    }
  }

  static async getRateLimit(key: string): Promise<number> {
    if (!redis) return 0;
    
    try {
      const value = await redis.get(key);
      return value ? parseInt(value as string, 10) : 0;
    } catch (error) {
      console.error('Get rate limit error:', error);
      return 0;
    }
  }
}
