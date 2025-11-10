import { FirebaseService } from './firebase.service';
import { CacheService } from './cache.service';

/**
 * Gamification service for points, badges, and achievements
 */
export class GamificationService {
  private static readonly POINTS = {
    CHALLENGE_COMPLETION: 100,
    FIRST_CHALLENGE: 50,
    SUBMISSION_APPROVED: 150,
    DAILY_LOGIN: 10,
    CHALLENGE_CREATED: 75,
    PERFECT_SUBMISSION: 200,
  };

  private static readonly BADGES = {
    FIRST_STEPS: 'first_steps', // Complete first challenge
    EXPLORER: 'explorer', // Complete 5 challenges
    ADVENTURER: 'adventurer', // Complete 10 challenges
    MASTER_EXPLORER: 'master_explorer', // Complete 25 challenges
    CULTURE_BUFF: 'culture_buff', // Complete 5 cultural challenges
    FOODIE: 'foodie', // Complete 5 food challenges
    PHOTOGRAPHER: 'photographer', // Submit 10 photos
    SOCIAL_BUTTERFLY: 'social_butterfly', // Share 5 challenges
    EARLY_BIRD: 'early_bird', // Complete challenge within first hour
    PERFECTIONIST: 'perfectionist', // Get 5 perfect submissions
  };

  /**
   * Award points to a user
   */
  static async awardPoints(
    userId: string,
    points: number,
    reason: string
  ): Promise<void> {
    try {
      const user = await FirebaseService.getUser(userId);
      if (!user) throw new Error('User not found');

      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;

      await FirebaseService.updateUser(userId, {
        points: newPoints,
        totalPoints: (user.totalPoints || 0) + points,
      });

      // Invalidate user cache
      await CacheService.invalidateUserCache(userId);
      await CacheService.invalidateLeaderboardCache();

      console.log(`Awarded ${points} points to user ${userId} for: ${reason}`);
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Check and award badges based on user activity
   */
  static async checkAndAwardBadges(userId: string): Promise<string[]> {
    try {
      const user = await FirebaseService.getUser(userId);
      if (!user) return [];

      const userBadges = await FirebaseService.getUserBadges(userId);
      const earnedBadgeTypes = userBadges.map((b) => b.type);
      const newBadges: string[] = [];

      const submissions = await FirebaseService.getUserSubmissions(userId);
      const completedChallenges = submissions.filter((s) => s.status === 'approved').length;
      const approvedSubmissions = submissions.filter((s) => s.status === 'approved');

      // First Steps - Complete first challenge
      if (completedChallenges >= 1 && !earnedBadgeTypes.includes(this.BADGES.FIRST_STEPS)) {
        await FirebaseService.awardBadge(userId, this.BADGES.FIRST_STEPS);
        newBadges.push(this.BADGES.FIRST_STEPS);
      }

      // Explorer - Complete 5 challenges
      if (completedChallenges >= 5 && !earnedBadgeTypes.includes(this.BADGES.EXPLORER)) {
        await FirebaseService.awardBadge(userId, this.BADGES.EXPLORER);
        newBadges.push(this.BADGES.EXPLORER);
      }

      // Adventurer - Complete 10 challenges
      if (completedChallenges >= 10 && !earnedBadgeTypes.includes(this.BADGES.ADVENTURER)) {
        await FirebaseService.awardBadge(userId, this.BADGES.ADVENTURER);
        newBadges.push(this.BADGES.ADVENTURER);
      }

      // Master Explorer - Complete 25 challenges
      if (completedChallenges >= 25 && !earnedBadgeTypes.includes(this.BADGES.MASTER_EXPLORER)) {
        await FirebaseService.awardBadge(userId, this.BADGES.MASTER_EXPLORER);
        newBadges.push(this.BADGES.MASTER_EXPLORER);
      }

      // Photographer - Submit 10 photos
      if (approvedSubmissions.length >= 10 && !earnedBadgeTypes.includes(this.BADGES.PHOTOGRAPHER)) {
        await FirebaseService.awardBadge(userId, this.BADGES.PHOTOGRAPHER);
        newBadges.push(this.BADGES.PHOTOGRAPHER);
      }

      // Perfectionist - Get 5 perfect submissions (assumed score >= 95)
      const perfectSubmissions = approvedSubmissions.filter((s: any) => s.score >= 95).length;
      if (perfectSubmissions >= 5 && !earnedBadgeTypes.includes(this.BADGES.PERFECTIONIST)) {
        await FirebaseService.awardBadge(userId, this.BADGES.PERFECTIONIST);
        newBadges.push(this.BADGES.PERFECTIONIST);
      }

      if (newBadges.length > 0) {
        await CacheService.invalidateUserCache(userId);
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  /**
   * Process challenge completion
   */
  static async processChallengeCompletion(
    userId: string,
    challengeId: string,
    submissionId: string
  ): Promise<void> {
    try {
      // Award base points
      await this.awardPoints(userId, this.POINTS.CHALLENGE_COMPLETION, 'Challenge completion');

      // Check if first challenge
      const submissions = await FirebaseService.getUserSubmissions(userId);
      if (submissions.length === 1) {
        await this.awardPoints(userId, this.POINTS.FIRST_CHALLENGE, 'First challenge bonus');
      }

      // Check and award badges
      const newBadges = await this.checkAndAwardBadges(userId);

      // Award bonus points for new badges
      for (const badge of newBadges) {
        await this.awardPoints(userId, 50, `New badge earned: ${badge}`);
      }

      console.log(`Processed challenge completion for user ${userId}`);
    } catch (error) {
      console.error('Error processing challenge completion:', error);
      throw error;
    }
  }

  /**
   * Get user rank and position
   */
  static async getUserRank(userId: string): Promise<{ rank: number; totalUsers: number; percentile: number }> {
    try {
      // This is a placeholder - implement proper ranking logic
      // In production, use a sorted set in Redis for efficient ranking
      
      return {
        rank: 1,
        totalUsers: 100,
        percentile: 99,
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      // Check cache first
      const cached = await CacheService.getCachedLeaderboard('global');
      if (cached) return cached.slice(0, limit);

      // This is a placeholder - implement proper leaderboard logic
      // In production, fetch from database and cache
      const leaderboard: any[] = [];

      await CacheService.cacheLeaderboard('global', leaderboard);
      return leaderboard.slice(0, limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}
