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
  Button,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { exerciseService } from '../services/exerciseService';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type SortOrder = 'asc' | 'desc';
type ProgressionSortField = 'name' | 'category' | 'weight' | 'reps' | 'volume' | 'date';
type WeightProgressionSortField = 'name' | 'category' | 'weight' | 'reps' | 'date';
type UsageSortField = 'name' | 'category' | 'total';

export const ChartsComponent: React.FC = () => {
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [weightProgressionData, setWeightProgressionData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [progressionSortField, setProgressionSortField] = useState<ProgressionSortField>('date');
  const [progressionSortOrder, setProgressionSortOrder] = useState<SortOrder>('desc');
  const [weightProgressionSortField, setWeightProgressionSortField] = useState<WeightProgressionSortField>('date');
  const [weightProgressionSortOrder, setWeightProgressionSortOrder] = useState<SortOrder>('desc');
  const [usageSortField, setUsageSortField] = useState<UsageSortField>('total');
  const [usageSortOrder, setUsageSortOrder] = useState<SortOrder>('desc');
  const [drillDownExercise, setDrillDownExercise] = useState<string | null>(null);
  const [exerciseHistoryAggregated, setExerciseHistoryAggregated] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [volumeByWeek, setVolumeByWeek] = useState<any[]>([]);
  const [loadingVolumeByWeek, setLoadingVolumeByWeek] = useState(false);

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
        const [progData, weightProgData, usageData] = await Promise.all([
          exerciseService.getProgressionData(selectedCategory === 'All' ? undefined : selectedCategory),
          exerciseService.getProgressionDataByWeight(selectedCategory === 'All' ? undefined : selectedCategory),
          exerciseService.getExerciseUsageData(selectedCategory === 'All' ? undefined : selectedCategory)
        ]);
        const filteredProg = selectedExercise === 'All'
          ? progData
          : progData.filter((item: any) => item.name === selectedExercise);
        const filteredWeightProg = selectedExercise === 'All'
          ? weightProgData
          : weightProgData.filter((item: any) => item.name === selectedExercise);
        const filteredUsage = selectedExercise === 'All'
          ? usageData
          : usageData.filter((item: any) => item.name === selectedExercise);
        setProgressionData(filteredProg);
        setWeightProgressionData(filteredWeightProg);
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

  useEffect(() => {
    const fetchVolumeByWeek = async () => {
      try {
        setLoadingVolumeByWeek(true);
        const data = await exerciseService.getVolumeByWeek();
        setVolumeByWeek(data);
      } catch (err) {
        console.error('Error fetching volume by week:', err);
      } finally {
        setLoadingVolumeByWeek(false);
      }
    };

    fetchVolumeByWeek();
  }, []);

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

  const handleWeightProgressionSort = (field: WeightProgressionSortField) => {
    const isAsc = weightProgressionSortField === field && weightProgressionSortOrder === 'asc';
    setWeightProgressionSortField(field);
    setWeightProgressionSortOrder(isAsc ? 'desc' : 'asc');
  };

  const handleUsageSort = (field: UsageSortField) => {
    const isAsc = usageSortField === field && usageSortOrder === 'asc';
    setUsageSortField(field);
    setUsageSortOrder(isAsc ? 'desc' : 'asc');
  };

  const handleExerciseClick = async (exerciseName: string) => {
    setDrillDownExercise(exerciseName);
    setLoadingHistory(true);
    try {
      const aggregated = await exerciseService.getExerciseHistoryAggregatedByName(exerciseName);
      setExerciseHistoryAggregated(aggregated);
    } catch (err) {
      console.error('Error fetching exercise history:', err);
      setError('Failed to load exercise history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBackToCharts = () => {
    setDrillDownExercise(null);
    setExerciseHistoryAggregated([]);
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
        case 'volume':
          aValue = a.volume ?? 0;
          bValue = b.volume ?? 0;
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

  const sortedWeightProgressionData = useMemo(() => {
    const sorted = [...weightProgressionData];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (weightProgressionSortField) {
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
        return weightProgressionSortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return weightProgressionSortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [weightProgressionData, weightProgressionSortField, weightProgressionSortOrder]);

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
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6}}>
      <Typography variant="h6" sx={{ color: '#899499' }}>{message}</Typography>
    </Box>
  );

  // Prepare chart data for drill-down view using aggregated data
  const chartData = useMemo(() => {
    if (!exerciseHistoryAggregated.length) {
      return { weightData: null, repsData: null, volumeData: null };
    }

    const labels = exerciseHistoryAggregated.map(item => 
      format(new Date(item.exercise_date), 'MMM d, yyyy')
    );
    const weights = exerciseHistoryAggregated.map(item => item.top_weight ?? 0);
    const reps = exerciseHistoryAggregated.map(item => item.top_reps ?? 0);
    const volumes = exerciseHistoryAggregated.map(item => item.total_volume ?? 0);

    const weightData = {
      labels,
      datasets: [
        {
          label: 'Volume',
          data: weights,
          borderColor: '#f58025',
          backgroundColor: 'rgba(245, 128, 37, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const repsData = {
      labels,
      datasets: [
        {
          label: 'Max Reps',
          data: reps,
          borderColor: '#6f9c3d',
          backgroundColor: 'rgba(111, 156, 61, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const volumeData = {
      labels,
      datasets: [
        {
          label: 'Total Volume',
          data: volumes,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    return { weightData, repsData, volumeData };
  }, [exerciseHistoryAggregated]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#ffffff',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#f58025',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // Render drill-down view
  if (drillDownExercise) {
    return (
      <Box sx={{ width: '100%', minHeight: '70vh', p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToCharts}
          sx={{ mb: 3, color: '#6f9c3d' }}
        >
          Back to Charts
        </Button>

        <Typography variant="h3" sx={{ mb: 4 }}>
          {drillDownExercise} - Exercise History
        </Typography>

        {loadingHistory ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : exerciseHistoryAggregated.length === 0 ? (
          renderEmptyState('No history available for this exercise')
        ) : (
          <>
            {/* Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
              <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Volume per session
                </Typography>
                <Box sx={{ height: 300 }}>
                  {chartData.weightData && (
                    <Line data={chartData.weightData} options={chartOptions} />
                  )}
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Max reps per session
                </Typography>
                <Box sx={{ height: 300 }}>
                  {chartData.repsData && (
                    <Line data={chartData.repsData} options={chartOptions} />
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Total Volume Chart */}
            <Box sx={{ mb: 4 }}>
              <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Total Volume (reps xweight) per session
                </Typography>
                <Box sx={{ height: 300 }}>
                  {chartData.volumeData && (
                    <Line data={chartData.volumeData} options={chartOptions} />
                  )}
                </Box>
              </Paper>
            </Box>

            {/* History Table */}
            <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Exercise History (Daily Max)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Max Volume</TableCell>
                      <TableCell align="right">Max Reps</TableCell>
                      <TableCell align="right">Total Volume</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exerciseHistoryAggregated.map((item, index) => (
                      <TableRow key={`${item.exercise_date}-${index}`} hover>
                        <TableCell>
                          {format(new Date(item.exercise_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.name || '—'}</TableCell>
                        <TableCell align="right">{item.top_weight ?? '—'}</TableCell>
                        <TableCell align="right">{item.top_reps ?? '—'}</TableCell>
                        <TableCell align="right">{item.total_volume ? Math.round(item.total_volume) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    );
  }

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
            ? 'Progression (Max Volume per Exercise)'
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
                      active={progressionSortField === 'volume'}
                      direction={progressionSortField === 'volume' ? progressionSortOrder : 'asc'}
                      onClick={() => handleProgressionSort('volume')}
                      sx={{
                        '&.Mui-active': {
                          color: '#6f9c3d',
                        },
                        '&:hover': {
                          color: '#6f9c3d',
                        },
                      }}
                    >
                      Max Volume
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
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleExerciseClick(item.name)}
                        sx={{
                          color: '#6f9c3d',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {item.name || '—'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Chip label={item.category} size="small" color="primary" variant="outlined" />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">{item.volume !== undefined ? Math.round(item.volume) : '—'}</TableCell>
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

      <Paper elevation={0} sx={{ mb: 4, p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {selectedCategory === 'All'
            ? 'Progression (Max Weight per Exercise)'
            : selectedExercise === 'All'
              ? `Progression by Weight - ${selectedCategory}`
              : `Progression by Weight - ${selectedCategory} / ${selectedExercise}`}
        </Typography>
        {weightProgressionData.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={weightProgressionSortField === 'name'}
                      direction={weightProgressionSortField === 'name' ? weightProgressionSortOrder : 'asc'}
                      onClick={() => handleWeightProgressionSort('name')}
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
                      active={weightProgressionSortField === 'category'}
                      direction={weightProgressionSortField === 'category' ? weightProgressionSortOrder : 'asc'}
                      onClick={() => handleWeightProgressionSort('category')}
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
                      active={weightProgressionSortField === 'weight'}
                      direction={weightProgressionSortField === 'weight' ? weightProgressionSortOrder : 'asc'}
                      onClick={() => handleWeightProgressionSort('weight')}
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
                      active={weightProgressionSortField === 'reps'}
                      direction={weightProgressionSortField === 'reps' ? weightProgressionSortOrder : 'asc'}
                      onClick={() => handleWeightProgressionSort('reps')}
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
                      active={weightProgressionSortField === 'date'}
                      direction={weightProgressionSortField === 'date' ? weightProgressionSortOrder : 'asc'}
                      onClick={() => handleWeightProgressionSort('date')}
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
                {sortedWeightProgressionData.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleExerciseClick(item.name)}
                        sx={{
                          color: '#6f9c3d',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {item.name || '—'}
                      </Link>
                    </TableCell>
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
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleExerciseClick(item.name)}
                        sx={{
                          color: '#6f9c3d',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {item.name || '—'}
                      </Link>
                    </TableCell>
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

      {/* Volume by Week Chart */}
      <Paper elevation={0} sx={{ mb: 4, p: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,128,37,0.2)' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Total Volume by Week
        </Typography>
        {loadingVolumeByWeek ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : volumeByWeek.length > 0 ? (
          <Box sx={{ height: 400 }}>
            <Bar
              data={{
                labels: volumeByWeek.map(item => format(new Date(item.week), 'MMM d, yyyy')),
                datasets: [
                  {
                    label: 'Total Volume (reps x weight)',
                    data: volumeByWeek.map(item => Math.round(item.vol)),
                    backgroundColor: 'rgba(245, 128, 37, 0.8)',
                    borderColor: '#f58025',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    labels: {
                      color: '#ffffff',
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#f58025',
                    borderWidth: 1,
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#ffffff',
                      maxRotation: 45,
                      minRotation: 45,
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  y: {
                    ticks: {
                      color: '#ffffff',
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
              }}
            />
          </Box>
        ) : (
          renderEmptyState('No volume data available')
        )}
      </Paper>
    </Box>
  );
};
