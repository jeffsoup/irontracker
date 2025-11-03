import { supabase } from '../lib/supabase';

/**
 * Image Service for Supabase Storage
 * 
 * SECURITY NOTE: The bucket is PUBLIC for reading (to enable public URLs),
 * but all WRITE operations (INSERT/DELETE) are protected by RLS policies:
 * - Users can ONLY upload to folders matching their userId
 * - Users can ONLY delete images from their own folder
 * - All operations require authentication
 */
export const imageService = {
  /**
   * Upload an image to Supabase Storage
   * @param file - The image file to upload
   * @param userId - The ID of the user uploading the file
   * @returns The path to the uploaded file
   * 
   * SECURITY: This operation is protected by RLS. Users can only upload
   * to paths matching their own userId (enforced by Supabase policies).
   */
  async uploadImage(file: File, userId: string): Promise<string> {
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('workout-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    return filePath;
  },

  /**
   * Get the public URL for an image
   * @param path - The path to the image in storage
   * @returns The public URL of the image
   * 
   * NOTE: This method only works if the 'workout-images' bucket is set to PUBLIC
   * in Supabase Storage settings. If the bucket is private, you'll get a 404 error.
   */
  getImageUrl(path: string): string {
    const { data } = supabase.storage
      .from('workout-images')
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  /**
   * Delete an image from Supabase Storage
   * @param path - The path to the image to delete
   * 
   * SECURITY: This operation is protected by RLS. Users can only delete
   * images from folders matching their own userId (enforced by Supabase policies).
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('workout-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Validate that a file is an image and meets size requirements
   * @param file - The file to validate
   * @returns True if valid, throws error if not
   */
  validateImageFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
  }
};

