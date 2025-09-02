import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';
import { WorkoutsList } from './WorkoutsList';
import { ChartsComponent } from './ChartsComponent';
import { Home } from './Home';
import { ExerciseFormData, Workout } from '../types/Exercise';
import { exerciseService } from '../services/exerciseService';
import { supabase } from '../lib/supabase';

interface ExerciseTabsProps {
  onDelete: (id: string) => void;
  activeWorkout: Workout | null;
  onShowSnackbar: (message: string, severity?: 'success' | 'error') => void;
  setActiveWorkout?: (workout: Workout | null) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exercise-tabpanel-${index}`}
      aria-labelledby={`exercise-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ExerciseTabs: React.FC<ExerciseTabsProps> = ({ 
  onDelete, 
  activeWorkout,
  onShowSnackbar,
  setActiveWorkout
}) => {
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAddExercise = async (exerciseData: ExerciseFormData) => {
    if (!activeWorkout) {
      onShowSnackbar('Please start a workout before adding exercises', 'error');
      return;
    }

    if (!activeWorkout.categories.includes(exerciseData.category)) {
      onShowSnackbar('Selected category is not part of the current workout', 'error');
      return;
    }

    try {
      await exerciseService.addExercise({
        ...exerciseData,
        workout: activeWorkout.id,
      });
      setValue(0); // Switch to history tab after adding
      onShowSnackbar('Exercise added successfully!');
    } catch (error) {
      console.error('Error adding exercise:', error);
      onShowSnackbar('Failed to add exercise', 'error');
    }
  };

  // Handler to resume a workout
  const handleResumeWorkout = (workout: Workout) => {
    if (setActiveWorkout) {
      setActiveWorkout(workout);
      onShowSnackbar('Workout resumed!');
    }
  };

  // Handler to delete a workout
  const handleDeleteWorkout = (id: string) => {
    if (activeWorkout && activeWorkout.id === id && setActiveWorkout) {
      setActiveWorkout(null);
    }
    onShowSnackbar('Workout deleted!');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="exercise tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="🏠 Home" />
          <Tab label="💥 Add Set" disabled={!activeWorkout} />
          <Tab label="🏋️ Workouts" />
          <Tab label="📊 History" />
          <Tab label="📈 Charts" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Home />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ExerciseForm 
          onSubmit={handleAddExercise} 
          activeWorkout={activeWorkout}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <WorkoutsList 
          activeWorkout={activeWorkout} 
          onResume={handleResumeWorkout} 
          onDelete={handleDeleteWorkout}
        />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <ExerciseList onDelete={onDelete} activeWorkout={activeWorkout} />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <ChartsComponent />
      </TabPanel>
    </Box>
  );
};

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else alert('Check your email for a confirmation link!');
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div>
      <h2>Sign In / Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      /><br />
      <button onClick={handleSignIn} disabled={loading}>Sign In</button>
      <button onClick={handleSignUp} disabled={loading}>Sign Up</button>
      <button onClick={handleGoogleSignIn} disabled={loading}>Sign In with Google</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};
