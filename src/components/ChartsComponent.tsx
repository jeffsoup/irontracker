import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { exerciseService } from '../services/exerciseService';

export const ChartsComponent: React.FC = () => {
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await exerciseService.getUniqueCategories();
        setAvailableCategories(categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProgressionData = async () => {
      try {
        setLoading(true);
        const [progData, usageData] = await Promise.all([
          exerciseService.getProgressionData(selectedCategory === 'All' ? undefined : selectedCategory),
          exerciseService.getExerciseUsageData(selectedCategory === 'All' ? undefined : selectedCategory)
        ]);
        const filteredProg = selectedExercise === 'All'
          ? progData
          : progData.filter((item) => item.name === selectedExercise);
        const filteredUsage = selectedExercise === 'All'
          ? usageData
          : usageData.filter((item) => item.name === selectedExercise);
        setProgressionData(filteredProg);
        setUsageData(filteredUsage);
        setError(null);
      } catch (err) {
        setError('Failed to load chart data');
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressionData();
  }, [selectedCategory, selectedExercise]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (selectedCategory === 'All') {
        setAvailableExercises([]);
        return;
      }
      try {
        const exercises = await exerciseService.getExerciseNamesByCategory(selectedCategory);
        setAvailableExercises(exercises);
      } catch (err) {
        console.error('Error fetching exercises for category:', err);
        setAvailableExercises([]);
      }
    };

    fetchExercises();
  }, [selectedCategory]);

  const handleCategoryChange = (event: any) => {
    const newCategory = event.target.value;
    setSelectedCategory(newCategory);
    setSelectedExercise('All');
  };

  const handleExerciseChange = (event: any) => {
    setSelectedExercise(event.target.value);
  };

  const renderEmptyState = (message: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
      <Typography variant="h6" color="text.secondary">{message}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', minHeight: '70vh', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', minHeight: '70vh', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '70vh', p: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Filter by Category"
            onChange={handleCategoryChange}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {availableCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} disabled={selectedCategory === 'All'}>
          <InputLabel>Filter by Exercise</InputLabel>
          <Select
            value={selectedExercise}
            label="Filter by Exercise"
            onChange={handleExerciseChange}
          >
            <MenuItem value="All">All Exercises</MenuItem>
            {availableExercises.map((exercise) => (
              <MenuItem key={exercise} value={exercise}>
                {exercise}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ mb: 4, p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {selectedCategory === 'All'
            ? 'Progression (Max Weight per Exercise)'
            : selectedExercise === 'All'
              ? `Progression - ${selectedCategory}`
              : `Progression - ${selectedCategory} / ${selectedExercise}`}
        </Typography>
        {progressionData.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Exercise</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Max Weight</TableCell>
                  <TableCell align="right">Reps</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progressionData.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{item.name || '—'}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <Chip label={item.category} size="small" color="primary" variant="outlined" />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">{item.weight ?? '—'}</TableCell>
                    <TableCell align="right">{item.reps ?? '—'}</TableCell>
                    <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          renderEmptyState('No progression data available')
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {selectedCategory === 'All'
            ? 'Exercise Usage Totals'
            : selectedExercise === 'All'
              ? `Exercise Usage - ${selectedCategory}`
              : `Exercise Usage - ${selectedCategory} / ${selectedExercise}`}
        </Typography>
        {usageData.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Exercise</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Total Sessions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usageData.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{item.name || '—'}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <Chip label={item.category} size="small" color="secondary" variant="outlined" />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">{item.total ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          renderEmptyState('No usage data available')
        )}
      </Paper>
    </Box>
  );
};
