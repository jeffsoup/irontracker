import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseForm } from '../ExerciseForm';
import { exerciseService } from '../../services/exerciseService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the exercise service
vi.mock('../../services/exerciseService', () => ({
  exerciseService: {
    getExerciseNamesByCategory: vi.fn(),
    getRecommendedExercises: vi.fn(),
    getMostRecentExerciseForWorkout: vi.fn(),
    getExercises: vi.fn(),
    hasUserExercises: vi.fn(),
    populateStarterExercisesFromCanonical: vi.fn(),
  },
}));

// Mock the image service
vi.mock('../../services/imageService', () => ({
  imageService: {
    uploadImage: vi.fn(),
    uploadVideo: vi.fn(),
  },
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
}));

// Mock date-fns to avoid timezone issues
vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date) => '2024-01-01'),
}));

// Helper function to find MUI Select by its label text
function getCategorySelect() {
  // MUI Select doesn't properly associate label, so find the first combobox (which is the Category Select)
  // The Exercise input is an Autocomplete which has name="Exercise", so we can distinguish them
  const comboboxes = screen.getAllByRole('combobox');
  // The first combobox without a name is the Category Select
  return comboboxes.find(cb => !cb.getAttribute('aria-label')?.includes('Exercise') &&
                               cb.classList.contains('MuiSelect-select')) || comboboxes[0];
}

describe('ExerciseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockActiveWorkout = {
    id: '123',
    categories: ['Strength', 'Cardio'],
    created_at: new Date(),
    is_active: true,
    ended_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses
    (exerciseService.getExerciseNamesByCategory as any).mockResolvedValue(['Bench Press', 'Squats']);
    (exerciseService.getRecommendedExercises as any).mockResolvedValue([
      { name: 'Bench Press', lastUsed: new Date('2024-01-01') },
      { name: 'Squats', lastUsed: new Date('2024-01-02') },
    ]);
    (exerciseService.getMostRecentExerciseForWorkout as any).mockResolvedValue(null);
    (exerciseService.getExercises as any).mockResolvedValue([]);
    (exerciseService.hasUserExercises as any).mockResolvedValue(true);
    (exerciseService.populateStarterExercisesFromCanonical as any).mockResolvedValue(undefined);
  });

  it('renders message when no active workout', () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={null} />);
    expect(screen.getByText('Please start a workout to add exercises')).toBeInTheDocument();
  });

  it('loads categories from active workout into select options', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    // Find the Category select
    const categorySelect = getCategorySelect();
    expect(categorySelect).toBeTruthy();
    fireEvent.mouseDown(categorySelect!);

    // Wait for and check that categories from the workout appear as options
    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByText('Strength')).toBeInTheDocument();
      expect(within(listbox).getByText('Cardio')).toBeInTheDocument();
    });
  });

  it('fetches exercises when category is selected', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    // Open the category dropdown
    const categorySelect = getCategorySelect();
    fireEvent.mouseDown(categorySelect!);

    // Select the Strength option
    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      fireEvent.click(within(listbox).getByText('Strength'));
    });

    // Wait for the service to be called with the selected category
    await waitFor(() => {
      expect(exerciseService.getExerciseNamesByCategory).toHaveBeenCalledWith('Strength');
      expect(exerciseService.getRecommendedExercises).toHaveBeenCalledWith('Strength');
    });
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    // Open and select category
    const categorySelect = getCategorySelect();
    await user.click(categorySelect!);

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByText('Strength')).toBeInTheDocument();
    });

    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('Strength'));

    // Wait for exercise names to load
    await waitFor(() => {
      expect(exerciseService.getExerciseNamesByCategory).toHaveBeenCalledWith('Strength');
    });

    // Fill in exercise name using the Autocomplete combobox
    const exerciseInput = screen.getByRole('combobox', { name: /Exercise/i });
    await user.clear(exerciseInput);
    await user.type(exerciseInput, 'Bench Press');

    // Fill in reps
    const repsInput = screen.getByRole('spinbutton', { name: /Reps/i });
    await user.clear(repsInput);
    await user.type(repsInput, '10');

    // Fill in weight
    const weightInput = screen.getByRole('spinbutton', { name: /Weight/i });
    await user.clear(weightInput);
    await user.type(weightInput, '225');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Add Set/i });
    await user.click(submitButton);

    // Verify submission was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Bench Press',
        category: 'Strength',
        reps: 10,
        weight: 225,
        workout: '123',
      }));
    });
  });

  it('prepopulates form when most recent exercise exists for workout', async () => {
    const mockRecentExercise = {
      id: 'ex-1',
      name: 'Deadlift',
      category: 'Strength',
      reps: 5,
      weight: 315,
      myorep: false,
      dropset: false,
      restpause: false,
    };

    (exerciseService.getMostRecentExerciseForWorkout as any).mockResolvedValue(mockRecentExercise);

    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    // Wait for the service to be called and verify it was called with correct workout ID
    await waitFor(() => {
      expect(exerciseService.getMostRecentExerciseForWorkout).toHaveBeenCalledWith('123');
    });

    // Wait for the form to be populated with the recent exercise data
    // The exercise name should be populated from the mock
    await waitFor(
      () => {
        const exerciseInput = screen.getByRole('combobox', { name: /Exercise/i });
        expect(exerciseInput).toHaveValue('Deadlift');
      },
      { timeout: 3000 }
    );
  });

  it('shows form title correctly', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    // Wait for any async effects to complete
    await waitFor(() => {
      expect(screen.getByText(/Add New Set/i)).toBeInTheDocument();
    });
  });

  it('calls getMostRecentExerciseForWorkout on mount with active workout', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);

    await waitFor(() => {
      expect(exerciseService.getMostRecentExerciseForWorkout).toHaveBeenCalledWith('123');
    });
  });
});
