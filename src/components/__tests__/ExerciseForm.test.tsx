
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseForm } from '../ExerciseForm';
import { exerciseService } from '../../services/exerciseService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Autocomplete: ({ options, value, onChange, renderInput }: any) => (
      <div>
        {renderInput({
          value,
          onChange: (e: any) => onChange(null, e.target.value),
        })}
        <ul>
          {options.map((option: string) => (
            <li key={option} onClick={() => onChange(null, option)}>
              {option}
            </li>
          ))}
        </ul>
      </div>
    ),
  };
});

// Mock the exercise service
vi.mock('../../services/exerciseService', () => ({
  exerciseService: {
    getExerciseNamesByCategory: vi.fn(),
    getRecommendedExercises: vi.fn(),
  },
}));

// Mock date-fns to avoid timezone issues
vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date) => '2024-01-01'),
}));

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
  });

  it('renders message when no active workout', () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={null} />);
    expect(screen.getByText('Please start a workout to add exercises')).toBeInTheDocument();
  });

  it('loads categories from active workout', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
    });
  });

  it('fetches exercises when category is selected', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);
    
    // Select a category
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const strengthOption = await screen.findByText('Strength');
    fireEvent.click(strengthOption);

    // Wait for exercises to load
    await waitFor(() => {
      expect(exerciseService.getExerciseNamesByCategory).toHaveBeenCalledWith('Strength');
    });

    // Check if recommended exercises are displayed
    expect(screen.getByText(/Bench Press/)).toBeInTheDocument();
    expect(screen.getByText(/Squats/)).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);
    
    // Select a category
    const categorySelect = screen.getByLabelText('Category');
    await user.click(categorySelect);
    const strengthOption = await screen.findByText('Strength');
    await user.click(strengthOption);

    // Fill in exercise details
    const exerciseInput = screen.getByLabelText('Exercise');
    await user.type(exerciseInput, 'Bench Press');
    
    const repsInput = screen.getByLabelText('Reps');
    await user.type(repsInput, '10');
    
    const weightInput = screen.getByLabelText('Weight (lbs)');
    await user.type(weightInput, '225');
    
    // Submit the form
    const submitButton = screen.getByText('Add Set');
    await user.click(submitButton);

    // Verify submission
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Bench Press',
      category: 'Strength',
      reps: 10,
      weight: 225,
      workout: '123',
    }));
  });

  it('handles recommended exercise selection', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);
    
    // Select category to load recommended exercises
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('Strength'));

    await waitFor(() => {
      expect(screen.getByText(/Recommended Exercises/)).toBeInTheDocument();
    });

    // Click on a recommended exercise
    fireEvent.click(screen.getByText(/Bench Press/));

    // Verify the exercise name is populated
    const exerciseInput = screen.getByLabelText('Exercise');
    expect(exerciseInput).toHaveValue('Bench Press');
  });

  it('validates required fields', async () => {
    render(<ExerciseForm onSubmit={mockOnSubmit} activeWorkout={mockActiveWorkout} />);
    
    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Add Set'));

    // Check for required field validation
    expect(screen.getByLabelText('Category')).toBeInvalid();
    expect(screen.getByLabelText('Exercise')).toBeInvalid();
    expect(screen.getByLabelText('Reps')).toBeInvalid();
    expect(screen.getByLabelText('Weight (lbs)')).toBeInvalid();

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 