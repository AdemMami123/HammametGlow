import { v2 as cloudinary } from 'cloudinary';
import { testCloudinaryConnection, uploadOptions } from '../config/cloudinary';

/**
 * Cloudinary service for media upload operations
 */
export class CloudinaryService {
  static async testConnection(): Promise<boolean> {
    return await testCloudinaryConnection();
  }

  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    file: string,
    folder: 'challenges' | 'submissions' | 'avatars' | 'business'
  ): Promise<{ url: string; publicId: string }> {
    try {
      const options = uploadOptions[folder];
      
      const result = await cloudinary.uploader.upload(file, {
        folder: options.folder,
        transformation: options.transformation,
        resource_type: 'image',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: string[],
    folder: 'challenges' | 'submissions' | 'avatars' | 'business'
  ): Promise<Array<{ url: string; publicId: string }>> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<boolean[]> {
    const deletePromises = publicIds.map((id) => this.deleteImage(id));
    return await Promise.all(deletePromises);
  }

  /**
   * Get image URL with transformations
   */
  static getTransformedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
    }
  ): string {
    return cloudinary.url(publicId, {
      ...transformations,
      secure: true,
    });
  }
}
