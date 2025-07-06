import { supabase } from '@/lib/supabase';
import { SecurityService } from './securityService';

export class StorageError extends Error {
  constructor(message: string, public code?: string, public details?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Service for handling file uploads and storage operations
 */
export class StorageService {
  private static readonly STORAGE_BUCKETS = {
    CAR_IMAGES: 'car-images',
    PROFILE_IMAGES: 'profile-images',
    DOCUMENTS: 'documents',
  } as const;

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Upload car images for vehicle listings
   */
  static async uploadCarImages(
    userId: string,
    listingId: string,
    imageUris: string[]
  ): Promise<string[]> {
    // Check permissions
    const canPost = await SecurityService.canPerformAction(userId, 'canPostCars');
    if (!canPost) {
      throw new StorageError('Only dealers and admins can upload car images');
    }

    try {
      const uploadPromises = imageUris.map(async (uri, index) => {
        
        const fileName = `${listingId}/${Date.now()}-${index}.jpg`;
        
        // For React Native, we need to handle image URIs differently
        let imageData: Blob | ArrayBuffer;
        
        if (uri.startsWith('http')) {
          // Remote image - fetch as blob
          const response = await fetch(uri);
          imageData = await response.blob();
        } else {
          // Local image URI - convert to blob (mock for now)
          // In real app, you'd use react-native-fs or similar
          const response = await fetch(uri);
          imageData = await response.blob();
        }
        
        const { data, error } = await supabase.storage
          .from(this.STORAGE_BUCKETS.CAR_IMAGES)
          .upload(fileName, imageData, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw new StorageError(`Failed to upload image ${index + 1}`, error.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(this.STORAGE_BUCKETS.CAR_IMAGES)
          .getPublicUrl(data.path);

        return urlData.publicUrl;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading car images:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to upload images');
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(
    userId: string,
    file: File
  ): Promise<string> {
    try {
      this.validateImageFile(file);
      
      const fileName = `${userId}/profile.${this.getFileExtension(file.name)}`;
      
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKETS.PROFILE_IMAGES)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing profile image
        });

      if (error) {
        throw new StorageError('Failed to upload profile image', error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKETS.PROFILE_IMAGES)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to upload profile image');
    }
  }

  /**
   * Delete images from storage
   */
  static async deleteImages(
    userId: string,
    bucket: keyof typeof StorageService.STORAGE_BUCKETS,
    paths: string[]
  ): Promise<void> {
    try {
      const bucketName = this.STORAGE_BUCKETS[bucket];
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(paths);

      if (error) {
        throw new StorageError('Failed to delete images', error.message);
      }
    } catch (error) {
      console.error('Error deleting images:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete images');
    }
  }

  /**
   * Get signed URL for private files
   */
  static async getSignedUrl(
    bucket: keyof typeof StorageService.STORAGE_BUCKETS,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const bucketName = this.STORAGE_BUCKETS[bucket];
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new StorageError('Failed to create signed URL', error.message);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      throw new StorageError('Failed to create signed URL');
    }
  }

  /**
   * Validate image file
   */
  private static validateImageFile(file: File): void {
    if (!file) {
      throw new StorageError('No file provided');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new StorageError('File size exceeds 10MB limit');
    }

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new StorageError('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  /**
   * Initialize storage buckets (run once during setup)
   */
  static async initializeBuckets(): Promise<void> {
    try {
      const buckets = Object.values(this.STORAGE_BUCKETS);
      
      for (const bucket of buckets) {
        const { error } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: this.ALLOWED_IMAGE_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE,
        });

        if (error && error.message !== 'Bucket already exists') {
          console.error(`Failed to create bucket ${bucket}:`, error);
        }
      }
    } catch (error) {
      console.error('Error initializing storage buckets:', error);
    }
  }
}
