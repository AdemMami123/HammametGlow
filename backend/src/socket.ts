import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { adminAuth } from './config/firebase-admin';

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Attach user data to socket
      socket.data.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'citizen',
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user?.uid} (${user?.email})`);

    // Join user's personal room
    socket.join(`user:${user?.uid}`);

    // Handle challenge room join
    socket.on('join:challenge', (challengeId: string) => {
      socket.join(`challenge:${challengeId}`);
      console.log(`User ${user?.uid} joined challenge room: ${challengeId}`);
    });

    // Handle challenge room leave
    socket.on('leave:challenge', (challengeId: string) => {
      socket.leave(`challenge:${challengeId}`);
      console.log(`User ${user?.uid} left challenge room: ${challengeId}`);
    });

    // Handle leaderboard room join
    socket.on('join:leaderboard', () => {
      socket.join('leaderboard:global');
      console.log(`User ${user?.uid} joined global leaderboard room`);
    });

    // Handle leaderboard room leave
    socket.on('leave:leaderboard', () => {
      socket.leave('leaderboard:global');
      console.log(`User ${user?.uid} left global leaderboard room`);
    });

    // Handle real-time notifications
    socket.on('notification:read', (notificationId: string) => {
      console.log(`User ${user?.uid} read notification: ${notificationId}`);
      // Emit acknowledgment
      socket.emit('notification:read:ack', { notificationId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user?.uid}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${user?.uid}:`, error);
    });
  });

  return io;
};

/**
 * Socket.io event emitters
 */
export class SocketEmitters {
  private static io: Server;

  static initialize(io: Server): void {
    this.io = io;
  }

  /**
   * Emit notification to a specific user
   */
  static emitNotification(userId: string, notification: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Emit challenge update to all participants
   */
  static emitChallengeUpdate(challengeId: string, update: any): void {
    if (!this.io) return;
    this.io.to(`challenge:${challengeId}`).emit('challenge:update', update);
  }

  /**
   * Emit new submission to challenge room
   */
  static emitNewSubmission(challengeId: string, submission: any): void {
    if (!this.io) return;
    this.io.to(`challenge:${challengeId}`).emit('submission:new', submission);
  }

  /**
   * Emit leaderboard update
   */
  static emitLeaderboardUpdate(leaderboard: any): void {
    if (!this.io) return;
    this.io.to('leaderboard:global').emit('leaderboard:update', leaderboard);
  }

  /**
   * Emit badge earned notification
   */
  static emitBadgeEarned(userId: string, badge: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('badge:earned', badge);
  }

  /**
   * Emit points awarded notification
   */
  static emitPointsAwarded(userId: string, points: number, reason: string): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('points:awarded', { points, reason });
  }
}
