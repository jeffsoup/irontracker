import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Paper,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ExerciseFormData, Workout } from '../types/Exercise';
import { exerciseService } from '../services/exerciseService';

interface ExerciseFormProps {
  onSubmit: (exercise: ExerciseFormData) => void;
  activeWorkout: Workout | null;
}

interface RecommendedExercise {
  name: string;
  lastUsed: Date;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSubmit, activeWorkout }) => {
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    category: '',
    reps: 0,
    weight: 0,
    date: new Date().toISOString(),
    rating: null,
    notes: '',
    workout: null,
  });

  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [recommendedExercises, setRecommendedExercises] = useState<RecommendedExercise[]>([]);

  useEffect(() => {
    // Only fetch categories from the active workout
    if (activeWorkout) {
      setCategories(activeWorkout.categories);
      // Prepopulate form fields with the most recent exercise for this workout
      exerciseService.getMostRecentExerciseForWorkout(activeWorkout.id)
        .then((exercise) => {
          if (exercise) {
            setFormData((prev) => ({
              ...prev,
              category: exercise.category || '',
              name: exercise.name || '',
              reps: exercise.reps || 0,
              weight: exercise.weight || 0,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              category: '',
              name: '',
              reps: 0,
              weight: 0,
            }));
          }
        })
        .catch(() => {
          setFormData((prev) => ({
            ...prev,
            category: '',
            name: '',
            reps: 0,
            weight: 0,
          }));
        });
    } else {
      setCategories([]);
      setFormData((prev) => ({
        ...prev,
        category: '',
        name: '',
        reps: 0,
        weight: 0,
      }));
    }
  }, [activeWorkout]);

  // New effect: When category changes, prepopulate from most recent exercise in that category for the current workout
  useEffect(() => {
    if (activeWorkout && formData.category) {
      // Find the most recent exercise in the current workout for the selected category
      exerciseService.getExercises()
        .then((exercises) => {
          const match = exercises
            .filter(ex => ex.workout === activeWorkout.id && ex.category === formData.category)
            .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0))[0];
          if (match) {
            setFormData(prev => ({
              ...prev,
              name: match.name || '',
              reps: match.reps || 0,
              weight: match.weight || 0,
              notes: match.notes || '',
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              name: '',
              reps: 0,
              weight: 0,
              notes: '',
            }));
          }
        })
        .catch(() => {
          setFormData(prev => ({
            ...prev,
            name: '',
            reps: 0,
            weight: 0,
            notes: '',
          }));
        });
    }
  }, [formData.category, activeWorkout]);

  useEffect(() => {
    if (formData.category) {
      // Fetch both exercise names and recommendations
      Promise.all([
        exerciseService.getExerciseNamesByCategory(formData.category),
        exerciseService.getRecommendedExercises(formData.category)
      ]).then(([names, recommendations]) => {
        // Filter out nulls from names
        setExerciseNames(names.filter((n): n is string => !!n));
        setRecommendedExercises(recommendations);
        // Reset name if it's not in the new list and not empty
        if (names.length > 0 && formData.name && !names.includes(formData.name)) {
          setFormData(prev => ({ ...prev, name: '' }));
        }
      }).catch(error => {
        console.error('Error fetching exercise data:', error);
        setExerciseNames([]);
        setRecommendedExercises([]);
      });
    } else {
      setExerciseNames([]);
      setRecommendedExercises([]);
    }
  }, [formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeWorkout) {
      onSubmit({
        ...formData,
        name: formData.name ? formData.name.trim() : null,
        notes: formData.notes || null,
        workout: activeWorkout.id,
      });
      setFormData({
        name: '',
        category: '',
        reps: 0,
        weight: 0,
        date: new Date().toISOString(),
        rating: null,
        notes: '',
        workout: null,
      });
      setExerciseNames([]);
      setRecommendedExercises([]);
    }
  };

  const handleExerciseChange = (value: string | null) => {
    setFormData(prev => ({ ...prev, name: value ? value.trim() : '' }));
  };

  const handleRecommendedExerciseClick = (exercise: string) => {
    setFormData(prev => ({ ...prev, name: exercise }));
  };

  const formatLastUsedDate = (date: Date) => {
    return format(date, 'MMM d');
  };

  if (!activeWorkout) {
    return (
      <div className="fitness-empty-state">
        <Typography variant="h3" component="h3">
          No Active Workout (YET)
        </Typography>
        <Typography variant="body1">
          Please start a workout to add exercises
        </Typography>
      </div>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', p: 4 }} className="fitness-card">
      <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4 }}>
        🔥 Add New Set
      </Typography>
      <Stack spacing={4}>
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            label="Category"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {formData.category && recommendedExercises.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recommended Exercises (Least Recently Used):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recommendedExercises.map((exercise) => (
                <Chip
                  key={exercise.name}
                  label={`${exercise.name} (${formatLastUsedDate(exercise.lastUsed)})`}
                  onClick={() => handleRecommendedExerciseClick(exercise.name)}
                  color="primary"
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Paper>
        )}
        <Autocomplete
          freeSolo
          options={exerciseNames.filter((n): n is string => !!n)}
          value={formData.name}
          onChange={(_, newValue) => handleExerciseChange(newValue)}
          onInputChange={(_, newInputValue) => handleExerciseChange(newInputValue)}
          disabled={!formData.category}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exercise"
              required
              helperText={formData.category ? "Select an existing exercise or type a new one" : "Select a category first"}
            />
          )}
        />
        <TextField
          label="Reps"
          type="number"
          value={formData.reps}
          onChange={(e) => setFormData({ ...formData, reps: Number(e.target.value) })}
          required
          fullWidth
          inputProps={{ min: 0 }}
        />
        <TextField
          label="Weight (lbs)"
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
          required
          fullWidth
          inputProps={{ min: 0, step: 'any' }}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            value={formData.date ? new Date(formData.date) : new Date()}
            onChange={(newDate) => setFormData({ ...formData, date: newDate?.toISOString() || new Date().toISOString() })}
          />
        </LocalizationProvider>
        <Box>
          <Typography component="legend">Rating</Typography>
          <Rating
            value={formData.rating}
            onChange={(_, newValue) => setFormData({ ...formData, rating: newValue || null })}
            max={5}
          />
        </Box>
        <TextField
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          multiline
          rows={3}
          fullWidth
        />
        <Button type="submit" variant="contained" color="primary">
          💪 Add Set 💪
        </Button>
      </Stack>
    </Box>
  );
};
