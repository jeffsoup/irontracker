# Image Upload Feature - Implementation Summary

## Overview
Added image upload functionality to IronTracker, allowing users to attach images to their exercise sets using Supabase Storage.

## What Was Implemented

### 1. **Type Definitions Updated** (`src/types/Exercise.ts`)
- Added `image_path` field to the `Exercise` interface
- Added optional `image_path` field to the `ExerciseFormData` interface

### 2. **Image Service Created** (`src/services/imageService.ts`)
A new service that handles all image-related operations:
- **`uploadImage(file, userId)`** - Uploads an image to Supabase Storage
  - Generates unique filenames to avoid collisions
  - Stores files at path: `workout-images/{userId}/{timestamp}-{random}.{ext}`
- **`getImageUrl(path)`** - Gets the public URL for viewing an image
- **`deleteImage(path)`** - Deletes an image from storage
- **`validateImageFile(file)`** - Validates file type and size
  - Accepts: JPEG, PNG, GIF, WebP
  - Max size: 5MB

### 3. **ExerciseForm Component** (`src/components/ExerciseForm.tsx`)
Enhanced the form for adding new exercise sets:
- **Image Upload Button** - Users can optionally add an image when creating a set
- **Image Preview** - Shows a thumbnail preview of the selected image in the form
- **Image Dialog** - Full-size preview dialog before submission
- **Remove Image Button** - Allows users to remove the selected image
- **Upload Progress** - Disables submit button and shows "Uploading..." during upload
- **Error Handling** - Displays validation and upload errors
- Images are uploaded to Supabase Storage when the form is submitted
- The image path is stored with the exercise record

### 4. **ExerciseList Component** (`src/components/ExerciseList.tsx`)
Enhanced the exercise history table:

#### Display Mode:
- **Image Column** - New column in the table showing an image icon for exercises with images
- **View Image** - Clicking the icon opens a full-screen dialog to view the image

#### Edit Mode:
- **Image Upload Button** - When editing an exercise, users can add or change the image
- **Image Preview** - Shows the current or newly selected image
- **Image Replacement** - When changing an image, the old one is deleted and replaced
- **Remove Image** - Users can remove images during editing
- **Upload Progress** - Save and Cancel buttons are disabled during upload

## Supabase Storage Configuration

### Storage Bucket
- **Bucket Name**: `workout-images`
- **File Path Structure**: `{userId}/{timestamp}-{random}.{extension}`

### Required Setup in Supabase
Make sure you have:
1. Created the `workout-images` bucket in Supabase Storage
2. Added the `image_path` column to the `exercises` table (type: `text`, nullable)
3. Set appropriate Storage policies for authenticated users:
   ```sql
   -- Allow users to upload images to their own folder
   CREATE POLICY "Users can upload images to their own folder"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'workout-images' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow users to view their own images
   CREATE POLICY "Users can view their own images"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'workout-images' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow users to delete their own images
   CREATE POLICY "Users can delete their own images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'workout-images' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

## User Flow

### Adding an Image to a New Exercise
1. Start or continue a workout
2. Fill in the exercise details (category, name, reps, weight, etc.)
3. Click "Add Image (Optional)" button
4. Select an image file from their device
5. Preview the image in a dialog
6. Click "Looks Good" to confirm or "Remove Image" to cancel
7. Submit the form - image uploads automatically
8. The image path is saved with the exercise

### Editing an Image on an Existing Exercise
1. Click the edit button on an exercise
2. Click "Add" or "Change" button in the Image column
3. Select a new image
4. Preview and confirm
5. Click the Save button
6. Old image (if exists) is deleted
7. New image is uploaded
8. Exercise record is updated

### Viewing an Image
1. In the exercise history table, look for the image icon in the Image column
2. Click the icon to view the full-size image
3. Close the dialog when done

## Error Handling
- File type validation (must be an image)
- File size validation (max 5MB)
- Upload errors are displayed to the user
- Authentication errors are caught
- Network errors are handled gracefully

## Technical Notes
- Images are uploaded only when the form is submitted (not immediately on selection)
- File names are generated with timestamps and random strings to prevent collisions
- When editing, old images are deleted before uploading new ones to save storage space
- All image operations require user authentication
- Uses Material-UI components for consistent styling

