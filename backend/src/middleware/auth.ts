import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase-admin';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

/**
 * Authentication middleware
 * Verifies Firebase ID token from Authorization header
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token format',
      });
      return;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'citizen',
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);

    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role || 'citizen')) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
};
