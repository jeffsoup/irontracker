import { useState, useEffect } from 'react'
import { Container, Typography, Box, Snackbar, Alert, Button } from '@mui/material'
import { ExerciseTabs } from './components/ExerciseTabs'
import { WorkoutDialog } from './components/WorkoutDialog'
import { exerciseService } from './services/exerciseService'
import { workoutService } from './services/workoutService'
import { Exercise, Workout } from './types/Exercise'
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
//import { AuthForm } from './components/AuthForm';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//const LOGIN_REQUIRED = import.meta.env.VITE_LOGIN_REQUIRED === 'true';

function App() {

  const [user, setUser] = useState<User | null>(null);

  // if (LOGIN_REQUIRED && !user) {
  //   return <AuthForm />;
  // }

  useEffect(() => {
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const upsertUser = async () => {
      if (user) {
        // You can add more fields as needed
        const { error } = await supabase
          .from('users')
          .upsert([
            {
              id: user.id, // assuming your users table uses the same id as auth.users
              email: user.email,
              // add more fields if needed
            }
          ]);
        if (error) {
          console.error('Error upserting user:', error);
        }
      }
    };
    upsertUser();
  }, [user]);

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)

  useEffect(() => {
    loadExercises()
    checkActiveWorkout()
  }, [])

  const loadExercises = async () => {
    try {
      const data = await exerciseService.getExercises()
      setExercises(data)
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

  const checkActiveWorkout = async () => {
    try {
      const workout = await workoutService.getActiveWorkout()
      setActiveWorkout(workout)
      if (!workout) {
        setDialogOpen(false)
      }
    } catch (error) {
      console.error('Error checking active workout:', error)
    }
  }

  const handleDeleteExercise = async (id: string) => {
    try {
      await exerciseService.deleteExercise(id)
      setExercises(exercises.filter(exercise => exercise.id !== id))
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  const handleStartWorkout = async (categories: string[]) => {
    try {
      const workout = await workoutService.createWorkout(categories)
      setActiveWorkout(workout)
      setDialogOpen(false)
      showSnackbar('Workout started successfully!')
    } catch (error) {
      console.error('Error starting workout:', error)
      showSnackbar('Failed to start workout', 'error')
    }
  }

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return

    try {
      await workoutService.finishWorkout(activeWorkout.id)
      setActiveWorkout(null)
      showSnackbar('Workout finished successfully!')
    } catch (error) {
      console.error('Error finishing workout:', error)
      showSnackbar('Failed to finish workout', 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div
            style={{
              width: '100vw',
              maxWidth: '100vw',
              margin: 0,
              padding: '0 16px',
              boxSizing: 'border-box',
              minHeight: '100vh'
            }}
          >
            <Box sx={{ my: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                  Exercise Tracker
                </Typography>
                <Button
                  variant="contained"
                  color={activeWorkout ? 'secondary' : 'primary'}
                  onClick={activeWorkout ? handleFinishWorkout : () => {
                    setDialogOpen(true);
                  }}
                >
                  {activeWorkout ? 'Finish Workout' : 'Start Workout'}
                </Button>
              </Box>
              <ExerciseTabs 
                onDelete={handleDeleteExercise} 
                activeWorkout={activeWorkout}
                onShowSnackbar={showSnackbar}
                setActiveWorkout={setActiveWorkout}
              />
              <WorkoutDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onStart={handleStartWorkout}
                //user={user}
              />
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert 
                  onClose={handleCloseSnackbar} 
                  severity={snackbarMessage.includes('Failed') ? 'error' : 'success'}
                >
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </Box>
          </div>
        } />
        <Route path="/test" element={
          <div style={{ color: 'black' }}>Test Route Works</div>
        } />
        <Route path="*" element={
          <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>
            404 - Page Not Found
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App
