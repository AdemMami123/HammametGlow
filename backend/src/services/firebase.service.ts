import { adminDb } from '../config/firebase-admin';
import type { User, Challenge, Submission, Badge } from '../types';

/**
 * Firebase service for database operations
 */
export class FirebaseService {
  // User operations
  static async createUser(userId: string, userData: Partial<User>): Promise<void> {
    await adminDb.collection('users').doc(userId).set({
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getUser(userId: string): Promise<User | null> {
    const doc = await adminDb.collection('users').doc(userId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as User : null;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await adminDb.collection('users').doc(userId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteUser(userId: string): Promise<void> {
    await adminDb.collection('users').doc(userId).delete();
  }

  // Challenge operations
  static async createChallenge(challengeData: Partial<Challenge>): Promise<string> {
    const docRef = await adminDb.collection('challenges').add({
      ...challengeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  static async getChallenge(challengeId: string): Promise<Challenge | null> {
    const doc = await adminDb.collection('challenges').doc(challengeId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Challenge : null;
  }

  static async getAllChallenges(filters?: { status?: string; category?: string }): Promise<Challenge[]> {
    let query = adminDb.collection('challenges') as any;

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Challenge));
  }

  static async updateChallenge(challengeId: string, updates: Partial<Challenge>): Promise<void> {
    await adminDb.collection('challenges').doc(challengeId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteChallenge(challengeId: string): Promise<void> {
    await adminDb.collection('challenges').doc(challengeId).delete();
  }

  // Submission operations
  static async createSubmission(submissionData: Partial<Submission>): Promise<string> {
    const docRef = await adminDb.collection('submissions').add({
      ...submissionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  static async getSubmission(submissionId: string): Promise<Submission | null> {
    const doc = await adminDb.collection('submissions').doc(submissionId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Submission : null;
  }

  static async getUserSubmissions(userId: string): Promise<Submission[]> {
    const snapshot = await adminDb.collection('submissions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Submission));
  }

  static async getChallengeSubmissions(challengeId: string): Promise<Submission[]> {
    const snapshot = await adminDb.collection('submissions')
      .where('challengeId', '==', challengeId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Submission));
  }

  static async updateSubmission(submissionId: string, updates: Partial<Submission>): Promise<void> {
    await adminDb.collection('submissions').doc(submissionId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteSubmission(submissionId: string): Promise<void> {
    await adminDb.collection('submissions').doc(submissionId).delete();
  }

  // Badge operations
  static async createBadge(badgeData: Partial<Badge>): Promise<string> {
    const docRef = await adminDb.collection('badges').add({
      ...badgeData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  static async getUserBadges(userId: string): Promise<Badge[]> {
    const snapshot = await adminDb.collection('badges')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Badge));
  }

  static async awardBadge(userId: string, badgeType: string, metadata?: any): Promise<string> {
    return await this.createBadge({
      userId,
      type: badgeType,
      metadata,
    });
  }
}
