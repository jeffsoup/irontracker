import React, { useState, useEffect, useMemo } from 'react';
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
  TableSortLabel,
} from '@mui/material';
import { exerciseService } from '../services/exerciseService';

type SortOrder = 'asc' | 'desc';
type ProgressionSortField = 'name' | 'category' | 'weight' | 'reps' | 'date';
type UsageSortField = 'name' | 'category' | 'total';

export const ChartsComponent: React.FC = () => {
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [progressionSortField, setProgressionSortField] = useState<ProgressionSortField>('date');
  const [progressionSortOrder, setProgressionSortOrder] = useState<SortOrder>('desc');
  const [usageSortField, setUsageSortField] = useState<UsageSortField>('total');
  const [usageSortOrder, setUsageSortOrder] = useState<SortOrder>('desc');

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

  const handleProgressionSort = (field: ProgressionSortField) => {
    const isAsc = progressionSortField === field && progressionSortOrder === 'asc';
    setProgressionSortField(field);
    setProgressionSortOrder(isAsc ? 'desc' : 'asc');
  };

  const handleUsageSort = (field: UsageSortField) => {
    const isAsc = usageSortField === field && usageSortOrder === 'asc';
    setUsageSortField(field);
    setUsageSortOrder(isAsc ? 'desc' : 'asc');
  };

  const sortedProgressionData = useMemo(() => {
    const sorted = [...progressionData];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (progressionSortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'weight':
          aValue = a.weight ?? 0;
          bValue = b.weight ?? 0;
          break;
        case 'reps':
          aValue = a.reps ?? 0;
          bValue = b.reps ?? 0;
          break;
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return progressionSortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return progressionSortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [progressionData, progressionSortField, progressionSortOrder]);

  const sortedUsageData = useMemo(() => {
    const sorted = [...usageData];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (usageSortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'total':
          aValue = a.total ?? 0;
          bValue = b.total ?? 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return usageSortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return usageSortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [usageData, usageSortField, usageSortOrder]);

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
                  <TableCell>
                    <TableSortLabel
                      active={progressionSortField === 'name'}
                      direction={progressionSortField === 'name' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('name')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Exercise
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={progressionSortField === 'category'}
                      direction={progressionSortField === 'category' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('category')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={progressionSortField === 'weight'}
                      direction={progressionSortField === 'weight' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('weight')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Max Weight
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={progressionSortField === 'reps'}
                      direction={progressionSortField === 'reps' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('reps')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Reps
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={progressionSortField === 'date'}
                      direction={progressionSortField === 'date' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('date')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProgressionData.map((item, index) => (
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
                  <TableCell>
                    <TableSortLabel
                      active={usageSortField === 'name'}
                      direction={usageSortField === 'name' ? usageSortOrder : 'asc'}
                      onClick={() => handleUsageSort('name')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Exercise
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={usageSortField === 'category'}
                      direction={usageSortField === 'category' ? usageSortOrder : 'asc'}
                      onClick={() => handleUsageSort('category')}
                      sx={{
                        '&.Mui-active': {
                            color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={usageSortField === 'total'}
                      direction={usageSortField === 'total' ? usageSortOrder : 'asc'}
                      onClick={() => handleUsageSort('total')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Total Sessions
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsageData.map((item, index) => (
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
