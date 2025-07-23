import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Stack,
  Chip,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Exercise } from '../types/Exercise';
import { exerciseService } from '../services/exerciseService';
import { format, isEqual } from 'date-fns';

interface ExerciseListProps {
  onDelete: (id: string) => void;
  activeWorkout?: import('../types/Exercise').Workout | null;
}

interface Filters {
  date: Date | null;
  category: string;
  name: string;
  rating: number | '';
}

interface ExercisesByDate {
  date: Date;
  exercises: Exercise[];
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ onDelete, activeWorkout }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Exercise> | null>(null);
  const [filters, setFilters] = useState<Filters>({
    date: null,
    category: '',
    name: '',
    rating: '',
  });
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    // On mount or when exercises/activeWorkout changes, set default expanded state
    const newExpanded: { [date: string]: boolean } = {};
    if (activeWorkout) {
      // Find the date string for the active workout (using the first exercise for that workout)
      const activeDate = exercises.find(ex => ex.workout === activeWorkout.id)?.date?.toDateString();
      if (activeDate) {
        newExpanded[activeDate] = true;
      }
    }
    setExpandedDates(newExpanded);
  }, [activeWorkout, exercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getExercises();
      setExercises(data);
      setError(null);
    } catch (err) {
      setError('Failed to load exercises');
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await exerciseService.deleteExercise(id);
      onDelete(id);
      setExercises(exercises.filter(exercise => exercise.id !== id));
    } catch (err) {
      console.error('Error deleting exercise:', err);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setEditForm({
      category: exercise.category,
      name: exercise.name,
      reps: exercise.reps,
      weight: exercise.weight,
      rating: exercise.rating,
      notes: exercise.notes,
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;
    try {
      const updatedExercise = await exerciseService.updateExercise(editingId, editForm);
      setExercises(exercises.map(ex => 
        ex.id === editingId ? { ...ex, ...updatedExercise } : ex
      ));
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      console.error('Error updating exercise:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditFormChange = (field: keyof Exercise, value: any) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [field]: value
    });
  };

  const handleFilterChange = (field: keyof Filters, value: string | number | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getUniqueCategories = () => {
    return [...new Set(exercises.map(ex => ex.category))].sort();
  };

  const getUniqueExercises = () => {
    return [...new Set(exercises
      .map(ex => ex.name)
      .filter((name): name is string => name !== null)
    )].sort();
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesDate = !filters.date || 
      (exercise.date && exercise.date.toDateString() === filters.date.toDateString());
    const matchesCategory = !filters.category || 
      exercise.category.toLowerCase().includes(filters.category.toLowerCase());
    const matchesName = !filters.name || 
      exercise.name === filters.name;
    const matchesRating = filters.rating === '' || 
      exercise.rating === filters.rating;

    return matchesDate && matchesCategory && matchesName && matchesRating;
  });

  const groupExercisesByDate = (exercises: Exercise[]): ExercisesByDate[] => {
    const groups = exercises.reduce((acc: { [key: string]: Exercise[] }, exercise) => {
      if (!exercise.date) return acc;
      const dateStr = exercise.date.toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(exercise);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([dateStr, exercises]) => ({
        date: new Date(dateStr),
        exercises,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  };

  const groupedExercises = groupExercisesByDate(filteredExercises);

  const toggleDate = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (groupedExercises.length === 0) {
    return (
      <div className="minimalist-empty-state">
        <Typography variant="h3" component="h3">
          No Exercise History
        </Typography>
        <Typography variant="body1">
          Start adding exercises to see your workout history here
        </Typography>
      </div>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter by Date"
              value={filters.date}
              onChange={(newDate) => handleFilterChange('date', newDate)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {getUniqueCategories().map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Exercise</InputLabel>
            <Select
              value={filters.name}
              label="Exercise"
              onChange={(e) => handleFilterChange('name', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {getUniqueExercises().map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rating</InputLabel>
            <Select
              value={filters.rating}
              label="Rating"
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {[1, 2, 3, 4, 5].map((rating) => (
                <MenuItem key={rating} value={rating}>
                  <Rating value={rating} readOnly size="small" />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Stack>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Exercise</TableCell>
              <TableCell>Reps</TableCell>
              <TableCell>Weight (lbs)</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Workout</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedExercises.map((group) => {
              const dateStr = group.date.toDateString();
              const isExpanded = !!expandedDates[dateStr];
              // Collect unique categories for the day
              const uniqueCategories = Array.from(new Set(group.exercises.map(ex => ex.category))).sort();
              return (
                <React.Fragment key={group.date.toISOString()}>
                  {/* Date Header Row */}
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      sx={{
                        bgcolor: 'grey.50',
                        py: 1,
                        borderBottom: '2px solid',
                        borderColor: 'grey.200',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => toggleDate(dateStr)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton size="small" sx={{ mr: 1 }}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mr: 2 }}>
                          {format(group.date, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {uniqueCategories.map((cat) => (
                            <Chip
                              key={cat}
                              label={cat}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {/* Exercise Rows */}
                  {isExpanded && group.exercises.map((exercise) => (
                    <TableRow 
                      key={exercise.id}
                      sx={{
                        '&:last-child td, &:last-child th': {
                          borderBottom: 0,
                        },
                      }}
                    >
                      <TableCell sx={{ pl: 4 }}>
                        {format(exercise.date!, 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <TextField
                            size="small"
                            value={editForm?.category || ''}
                            onChange={(e) => handleEditFormChange('category', e.target.value)}
                          />
                        ) : (
                          exercise.category
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <TextField
                            size="small"
                            value={editForm?.name || ''}
                            onChange={(e) => handleEditFormChange('name', e.target.value)}
                          />
                        ) : (
                          exercise.name || ''
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editForm?.reps || 0}
                            onChange={(e) => handleEditFormChange('reps', Number(e.target.value))}
                          />
                        ) : (
                          exercise.reps
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editForm?.weight || 0}
                            onChange={(e) => handleEditFormChange('weight', Number(e.target.value))}
                          />
                        ) : (
                          exercise.weight
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <Rating
                            value={editForm?.rating || 0}
                            onChange={(_, value) => handleEditFormChange('rating', value)}
                            size="small"
                          />
                        ) : (
                          <Rating value={exercise.rating || 0} readOnly size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <TextField
                            size="small"
                            value={editForm?.notes || ''}
                            onChange={(e) => handleEditFormChange('notes', e.target.value)}
                          />
                        ) : (
                          exercise.notes || ''
                        )}
                      </TableCell>
                      <TableCell>
                        {exercise.workoutCategories ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {exercise.workoutCategories.map((cat) => (
                              <Chip
                                key={cat}
                                label={cat}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {editingId === exercise.id ? (
                          <>
                            <IconButton
                              onClick={handleSave}
                              size="small"
                              color="primary"
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              onClick={handleCancel}
                              size="small"
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              onClick={() => handleEdit(exercise)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(exercise.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
