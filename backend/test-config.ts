import dotenv from 'dotenv';
import { adminAuth, adminDb, adminStorage } from './src/config/firebase-admin';
import { redis, testRedisConnection } from './src/config/redis';
import { testCloudinaryConnection } from './src/config/cloudinary';

// Load environment variables
dotenv.config();

/**
 * Test script to verify all service configurations
 */
async function testConfigurations() {
  console.log('🧪 Starting Configuration Tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Environment Variables
  console.log('📋 Test 1: Environment Variables');
  try {
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      console.log(`   ❌ Missing environment variables: ${missingVars.join(', ')}`);
      failedTests++;
    } else {
      console.log('   ✅ All required environment variables present');
      passedTests++;
    }
    
    // Check optional vars
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.log('   ⚠️  FIREBASE_PRIVATE_KEY not set (Firebase won\'t work)');
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('   ⚠️  CLOUDINARY_CLOUD_NAME not set (uploads won\'t work)');
    }
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.log('   ⚠️  Redis credentials not set (caching disabled)');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 2: Firebase Admin SDK
  console.log('🔥 Test 2: Firebase Admin SDK');
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      // Test Firestore connection
      const testRef = adminDb.collection('_test_').doc('connection');
      await testRef.set({ timestamp: new Date(), test: true });
      await testRef.delete();
      
      console.log('   ✅ Firebase Firestore connection successful');
      console.log(`   ✅ Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
      passedTests++;
    } else {
      console.log('   ❌ Firebase private key not configured');
      console.log('   💡 Add your Firebase private key to .env file');
      failedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Firebase connection failed: ${error.message}`);
    failedTests++;
  }
  console.log('');
  
  // Test 3: Cloudinary
  console.log('☁️  Test 3: Cloudinary');
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here') {
      const isConnected = await testCloudinaryConnection();
      if (isConnected) {
        console.log('   ✅ Cloudinary connection successful');
        console.log(`   ✅ Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        passedTests++;
      } else {
        console.log('   ❌ Cloudinary connection failed');
        console.log('   💡 Check your CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET');
        failedTests++;
      }
    } else {
      console.log('   ❌ Cloudinary cloud name not configured');
      console.log('   💡 Add your cloud name from Cloudinary dashboard to .env');
      failedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Cloudinary test failed: ${error.message}`);
    failedTests++;
  }
  console.log('');
  
  // Test 4: Redis (Upstash)
  console.log('📦 Test 4: Redis (Upstash)');
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      if (redis) {
        // Test set/get
        await redis.set('test_key', 'test_value', { ex: 10 });
        const value = await redis.get('test_key');
        await redis.del('test_key');
        
        if (value === 'test_value') {
          console.log('   ✅ Redis connection successful');
          console.log('   ✅ Cache operations working');
          passedTests++;
        } else {
          console.log('   ❌ Redis operations failed');
          failedTests++;
        }
      } else {
        console.log('   ❌ Redis client not initialized');
        failedTests++;
      }
    } else {
      console.log('   ⚠️  Redis not configured (optional)');
      console.log('   💡 Server will run without caching');
      console.log('   💡 Add Upstash credentials to .env for better performance');
      // Not counting as failed since Redis is optional
    }
  } catch (error: any) {
    console.log(`   ❌ Redis test failed: ${error.message}`);
    failedTests++;
  }
  console.log('');
  
  // Test 5: Port Availability
  console.log('🔌 Test 5: Port Configuration');
  try {
    const port = process.env.PORT || 5000;
    console.log(`   ✅ Server will run on port ${port}`);
    console.log(`   ✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    passedTests++;
  } catch (error: any) {
    console.log(`   ❌ Port configuration error: ${error.message}`);
    failedTests++;
  }
  console.log('');
  
  // Summary
  console.log('═'.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⚠️  Warnings: Check logs above`);
  console.log('═'.repeat(50));
  console.log('');
  
  if (failedTests === 0 && passedTests >= 4) {
    console.log('🎉 All critical tests passed!');
    console.log('💡 You can start the server with: npm run dev');
    console.log('');
  } else if (failedTests > 0) {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('📖 See CONFIGURATION_GUIDE.md for setup instructions');
    console.log('');
  }
  
  // Exit
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
testConfigurations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
