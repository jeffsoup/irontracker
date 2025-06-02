import { supabase } from '../lib/supabase';
import { Workout } from '../types/Exercise';

export const workoutService = {
  async getActiveWorkout(): Promise<Workout | null> {
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
    // Delete all exercises associated with this workout (if not using ON DELETE CASCADE)
    await supabase.from('exercises').delete().eq('workout', id);
    // Delete the workout itself
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) throw error;
  },
}; 