import { Exercise, ExerciseFormData } from '../types/Exercise';
import { getSupabase } from '../lib/supabase';

interface RecommendedExercise {
  name: string;
  lastUsed: Date;
}

export const exerciseService = {
  async getExercises(): Promise<Exercise[]> {
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) return [];
    if (!user) return [];

    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        workouts:workout (
          categories
        )
      `)
      .eq('user_id', user.id)
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
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to get exercises');
    
    const { data, error } = await supabase
      .from('exercises')
      .select('name')
      .eq('category', category)
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) throw error;
    
    // Get unique names
    return [...new Set(data?.map(exercise => exercise.name) || [])];
  },

  async getRecommendedExercises(category: string): Promise<RecommendedExercise[]> {
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to get exercises');
    
    const { data, error } = await supabase
      .from('exercises')
      .select('name, date')
      .eq('category', category)
      .eq('user_id', user.id)
      .not('date', 'is', null)
      .order('date', { ascending: true });

    if (error) throw error;

    // If no exercises with dates, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Get unique exercises with their most recent date
    const exerciseDates = new Map<string, Date>();
    data.forEach(exercise => {
      // Double-check that date exists and is valid
      if (!exercise.date) return;
      const currentDate = new Date(exercise.date);
      // Check if date is valid
      if (isNaN(currentDate.getTime())) return;
      
      if (!exerciseDates.has(exercise.name) || currentDate > exerciseDates.get(exercise.name)!) {
        exerciseDates.set(exercise.name, currentDate);
      }
    });

    // If no valid exercises with dates, return empty array
    if (exerciseDates.size === 0) {
      return [];
    }

    // Sort by date (oldest first) and take top 3
    return Array.from(exerciseDates.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())
      .slice(0, 3)
      .map(([name, lastUsed]) => ({ name, lastUsed }));
  },

  async getProgressionData(category?: string): Promise<any[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('progression_max')
      .select('category, name, weight, reps, volume, date')
      .not('date', 'is', null)
      .order('date', { ascending: true });
    
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data?.map(item => ({
      ...item,
      date: item.date ? new Date(item.date) : null
    })) || [];
  },

  async getExerciseUsageData(category?: string): Promise<any[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('exercise_usage')
      .select('name, total, category')
      .gt('total', 0)
      .order('total', { ascending: false });
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data || [];
  },

  async hasUserExercises(): Promise<boolean> {
    const supabase = getSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return false;

    const { count, error } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;

    return (count ?? 0) > 0;
  },

  async populateStarterExercisesFromCanonical(): Promise<void> {
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to add starter exercises');

    const { data, error } = await supabase
      .from('exercises_canonical')
      .select('name, category');

    if (error) throw error;

    const canonicalExercises = data || [];
    if (canonicalExercises.length === 0) {
      return;
    }

    const inserts = canonicalExercises.map((row: any) => ({
      name: row.name,
      category: row.category || 'Uncategorized',
      reps: 0,
      weight: 0,
      user_id: user.id,
    }));

    const { error: insertError } = await supabase
      .from('exercises')
      .insert(inserts);

    if (insertError) throw insertError;
  },

  async addExercise(exercise: ExerciseFormData): Promise<Exercise> {
    console.log('Adding exercise:', exercise);
    const supabase = getSupabase();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to add exercises');
    
    // Add userId to the exercise data
    const exerciseWithUserId = {
      ...exercise,
      user_id: user.id
    };
    
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseWithUserId])
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
    const supabase = getSupabase();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to delete exercises');
    
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  },

  async getMostRecentExerciseForWorkout(workoutId: string) {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to update exercises');
    
    // Convert date to ISO string if it exists
    const formattedExercise = {
      ...exercise,
      date: exercise.date?.toISOString(),
    };

    const { data, error } = await supabase
      .from('exercises')
      .update(formattedExercise)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      date: data.date ? new Date(data.date) : null
    };
  },

  async getExerciseHistoryByName(exerciseName: string): Promise<Exercise[]> {
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to get exercise history');
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('name', exerciseName)
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) throw error;
    
    return data?.map(exercise => ({
      ...exercise,
      date: exercise.date ? new Date(exercise.date) : null
    })) || [];
  },

  async getExerciseHistoryAggregatedByName(exerciseName: string): Promise<any[]> {
    const supabase = getSupabase();
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User must be authenticated to get exercise history');
    
    // Fetch all exercises for this name
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('name', exerciseName)
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) throw error;
    
    if (!data || data.length === 0) return [];

    // Group by date and aggregate
    const groupedByDate = new Map<string, any>();
    
    data.forEach(exercise => {
      const date = exercise.date ? new Date(exercise.date).toISOString().split('T')[0] : null;
      if (!date) return;
      
      const weight = exercise.weight ?? 0;
      const reps = exercise.reps ?? 0;
      const volume = weight * reps;
      
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, {
          exercise_date: date,
          name: exercise.name,
          total_volume: 0,
          top_weight: 0,
          top_reps: 0,
        });
      }
      
      const dayData = groupedByDate.get(date);
      dayData.total_volume += volume;
      dayData.top_weight = Math.max(dayData.top_weight, weight);
      dayData.top_reps = Math.max(dayData.top_reps, reps);
    });
    
    // Convert map to array and sort by date descending
    return Array.from(groupedByDate.values())
      .sort((a, b) => new Date(b.exercise_date).getTime() - new Date(a.exercise_date).getTime())
      .reverse(); // Reverse to get ascending order
  }
};
