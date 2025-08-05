import { supabase } from '../lib/supabase';
import { Exercise, ExerciseFormData } from '../types/Exercise';

interface RecommendedExercise {
  name: string;
  lastUsed: Date;
}

export const exerciseService = {
  async getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        workouts:workout (
          categories
        )
      `)
      .order('date', { ascending: false })
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data?.map(exercise => ({
      ...exercise,
      date: exercise.date ? new Date(exercise.date) : null,
      workoutCategories: exercise.workouts?.categories || null,
      workouts: undefined // Remove the nested workouts object
    })) || [];
  },

  async getUniqueCategories(): Promise<string[]> {
    // Try to get categories from existing exercises in the current session
    // This bypasses potential RLS issues by using data we already have access to
    const { data: existingCategories, error: existingError } = await supabase
      .from('categories')
      .select('category')
      .order('category', { ascending: true });

    if (existingError) throw existingError;
    
    // Extract unique categories from existing exercises

    const categories = existingCategories?.map((categories: any) => categories.category) || [];
    const uniqueCategories = [...new Set(categories)];
    
    return uniqueCategories.sort();
  },

  async getExerciseNamesByCategory(category: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('name')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;
    
    // Get unique names
    return [...new Set(data?.map(exercise => exercise.name) || [])];
  },

  async getRecommendedExercises(category: string): Promise<RecommendedExercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('name, date')
      .eq('category', category)
      .order('date', { ascending: true });

    if (error) throw error;

    // Get unique exercises with their most recent date
    const exerciseDates = new Map<string, Date>();
    data?.forEach(exercise => {
      const currentDate = new Date(exercise.date);
      if (!exerciseDates.has(exercise.name) || currentDate > exerciseDates.get(exercise.name)!) {
        exerciseDates.set(exercise.name, currentDate);
      }
    });

    // Sort by date (oldest first) and take top 3
    return Array.from(exerciseDates.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())
      .slice(0, 3)
      .map(([name, lastUsed]) => ({ name, lastUsed }));
  },

  async addExercise(exercise: ExerciseFormData): Promise<Exercise> {
    console.log('Adding exercise:', exercise);
    const { data, error } = await supabase
      .from('exercises')
      .insert([exercise])
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      date: new Date(data.date)
    };
  },

  async deleteExercise(id: string): Promise<void> {
    console.log('Deleting exercise with id:', id);
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  },

  async getMostRecentExerciseForWorkout(workoutId: string) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout', workoutId)
      .order('date', { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data[0];
  },

  async updateExercise(id: string, exercise: Partial<Exercise>): Promise<Exercise> {
    // Convert date to ISO string if it exists
    const formattedExercise = {
      ...exercise,
      date: exercise.date?.toISOString(),
    };

    const { data, error } = await supabase
      .from('exercises')
      .update(formattedExercise)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      date: data.date ? new Date(data.date) : null
    };
  }
}; 