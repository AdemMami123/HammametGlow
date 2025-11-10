import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocket, SocketEmitters } from './socket';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth.routes';
import challengesRoutes from './routes/challenges.routes';
import submissionsRoutes from './routes/submissions.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import usersRoutes from './routes/users.routes';

// Import services for initialization
import { testCloudinaryConnection } from './config/cloudinary';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);
SocketEmitters.initialize(io);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter); // Rate limiting

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  console.log('🔧 Initializing services...');

  // Test Cloudinary connection
  const cloudinaryConnected = await testCloudinaryConnection();
  if (cloudinaryConnected) {
    console.log('✅ Cloudinary connected successfully');
  } else {
    console.warn('⚠️  Cloudinary connection failed - image uploads may not work');
  }

  // Note: Firebase Admin SDK is initialized in config/firebase-admin.ts
  console.log('✅ Firebase Admin SDK initialized');

  // Note: Redis client is initialized in config/redis.ts
  console.log('✅ Redis client initialized (or running in no-cache mode)');
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();

    httpServer.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📡 HTTP Server running on port ${PORT}`);
      console.log(`🔌 Socket.io server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log('');
      console.log('Available routes:');
      console.log('  - GET  /health');
      console.log('  - POST /api/auth/register');
      console.log('  - POST /api/auth/login');
      console.log('  - GET  /api/challenges');
      console.log('  - GET  /api/leaderboard/global');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export { app, httpServer, io };
