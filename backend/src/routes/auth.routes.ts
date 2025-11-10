import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { adminAuth, adminDb } from '../config/firebase-admin';
import { redis } from '../config/redis';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    locationName: z.string().optional(),
  }).optional(),
});

const loginSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { email, password, username, location } = validationResult.data;

    // Check username availability in Firestore
    const usernameQuery = await adminDb
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!usernameQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
        field: 'username',
      });
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password,
        displayName: username,
      });
    } catch (firebaseError: any) {
      // Handle Firebase-specific errors
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          field: 'email',
        });
      }
      
      console.error('Firebase user creation error:', firebaseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account',
        error: firebaseError.message,
      });
    }

    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      email,
      username,
      role: 'citizen' as const,
      points: 0,
      level: 1,
      badges: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      location: location || null,
      profileImage: null,
      displayName: username,
      photoURL: null,
    };

    try {
      await adminDb.collection('users').doc(firebaseUser.uid).set(userData);
    } catch (firestoreError: any) {
      // Rollback: delete Firebase Auth user if Firestore fails
      console.error('Firestore creation error:', firestoreError);
      await adminAuth.deleteUser(firebaseUser.uid);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile',
        error: firestoreError.message,
      });
    }

    // Cache user data in Redis (TTL: 15 minutes)
    const cacheKey = `user:${firebaseUser.uid}`;
    const userDataForCache = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(userDataForCache), { ex: 900 });
      }
    } catch (redisError) {
      // Log but don't fail registration if Redis fails
      console.warn('Redis caching failed:', redisError);
    }

    // Return success response (without password)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: firebaseUser.uid,
        email,
        username,
        role: 'citizen',
        points: 0,
        level: 1,
        displayName: username,
        photoURL: null,
      },
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { idToken } = validationResult.data;

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError: any) {
      console.error('Token verification error:', tokenError);
      
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please sign in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_TOKEN',
      });
    }

    const { uid } = decodedToken;

    // Try to get user from Redis cache first
    let userData: any = null;
    const cacheKey = `user:${uid}`;
    
    try {
      if (redis) {
        const cachedUser = await redis.get(cacheKey);
        if (cachedUser) {
          userData = JSON.parse(cachedUser as string);
        }
      }
    } catch (redisError) {
      console.warn('Redis read error:', redisError);
    }

    // If not in cache, retrieve from Firestore
    if (!userData) {
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        userData = userDoc.data();

        // Cache user data in Redis (TTL: 15 minutes)
        try {
          if (redis) {
            await redis.set(cacheKey, JSON.stringify(userData), { ex: 900 });
          }
        } catch (redisCacheError) {
          console.warn('Redis caching failed:', redisCacheError);
        }
      } catch (firestoreError: any) {
        console.error('Firestore read error:', firestoreError);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve user data',
          error: firestoreError.message,
        });
      }
    }

    // Cache user session in Redis (TTL: 24 hours)
    const sessionKey = `session:${uid}`;
    try {
      if (redis) {
        await redis.set(sessionKey, JSON.stringify({ uid, lastLogin: new Date().toISOString() }), { ex: 86400 });
      }
    } catch (sessionError) {
      console.warn('Session caching failed:', sessionError);
    }

    // Return user data
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        uid: userData.uid,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        points: userData.points,
        level: userData.level,
        displayName: userData.displayName || userData.username,
        photoURL: userData.photoURL || userData.profileImage,
        badges: userData.badges || [],
      },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error.message,
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;

    // Clear session from Redis
    const sessionKey = `session:${uid}`;
    try {
      if (redis) {
        await redis.del(sessionKey);
      }
    } catch (redisError) {
      console.warn('Redis session deletion failed:', redisError);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: error.message,
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;

    // Try Redis cache first
    const cacheKey = `user:${uid}`;
    let userData: any = null;
    
    try {
      if (redis) {
        const cachedUser = await redis.get(cacheKey);
        if (cachedUser) {
          userData = JSON.parse(cachedUser as string);
        }
      }
    } catch (redisError) {
      console.warn('Redis read error:', redisError);
    }

    // If not in cache, get from Firestore
    if (!userData) {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      userData = userDoc.data();

      // Update cache
      try {
        if (redis) {
          await redis.set(cacheKey, JSON.stringify(userData), { ex: 900 });
        }
      } catch (cacheError) {
        console.warn('Redis caching failed:', cacheError);
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        points: userData.points,
        level: userData.level,
        displayName: userData.displayName || userData.username,
        photoURL: userData.photoURL || userData.profileImage,
        badges: userData.badges || [],
        location: userData.location,
      },
    });

  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

export default router;
