import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from '@mui/material';
import { workoutService } from '../services/workoutService';
import { Workout } from '../types/Exercise';

interface WorkoutsListProps {
  activeWorkout: Workout | null;
  onResume: (workout: Workout) => void;
  onDelete: (id: string) => void;
}

export const WorkoutsList: React.FC<WorkoutsListProps> = ({ activeWorkout, onResume, onDelete }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getAllWorkouts();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (workout: Workout) => {
    onResume(workout);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await workoutService.deleteWorkout(deleteId);
      onDelete(deleteId);
      setWorkouts(workouts.filter(w => w.id !== deleteId));
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (workouts.length === 0) {
    return (
      <div className="fitness-empty-state">
        <Typography variant="h3" component="h3">
          No Workouts Yet
        </Typography>
        <Typography variant="body1">
          Start your first workout to see your workout history here
        </Typography>
      </div>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <Typography variant="h2" component="h2" sx={{ mb: 4 }}>All Workouts</Typography>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date Created</TableCell>
              <TableCell>Categories</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workouts.map((workout) => {
              const isActive = !!(activeWorkout && activeWorkout.id === workout.id && workout.is_active && !workout.ended_at);
              const status = workout.is_active && !workout.ended_at ? 'In Progress' : 'Finished';
              return (
                <TableRow key={workout.id}>
                  <TableCell>{workout.created_at.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {workout.categories.map((cat) => (
                        <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      disabled={isActive}
                      onClick={() => handleResume(workout)}
                      sx={{ mr: 1 }}
                    >
                      Re-Open
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDelete(workout.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!deleteId} onClose={cancelDelete}>
        <DialogTitle>Delete Workout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this workout and all its exercises? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
