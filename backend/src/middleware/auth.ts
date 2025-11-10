import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request type to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    emailVerified?: boolean;
    displayName?: string | null;
  };
}

/**
 * Authentication middleware
 * Verifies Firebase ID tokens from Authorization header
 * 
 * Token format: Authorization: Bearer <firebase-id-token>
 * 
 * Attaches user data to req.user:
 * - uid: Firebase user ID
 * - email: User email
 * - role: User role (from custom claims)
 * 
 * @param req - Express request with AuthRequest interface
 * @param res - Express response
 * @param next - Express next function
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;

    // Missing Authorization header
    if (!authHeader) {
      console.warn('Authentication failed: Missing Authorization header');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header is required',
      });
      return;
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      console.warn('Authentication failed: Invalid Authorization format');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header must use Bearer scheme',
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix

    // Malformed token (empty after Bearer)
    if (!token || token.length === 0) {
      console.warn('Authentication failed: Empty token');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token is missing or empty',
      });
      return;
    }

    // Verify Firebase ID token
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token, true); // checkRevoked = true
    } catch (verifyError: any) {
      console.error('Token verification failed:', verifyError.code, verifyError.message);
      
      // Handle specific Firebase Auth errors
      if (verifyError.code === 'auth/id-token-expired') {
        res.status(401).json({
          success: false,
          error: 'TokenExpired',
          message: 'Authentication token has expired. Please sign in again.',
        });
        return;
      }

      if (verifyError.code === 'auth/id-token-revoked') {
        res.status(401).json({
          success: false,
          error: 'TokenRevoked',
          message: 'Authentication token has been revoked. Please sign in again.',
        });
        return;
      }

      if (verifyError.code === 'auth/argument-error') {
        res.status(401).json({
          success: false,
          error: 'InvalidToken',
          message: 'Invalid token format or signature',
        });
        return;
      }

      // Generic verification failure
      res.status(401).json({
        success: false,
        error: 'AuthenticationFailed',
        message: 'Token verification failed',
      });
      return;
    }

    // Attach decoded user data to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name || null,
      role: (decodedToken as any).role || 'citizen', // Custom claim
    };

    // Log successful authentication (optional - remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ User authenticated: ${req.user.uid} (${req.user.email})`);
    }

    next();
  } catch (error: any) {
    // Catch any unexpected errors
    console.error('Unexpected authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if authenticated user has required role(s)
 * 
 * Must be used after authMiddleware
 * 
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 * 
 * @example
 * router.delete('/admin/users/:id', authMiddleware, requireRole('admin'), deleteUser);
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      console.warn('Authorization failed: User not authenticated');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User must be authenticated to access this resource',
      });
      return;
    }

    const userRole = req.user.role || 'citizen';

    // Check if user has required role
    if (!roles.includes(userRole)) {
      console.warn(`Authorization failed: User ${req.user.uid} (role: ${userRole}) attempted to access resource requiring roles: ${roles.join(', ')}`);
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Insufficient permissions. Required role(s): ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole,
      });
      return;
    }

    // User authorized
    next();
  };
};
