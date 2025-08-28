import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { workoutService } from '../services/workoutService';
import { exerciseService } from '../services/exerciseService';

interface LastWorkoutExercise {
  name: string;
  category: string;
  reps: number;
  weight: number;
  categories: string[];
}

export const Home: React.FC = () => {
  const [lastWorkout, setLastWorkout] = useState<LastWorkoutExercise[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<{[category: string]: string[]}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the workout category rotation sequence
  const workoutSequence = [
    'back-shoulders', 
    'chest-biceps-triceps',
    'legs'
  ];

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const lastWorkoutData = await workoutService.getLastCompletedWorkout();
      setLastWorkout(lastWorkoutData);
      
      // Get suggested categories based on the last workout
      if (lastWorkoutData.length > 0) {
        const suggestedData = getSuggestedCategories(lastWorkoutData);
        setSuggestedCategories(suggestedData);
        
        // Get exercise recommendations for each suggested category
        const recommendations = await getExerciseRecommendations(suggestedData);
        setExerciseRecommendations(recommendations);
      }
    } catch (err) {
      setError('Failed to load home data');
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCategories = (workoutData: LastWorkoutExercise[]): string[] => {
    try {
      // Get unique categories from the last workout
      const lastWorkoutCategories = [...new Set(workoutData.map(ex => ex.category))];
      
      // Find the next category in the rotation sequence
      const suggestedCategories: string[] = [];
      
      for (const lastCategory of lastWorkoutCategories) {
        // Find the index of the last category in the sequence
        const lastIndex = workoutSequence.findIndex(cat => 
          cat.toLowerCase().includes(lastCategory.toLowerCase()) ||
          lastCategory.toLowerCase().includes(cat.toLowerCase())
        );
        
        if (lastIndex !== -1) {
          // Get the next category in the sequence (with wraparound)
          const nextIndex = (lastIndex + 1) % workoutSequence.length;
          const nextCategory = workoutSequence[nextIndex];
          
          if (!suggestedCategories.includes(nextCategory)) {
            suggestedCategories.push(nextCategory);
          }
        } else {
          // If category not found in sequence, suggest the first category
          if (!suggestedCategories.includes(workoutSequence[0])) {
            suggestedCategories.push(workoutSequence[0]);
          }
        }
      }
      
      // If no suggestions found, default to the first category
      if (suggestedCategories.length === 0) {
        suggestedCategories.push(workoutSequence[0]);
      }
      
      return suggestedCategories;
    } catch (err) {
      console.error('Error getting suggested categories:', err);
      return [workoutSequence[0]]; // Default fallback
    }
  };

  const getExerciseRecommendations = async (categories: string[]): Promise<{[category: string]: string[]}> => {
    try {
      const recommendations: {[category: string]: string[]} = {};
      
      for (const category of categories) {
        try {
          // Parse compound categories (e.g., "chest-biceps" -> ["chest", "biceps"])
          const individualCategories = category.split('-').map(cat => cat.trim());
          
          const allExercises: string[] = [];
          
          // Get exercises for each individual category
          for (const individualCategory of individualCategories) {
            const exercises = await exerciseService.getRecommendedExercises(individualCategory);
            
            // Add exercises to the list, avoiding duplicates
            exercises.forEach(ex => {
              if (!allExercises.includes(ex.name)) {
                allExercises.push(ex.name);
              }
            });
          }
          
          // Store all exercises under the original compound category name
          recommendations[category] = allExercises;
          
        } catch (err) {
          console.error(`Error getting exercises for ${category}:`, err);
          recommendations[category] = [];
        }
      }
      
      return recommendations;
    } catch (err) {
      console.error('Error getting exercise recommendations:', err);
      return {};
    }
  };

  // Helper function to get category descriptions
  const getCategoryDescription = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'chest-biceps':
        return 'Focus on pushing movements and arm curls for upper body strength';
      case 'back-shoulders-triceps':
        return 'Target pulling movements and shoulder stability for balanced development';
      case 'legs':
        return 'Build lower body power with squats, deadlifts, and leg presses';
      default:
        return 'Great choice for your next workout session';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: '#ffffff' }}>
        🏠 Welcome to IronTracker
      </Typography>

      <Grid container spacing={3}>
        {/* Last Workout Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                🏋️ Last Workout Completed
              </Typography>
              
              {lastWorkout.length > 0 ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Workout Categories:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {lastWorkout[0]?.categories?.map((cat: string, index: number) => (
                        <Chip
                          key={index}
                          label={cat}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Exercises Performed:
                  </Typography>
                  {lastWorkout.map((exercise, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#ffffff' }}>
                            {exercise.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                            {exercise.category}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            {exercise.weight} lbs
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exercise.reps} reps
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No workout history found. Start your first workout to see it here!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Suggested Next Workout Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'bold', color: 'secondary.main' }}>
                💡 Suggested Next Workout
              </Typography>
              
              {suggestedCategories.length > 0 ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2, color: '#ffffff' }}>
                    Based on your last workout, here's what to focus on next:
                  </Typography>
                  {suggestedCategories.map((category, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'secondary.50' }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
                        🎯 {category}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, mb: 2, color: '#e0e0e0' }}>
                        {getCategoryDescription(category)}
                      </Typography>
                      
                      {/* Exercise Recommendations */}
                      {exerciseRecommendations[category] && exerciseRecommendations[category].length > 0 ? (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            💪 Recommended Exercises:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {exerciseRecommendations[category].map((exercise, exIndex) => (
                              <Chip
                                key={exIndex}
                                label={exercise}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            💪 Recommended Exercises:
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#e0e0e0' }}>
                            No specific exercises found for this category yet. Start working out to build recommendations!
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" sx={{ color: '#e0e0e0' }}>
                  Complete a workout to get personalized category suggestions!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats Section */}
      <Box sx={{ mt: 4 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
              📊 Quick Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {lastWorkout.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exercises in Last Workout
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {lastWorkout.length > 0 ? lastWorkout[0]?.categories?.length || 0 : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Workout Categories
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {suggestedCategories.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suggested Categories
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
