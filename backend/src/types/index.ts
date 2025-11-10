/**
 * User types
 */
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'citizen' | 'business' | 'admin';
  points: number;
  totalPoints: number;
  level: number;
  badges: string[];
  completedChallenges: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  bio?: string;
  location?: string;
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
  };
}

/**
 * Challenge types
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'cultural' | 'food' | 'adventure' | 'photography' | 'historical' | 'nature';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  imageUrl: string;
  imagePublicId?: string;
  createdBy: string;
  createdByName?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  maxParticipants?: number;
  currentParticipants: number;
  requirements: string[];
  rewards?: {
    badge?: string;
    bonusPoints?: number;
    discount?: {
      businessId: string;
      percentage: number;
      description: string;
    };
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Submission types
 */
export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionData: {
    photos: Array<{
      url: string;
      publicId: string;
      caption?: string;
    }>;
    description?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Badge types
 */
export interface Badge {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  iconUrl?: string;
  metadata?: {
    challengeId?: string;
    challengeName?: string;
    achievedOn?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  };
  createdAt: string;
}

/**
 * Leaderboard entry types
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  points: number;
  level: number;
  rank: number;
  badgeCount: number;
  completedChallenges: number;
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'challenge' | 'submission' | 'badge' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

/**
 * Business types
 */
export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  images: Array<{
    url: string;
    publicId: string;
  }>;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Pagination types
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
