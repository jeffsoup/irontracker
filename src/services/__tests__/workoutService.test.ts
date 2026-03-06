import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutService } from '../workoutService';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from '../../lib/supabase';

// Helper to create a mock Supabase client
function createMockSupabase() {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockNeq = vi.fn();
  const mockIs = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  // Chain methods return themselves for fluent API
  const chainable = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    is: mockIs,
    order: mockOrder,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  // Make all methods return the chainable object
  Object.values(chainable).forEach(mock => {
    mock.mockReturnValue(chainable);
  });

  const mockFrom = vi.fn().mockReturnValue(chainable);

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      ...chainable,
    },
  };
}

describe('workoutService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  describe('getActiveWorkout', () => {
    it('should return active workout when one exists', async () => {
      const mockWorkout = {
        id: 'workout-1',
        categories: ['Chest', 'Back'],
        is_active: true,
        created_at: '2024-01-15T10:00:00.000Z',
        ended_at: null,
      };

      mockSupabase._mocks.maybeSingle.mockResolvedValue({ data: mockWorkout, error: null });

      const result = await workoutService.getActiveWorkout();

      expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('workout-1');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.ended_at).toBeNull();
    });

    it('should return null when no active workout exists', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await workoutService.getActiveWorkout();

      expect(result).toBeNull();
    });

    it('should return null for PGRST116 error (no rows)', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      const result = await workoutService.getActiveWorkout();

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSupabase._mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'OTHER', message: 'Database error' }
      });

      await expect(workoutService.getActiveWorkout())
        .rejects.toEqual({ code: 'OTHER', message: 'Database error' });
    });
  });

  describe('createWorkout', () => {
    it('should create a new workout with categories', async () => {
      const categories = ['Chest', 'Triceps'];
      const mockReturnedWorkout = {
        id: 'workout-1',
        categories,
        is_active: true,
        created_at: '2024-01-15T10:00:00.000Z',
        ended_at: null,
      };

      mockSupabase._mocks.single.mockResolvedValue({ data: mockReturnedWorkout, error: null });

      const result = await workoutService.createWorkout(categories);

      expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          categories,
          is_active: true,
          ended_at: null,
        })
      ]);
      expect(result.id).toBe('workout-1');
      expect(result.categories).toEqual(categories);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should throw error when insert fails', async () => {
      mockSupabase._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      await expect(workoutService.createWorkout(['Chest']))
        .rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('finishWorkout', () => {
    it('should mark workout as finished', async () => {
      mockSupabase._mocks.eq.mockResolvedValue({ error: null });

      await workoutService.finishWorkout('workout-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        })
      );
    });

    it('should throw error when update fails', async () => {
      mockSupabase._mocks.eq.mockResolvedValue({
        error: { message: 'Update failed' }
      });

      await expect(workoutService.finishWorkout('workout-1'))
        .rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('reactivateWorkout', () => {
    it('should deactivate other workouts and reactivate the selected one', async () => {
      const mockReactivatedWorkout = {
        id: 'workout-1',
        categories: ['Legs'],
        is_active: true,
        created_at: '2024-01-15T10:00:00.000Z',
        ended_at: null,
      };

      // First call for deactivating other workouts
      mockSupabase._mocks.neq.mockResolvedValueOnce({ error: null });
      // Second call for reactivating the target workout
      mockSupabase._mocks.single.mockResolvedValue({ data: mockReactivatedWorkout, error: null });

      const result = await workoutService.reactivateWorkout('workout-1');

      expect(result.id).toBe('workout-1');
      expect(result.is_active).toBe(true);
      expect(result.ended_at).toBeNull();
    });

    it('should throw error when reactivation fails', async () => {
      mockSupabase._mocks.neq.mockResolvedValueOnce({ error: null });
      mockSupabase._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Reactivation failed' }
      });

      await expect(workoutService.reactivateWorkout('workout-1'))
        .rejects.toEqual({ message: 'Reactivation failed' });
    });
  });

  describe('getAllWorkouts', () => {
    it('should return all workouts sorted by created_at descending', async () => {
      const mockWorkouts = [
        {
          id: 'workout-2',
          categories: ['Back'],
          is_active: false,
          created_at: '2024-01-16T10:00:00.000Z',
          ended_at: '2024-01-16T12:00:00.000Z',
        },
        {
          id: 'workout-1',
          categories: ['Chest'],
          is_active: false,
          created_at: '2024-01-15T10:00:00.000Z',
          ended_at: '2024-01-15T11:00:00.000Z',
        },
      ];

      mockSupabase._mocks.order.mockResolvedValue({ data: mockWorkouts, error: null });

      const result = await workoutService.getAllWorkouts();

      expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      expect(result).toHaveLength(2);
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].ended_at).toBeInstanceOf(Date);
    });

    it('should return empty array when no workouts exist', async () => {
      mockSupabase._mocks.order.mockResolvedValue({ data: [], error: null });

      const result = await workoutService.getAllWorkouts();

      expect(result).toEqual([]);
    });

    it('should handle null ended_at values', async () => {
      const mockWorkouts = [
        {
          id: 'workout-1',
          categories: ['Chest'],
          is_active: true,
          created_at: '2024-01-15T10:00:00.000Z',
          ended_at: null,
        },
      ];

      mockSupabase._mocks.order.mockResolvedValue({ data: mockWorkouts, error: null });

      const result = await workoutService.getAllWorkouts();

      expect(result[0].ended_at).toBeNull();
    });

    it('should throw error when query fails', async () => {
      mockSupabase._mocks.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(workoutService.getAllWorkouts())
        .rejects.toEqual({ message: 'Query failed' });
    });
  });

  describe('deleteWorkout', () => {
    it('should delete associated exercises and then the workout', async () => {
      // First call: delete exercises
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });
      // Second call: delete workout
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });

      await workoutService.deleteWorkout('workout-1');

      // Should call from() twice - once for exercises, once for workouts
      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      expect(mockSupabase._mocks.delete).toHaveBeenCalledTimes(2);
    });

    it('should throw error when workout deletion fails', async () => {
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });
      mockSupabase._mocks.eq.mockResolvedValueOnce({
        error: { message: 'Delete failed' }
      });

      await expect(workoutService.deleteWorkout('workout-1'))
        .rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('getLastCompletedWorkout', () => {
    it('should return exercises from the most recent workout', async () => {
      const mockExercises = [
        {
          name: 'Bench Press',
          category: 'Chest',
          reps: 10,
          weight: 100,
          workout: 'workout-1',
          notes: 'Good set',
          workouts: { categories: ['Chest'], is_active: false },
        },
        {
          name: 'Incline Press',
          category: 'Chest',
          reps: 8,
          weight: 80,
          workout: 'workout-1',
          notes: null,
          workouts: { categories: ['Chest'], is_active: false },
        },
      ];

      mockSupabase._mocks.order.mockReturnValueOnce(mockSupabase._mocks);
      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await workoutService.getLastCompletedWorkout();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Bench Press',
        category: 'Chest',
        reps: 10,
        weight: 100,
        notes: 'Good set',
        categories: ['Chest'],
        is_active: false,
      });
    });

    it('should filter exercises to only the most recent workout', async () => {
      const mockExercises = [
        { name: 'Exercise 1', category: 'Chest', reps: 10, weight: 100, workout: 'workout-2', notes: null, workouts: { categories: ['Chest'], is_active: false } },
        { name: 'Exercise 2', category: 'Back', reps: 8, weight: 80, workout: 'workout-1', notes: null, workouts: { categories: ['Back'], is_active: false } },
      ];

      mockSupabase._mocks.order.mockReturnValueOnce(mockSupabase._mocks);
      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await workoutService.getLastCompletedWorkout();

      // Should only include exercises from workout-2 (the first/most recent one)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Exercise 1');
    });

    it('should return empty array when no exercises exist', async () => {
      mockSupabase._mocks.order.mockReturnValueOnce(mockSupabase._mocks);
      mockSupabase._mocks.order.mockResolvedValue({ data: [], error: null });

      const result = await workoutService.getLastCompletedWorkout();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSupabase._mocks.order.mockReturnValueOnce(mockSupabase._mocks);
      mockSupabase._mocks.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' }
      });

      const result = await workoutService.getLastCompletedWorkout();

      expect(result).toEqual([]);
    });

    it('should handle missing workout relationship data', async () => {
      const mockExercises = [
        {
          name: 'Bench Press',
          category: 'Chest',
          reps: 10,
          weight: 100,
          workout: 'workout-1',
          notes: null,
          workouts: null,
        },
      ];

      mockSupabase._mocks.order.mockReturnValueOnce(mockSupabase._mocks);
      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await workoutService.getLastCompletedWorkout();

      expect(result[0].categories).toEqual([]);
      expect(result[0].is_active).toBe(false);
    });
  });
});
