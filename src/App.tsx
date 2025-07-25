import { useState, useEffect } from 'react'
import { Typography, Box, Snackbar, Alert, Button } from '@mui/material'
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

  const showSnackbar = (message: string, _severity: 'success' | 'error' = 'success') => {
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
          <div className="fitness-app">
            <div className="fitness-container">
              <header className="fitness-header">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h1" component="h1">
                    💪 IronTracker
                  </Typography>
                  {activeWorkout && (
                    <Box sx={{
                      background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#0a0a0a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      animation: 'pulse-glow 2s infinite'
                    }}>
                      🔥 WORKOUT ACTIVE
                    </Box>
                  )}
                </Box>
                <Button
                  variant="contained"
                  color={activeWorkout ? 'secondary' : 'primary'}
                  onClick={activeWorkout ? handleFinishWorkout : () => {
                    setDialogOpen(true);
                  }}
                  sx={{
                    minWidth: '180px',
                    height: '56px',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {activeWorkout ? '🏁 FINISH WORKOUT' : '🚀 START WORKOUT'}
                </Button>
              </header>

              <main className="fitness-content">
                <ExerciseTabs
                  onDelete={handleDeleteExercise}
                  activeWorkout={activeWorkout}
                  onShowSnackbar={showSnackbar}
                  setActiveWorkout={setActiveWorkout}
                />
              </main>

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
            </div>
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
