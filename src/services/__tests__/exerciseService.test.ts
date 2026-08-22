import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exerciseService } from '../exerciseService';

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
  const mockNot = vi.fn();
  const mockIs = vi.fn();
  const mockGt = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockRange = vi.fn();
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
    not: mockNot,
    is: mockIs,
    gt: mockGt,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
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
    auth: {
      getUser: vi.fn(),
    },
    _mocks: {
      from: mockFrom,
      ...chainable,
    },
  };
}

describe('exerciseService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  describe('getExercises', () => {
    it('should return empty array when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await exerciseService.getExercises();

      expect(result).toEqual([]);
    });

    it('should return empty array when there is a user error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const result = await exerciseService.getExercises();

      expect(result).toEqual([]);
    });

    it('should fetch exercises for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockExercises = [
        { id: '1', name: 'Squat', category: 'Legs', date: '2024-01-15', workouts: { categories: ['Legs'] } },
        { id: '2', name: 'Bench', category: 'Chest', date: '2024-01-14', workouts: null },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockReturnValue({
        ...mockSupabase._mocks,
        then: (resolve: any) => resolve({ data: mockExercises, error: null }),
      });

      // Need to set up the promise chain properly
      const finalMock = {
        ...mockSupabase._mocks,
      };
      finalMock.order = vi.fn().mockReturnValueOnce(finalMock).mockReturnValueOnce(finalMock).mockResolvedValue({ data: mockExercises, error: null });
      mockSupabase._mocks.eq.mockReturnValue(finalMock);

      const result = await exerciseService.getExercises();

      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(result).toHaveLength(2);
      expect(result[0].workoutCategories).toEqual(['Legs']);
      expect(result[1].workoutCategories).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const finalMock = { ...mockSupabase._mocks };
      finalMock.order = vi.fn().mockReturnValueOnce(finalMock).mockReturnValueOnce(finalMock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      mockSupabase._mocks.eq.mockReturnValue(finalMock);

      await expect(exerciseService.getExercises()).rejects.toEqual({ message: 'Database error' });
    });
  });

  describe('getUniqueCategories', () => {
    it('should return sorted unique categories', async () => {
      const mockCategories = [
        { category: 'Chest' },
        { category: 'Back' },
        { category: 'Legs' },
      ];

      mockSupabase._mocks.order.mockResolvedValue({ data: mockCategories, error: null });

      const result = await exerciseService.getUniqueCategories();

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
      expect(result).toEqual(['Back', 'Chest', 'Legs']);
    });

    it('should return empty array when no categories exist', async () => {
      mockSupabase._mocks.order.mockResolvedValue({ data: [], error: null });

      const result = await exerciseService.getUniqueCategories();

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockSupabase._mocks.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(exerciseService.getUniqueCategories()).rejects.toEqual({ message: 'Query failed' });
    });
  });

  describe('getExerciseNamesByCategory', () => {
    it('should return unique exercise names from exercise_options', async () => {
      const mockUser = { id: 'user-123' };
      const mockExercises = [
        { name: 'Bench Press' },
        { name: 'Incline Press' },
        { name: 'Bench Press' }, // duplicate
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await exerciseService.getExerciseNamesByCategory('Chest');

      expect(mockSupabase.from).toHaveBeenCalledWith('exercise_options');
      expect(result).toEqual(['Bench Press', 'Incline Press']);
    });

    it('should page through user exercises when exercise_options is unavailable', async () => {
      const mockUser = { id: 'user-123' };
      const firstPage = Array.from({ length: 1000 }, (_, index) => ({
        name: index < 999 ? 'Bench Press' : 'Cable Fly',
      }));
      const secondPage = [{ name: 'Dips' }, { name: 'Cable Fly' }];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order
        .mockResolvedValueOnce({ data: null, error: { message: 'view unavailable' } })
        .mockReturnValueOnce(mockSupabase._mocks)
        .mockReturnValueOnce(mockSupabase._mocks);

      mockSupabase._mocks.range
        .mockResolvedValueOnce({ data: firstPage, error: null })
        .mockResolvedValueOnce({ data: secondPage, error: null });

      const result = await exerciseService.getExerciseNamesByCategory('Chest');

      expect(mockSupabase.from).toHaveBeenCalledWith('exercise_options');
      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(result).toEqual(['Bench Press', 'Cable Fly', 'Dips']);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exerciseService.getExerciseNamesByCategory('Chest'))
        .rejects.toThrow('User must be authenticated to get exercises');
    });
  });

  describe('getRecommendedExercises', () => {
    it('should return top 3 least recently used exercises', async () => {
      const mockUser = { id: 'user-123' };
      const mockExercises = [
        { name: 'Exercise A', date: '2024-01-01' },
        { name: 'Exercise B', date: '2024-01-05' },
        { name: 'Exercise C', date: '2024-01-03' },
        { name: 'Exercise D', date: '2024-01-10' },
        { name: 'Exercise A', date: '2024-01-02' }, // More recent for A
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await exerciseService.getRecommendedExercises('Chest');

      expect(result).toHaveLength(3);
      // Should be sorted by oldest last-used date
      expect(result[0].name).toBe('Exercise A');
      expect(result[1].name).toBe('Exercise C');
      expect(result[2].name).toBe('Exercise B');
    });

    it('should return empty array when no exercises exist', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: [], error: null });

      const result = await exerciseService.getRecommendedExercises('Chest');

      expect(result).toEqual([]);
    });

    it('should handle exercises with invalid dates', async () => {
      const mockUser = { id: 'user-123' };
      const mockExercises = [
        { name: 'Exercise A', date: 'invalid-date' },
        { name: 'Exercise B', date: null },
        { name: 'Exercise C', date: '2024-01-03' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockExercises, error: null });

      const result = await exerciseService.getRecommendedExercises('Chest');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Exercise C');
    });
  });

  describe('addExercise', () => {
    it('should add exercise for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const exerciseData = {
        name: 'Squat',
        category: 'Legs',
        reps: 10,
        weight: 100,
        date: '2024-01-15',
        rating: 4,
        notes: 'Good form',
        workout: null,
      };
      const mockReturnedData = {
        id: 'exercise-1',
        ...exerciseData,
        user_id: mockUser.id,
        date: '2024-01-15T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.single.mockResolvedValue({ data: mockReturnedData, error: null });

      const result = await exerciseService.addExercise(exerciseData);

      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(result.id).toBe('exercise-1');
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const exerciseData = {
        name: 'Squat',
        category: 'Legs',
        reps: 10,
        weight: 100,
        date: '2024-01-15',
        rating: null,
        notes: null,
        workout: null,
      };

      await expect(exerciseService.addExercise(exerciseData))
        .rejects.toThrow('User must be authenticated to add exercises');
    });

    it('should throw error when insert fails', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      const exerciseData = {
        name: 'Squat',
        category: 'Legs',
        reps: 10,
        weight: 100,
        date: '2024-01-15',
        rating: null,
        notes: null,
        workout: null,
      };

      await expect(exerciseService.addExercise(exerciseData))
        .rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('deleteExercise', () => {
    it('should delete exercise for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.eq.mockReturnValueOnce(mockSupabase._mocks).mockResolvedValue({ error: null });

      await exerciseService.deleteExercise('exercise-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(exerciseService.deleteExercise('exercise-1'))
        .rejects.toThrow('User must be authenticated to delete exercises');
    });
  });

  describe('updateExercise', () => {
    it('should update exercise for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const updateData = { weight: 120, reps: 12 };
      const mockReturnedData = {
        id: 'exercise-1',
        name: 'Squat',
        category: 'Legs',
        weight: 120,
        reps: 12,
        date: '2024-01-15T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.single.mockResolvedValue({ data: mockReturnedData, error: null });

      const result = await exerciseService.updateExercise('exercise-1', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
      expect(result.weight).toBe(120);
      expect(result.reps).toBe(12);
    });

    it('should convert date to ISO string when updating', async () => {
      const mockUser = { id: 'user-123' };
      const updateDate = new Date('2024-01-20');
      const updateData = { date: updateDate };
      const mockReturnedData = {
        id: 'exercise-1',
        date: '2024-01-20T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.single.mockResolvedValue({ data: mockReturnedData, error: null });

      await exerciseService.updateExercise('exercise-1', updateData);

      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({ date: updateDate.toISOString() })
      );
    });
  });

  describe('getExerciseHistoryByName', () => {
    it('should return exercise history sorted by date', async () => {
      const mockUser = { id: 'user-123' };
      const mockHistory = [
        { id: '1', name: 'Squat', date: '2024-01-10' },
        { id: '2', name: 'Squat', date: '2024-01-15' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockHistory, error: null });

      const result = await exerciseService.getExerciseHistoryByName('Squat');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should handle exercises with null dates', async () => {
      const mockUser = { id: 'user-123' };
      const mockHistory = [
        { id: '1', name: 'Squat', date: null },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockHistory, error: null });

      const result = await exerciseService.getExerciseHistoryByName('Squat');

      expect(result[0].date).toBeNull();
    });
  });

  describe('getExerciseHistoryAggregatedByName', () => {
    it('should aggregate exercises by date', async () => {
      const mockUser = { id: 'user-123' };
      const mockHistory = [
        { id: '1', name: 'Squat', date: '2024-01-15', weight: 100, reps: 10 },
        { id: '2', name: 'Squat', date: '2024-01-15', weight: 110, reps: 8 },
        { id: '3', name: 'Squat', date: '2024-01-16', weight: 105, reps: 10 },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: mockHistory, error: null });

      const result = await exerciseService.getExerciseHistoryAggregatedByName('Squat');

      expect(result).toHaveLength(2);

      // Check 2024-01-15 aggregation
      const jan15 = result.find((r: any) => r.exercise_date === '2024-01-15');
      expect(jan15.total_volume).toBe(100 * 10 + 110 * 8); // 1880
      expect(jan15.top_weight).toBe(110);
      expect(jan15.top_reps).toBe(10);
    });

    it('should return empty array when no exercises exist', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.order.mockResolvedValue({ data: [], error: null });

      const result = await exerciseService.getExerciseHistoryAggregatedByName('Squat');

      expect(result).toEqual([]);
    });
  });

  describe('getProgressionData', () => {
    it('should fetch progression data without category filter', async () => {
      const mockData = [
        { category: 'Legs', name: 'Squat', weight: 100, reps: 10, date: '2024-01-15' },
      ];

      mockSupabase._mocks.order.mockResolvedValue({ data: mockData, error: null });

      const result = await exerciseService.getProgressionData();

      expect(mockSupabase.from).toHaveBeenCalledWith('progression_max');
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should apply category filter when provided', async () => {
      const mockData = [
        { category: 'Legs', name: 'Squat', weight: 100, reps: 10, date: '2024-01-15' },
      ];

      mockSupabase._mocks.order.mockReturnValue({
        ...mockSupabase._mocks,
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      await exerciseService.getProgressionData('Legs');

      expect(mockSupabase.from).toHaveBeenCalledWith('progression_max');
    });
  });

  describe('hasUserExercises', () => {
    it('should return true when user has exercises', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.eq.mockResolvedValue({ count: 5, error: null });

      const result = await exerciseService.hasUserExercises();

      expect(result).toBe(true);
    });

    it('should return false when user has no exercises', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase._mocks.eq.mockResolvedValue({ count: 0, error: null });

      const result = await exerciseService.hasUserExercises();

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await exerciseService.hasUserExercises();

      expect(result).toBe(false);
    });
  });

  describe('getMostRecentExerciseForWorkout', () => {
    it('should return the most recent exercise for a workout', async () => {
      const mockExercise = { id: '1', name: 'Squat', workout: 'workout-1' };

      mockSupabase._mocks.limit.mockResolvedValue({ data: [mockExercise], error: null });

      const result = await exerciseService.getMostRecentExerciseForWorkout('workout-1');

      expect(result).toEqual(mockExercise);
    });

    it('should return null when no exercises exist for workout', async () => {
      mockSupabase._mocks.limit.mockResolvedValue({ data: [], error: null });

      const result = await exerciseService.getMostRecentExerciseForWorkout('workout-1');

      expect(result).toBeNull();
    });
  });
});
