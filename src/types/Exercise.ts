export interface Exercise {
  id: string;  // UUID
  name: string | null;
  category: string;
  reps: number;
  weight: number;
  date: Date | null;
  rating: number | null;
  notes: string | null;
  workout: string | null;  // Reference to the workout ID
  created_at: Date;
  workoutCategories: string[] | null;  // Categories from the associated workout
  image_path: string | null;  // Path to uploaded image in Supabase Storage
  myorep?: boolean;
  dropset?: boolean;
  video_path?: string | null;
}

export interface ExerciseFormData {
  name: string | null;
  category: string;
  reps: number;
  weight: number;
  date: string | null;
  rating: number | null;
  notes: string | null;
  workout: string | null;
  image_path?: string | null;
  myorep?: boolean;
  dropset?: boolean;
  video_path?: string | null;
}

export interface Workout {
  id: string;
  created_at: Date;
  ended_at: Date | null;
  categories: string[];
  is_active: boolean;
} 