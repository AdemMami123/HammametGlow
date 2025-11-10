import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || '599166385256219',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qU8QmTBglazuXc1skK4BboasB3w',
  secure: true,
});

// Upload options presets
export const uploadOptions = {
  challenges: {
    folder: 'hammametup/challenges',
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  submissions: {
    folder: 'hammametup/submissions',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  avatars: {
    folder: 'hammametup/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  business: {
    folder: 'hammametup/business',
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
};

// Test Cloudinary connection
export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    return false;
  }
}

export default cloudinary;
