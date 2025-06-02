import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';
import { WorkoutsList } from './WorkoutsList';
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
        <Box sx={{ p: 3 }}>
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
  const [dashboardUrl, setDashboardUrl] = useState<string>('');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (value === 3) {
      const apiDomain = import.meta.env.VITE_DASHBOARD_API_DOMAIN;
      if (!apiDomain) {
        onShowSnackbar('Dashboard API domain is not set', 'error');
        return;
      }
      setDashboardLoading(true);
      fetch(`${apiDomain}/mb-url`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch dashboard URL');
          return res.json();
        })
        .then(data => {
          setDashboardUrl(data.url);
        })
        .catch(err => {
          setDashboardUrl('');
          onShowSnackbar('Failed to load dashboard', 'error');
        })
        .finally(() => {
          setDashboardLoading(false);
        });
    }
  }, [value, refreshKey, onShowSnackbar]);

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
        <Tabs value={value} onChange={handleChange} aria-label="exercise tabs">
          <Tab label="Add Exercise" disabled={!activeWorkout} />
          <Tab label="Workouts" />
          <Tab label="Exercise History" />
          <Tab label="Charts" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ExerciseForm 
          onSubmit={handleAddExercise} 
          activeWorkout={activeWorkout}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <WorkoutsList 
          activeWorkout={activeWorkout} 
          onResume={handleResumeWorkout} 
          onDelete={handleDeleteWorkout}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ExerciseList onDelete={onDelete} activeWorkout={activeWorkout} />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Box sx={{ width: '100%', height: '70vh', p: 0 }}>
          {dashboardLoading ? (
            <div>Loading dashboard...</div>
          ) : dashboardUrl ? (
            <iframe
              key={dashboardUrl}
              title="Your Data"
              src={dashboardUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              onError={() => {
                setDashboardUrl('');
                setDashboardLoading(true);
                setRefreshKey(prev => prev + 1);
                onShowSnackbar('Session expired. Refreshing dashboard...', 'error');
              }}
            />
          ) : !dashboardLoading ? (
            <div>Dashboard unavailable.</div>
          ) : null}
        </Box>
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