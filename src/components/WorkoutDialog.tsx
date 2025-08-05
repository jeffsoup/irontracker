import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  SelectChangeEvent,
  Chip,
} from '@mui/material';
import { exerciseService } from '../services/exerciseService';
//import { AuthForm } from '../components/AuthForm';

interface WorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (categories: string[]) => void;
 // user: User | null;
}

export const WorkoutDialog: React.FC<WorkoutDialogProps> = ({
  open,
  onClose,
  onStart
 // user,
}) => {

  const [categories, setCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  useEffect(() => {
    if (open) {
      exerciseService.getUniqueCategories()
        .then(cats => {
          setAvailableCategories(cats);
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          setAvailableCategories([]);
        });
    }
  }, [open]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const handleStartWorkout = () => {
    console.log('WorkoutDialog: handleStartWorkout called with categories:', categories);
    onStart(categories);
    setCategories([]);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories(categories.filter(cat => cat !== categoryToDelete));
  };

  //if (!user) {
 //   return <AuthForm />;
  //}

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start New Workout</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            What will you be exercising in this workout?
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Categories</InputLabel>
            <Select
              multiple
              value={categories}
              onChange={handleChange}
              label="Categories"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value} 
                      onDelete={() => handleDeleteCategory(value)}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleStartWorkout}
          variant="contained"
          disabled={categories.length === 0}
        >
          Start Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
};
