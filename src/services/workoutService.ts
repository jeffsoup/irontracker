import { supabase } from '../lib/supabase';
import { Workout } from '../types/Exercise';
import { getSupabase } from '../lib/supabase';

export const workoutService = {
  async getActiveWorkout(): Promise<Workout | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('is_active', true)
      .is('ended_at', null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return {
      ...data,
      created_at: new Date(data.created_at),
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
    };
  },

  async createWorkout(categories: string[]): Promise<Workout> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workouts')
      .insert([{
        categories,
        is_active: true,
        created_at: new Date().toISOString(),
        ended_at: null,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      created_at: new Date(data.created_at),
      ended_at: null,
    };
  },

  async finishWorkout(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('workouts')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getAllWorkouts(): Promise<Workout[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data?.map((w) => ({
      ...w,
      created_at: new Date(w.created_at),
      ended_at: w.ended_at ? new Date(w.ended_at) : null,
    })) || [];
  },

  async deleteWorkout(id: string): Promise<void> {
    const supabase = getSupabase();
    // Delete all exercises associated with this workout (if not using ON DELETE CASCADE)
    await supabase.from('exercises').delete().eq('workout', id);
    // Delete the workout itself
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) throw error;
  },

  async getLastCompletedWorkout(): Promise<any[]> {
    try {
      const supabase = getSupabase();
      // Get all exercises ordered by workout ID descending, then filter to only the first workout's exercises
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          name,
          category,
          reps,
          weight,
          workout,
          workouts!inner(
            categories
          )
        `)
        .order('workout', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }

      // Get the most recent workout ID from the first result
      const mostRecentWorkoutId = data[0].workout;
      
      // Filter to only exercises from that workout
      const lastWorkoutExercises = data.filter(exercise => exercise.workout === mostRecentWorkoutId);
      
      return lastWorkoutExercises.map(item => ({
        name: item.name,
        category: item.category,
        reps: item.reps,
        weight: item.weight,
        categories: (item.workouts as any)?.categories || []
      }));
    } catch (error) {
      console.error('Error in getLastCompletedWorkout:', error);
      return [];
    }
  },
};
