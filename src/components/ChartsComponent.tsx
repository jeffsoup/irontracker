import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Bar } from "react-chartjs-2";
import { exerciseService } from '../services/exerciseService';

export const ChartsComponent: React.FC = () => {
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

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
        console.log('Progression data:', progData);
        console.log('Usage data:', usageData);
        setProgressionData(progData);
        setUsageData(usageData);
      } catch (err) {
        setError('Failed to load chart data');
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressionData();
  }, [selectedCategory]);

  ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '70vh', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '70vh', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  //[[10, 20], [15, null], [20, 10]]

  const data = {
    labels: progressionData.map(item => `${item.category}: ${item.name}`),
    datasets: [{
      label: 'Weight',
      data: progressionData.map(item => `${item.weight}`),
      backgroundColor: 'rgba(54, 162, 235, 0.8)', 
      borderColor: '#36A2EB',
      borderWidth: 1,
      hoverBackgroundColor: '#36a9eb',
      hoverBorderColor: 'red',
      hoverBorderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedCategory === 'All' ? 'Max Weight per Exercise' : `Max Weight per Exercise - ${selectedCategory}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Weight'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Exercise'
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    },
  };

  const usageChartData = {
    labels: usageData.map(item => item.name),
    datasets: [{
      label: 'Exercises History Totals',
      data: usageData.map(item => item.total),
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      borderColor: '#FF6384',
      borderWidth: 1,
      hoverBackgroundColor: '#ff7a9b',
      hoverBorderColor: 'red',
      hoverBorderWidth: 2
    }]
  };

  const usageChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedCategory === 'All' ? 'Exercise History Totals' : `Exercise History Totals - ${selectedCategory}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Exercise'
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    },
  };

  return (
    <Box sx={{ width: '100%', minHeight: '70vh', p: 4 }}>
      <Box sx={{ mb: 3 }}>
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
      </Box>
      
      {progressionData.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="h6">No progression data available</Typography>
        </Box>
      )}

      {usageData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Bar data={usageChartData} options={usageChartOptions} />
        </Box>
      )}

      {usageData.length === 0 && progressionData.length > 0 && (
        <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <Typography variant="h6">No usage data available</Typography>
        </Box>
      )}
    </Box>
  );
};
