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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
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
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { Exercise } from '../types/Exercise';
import { exerciseService } from '../services/exerciseService';
import { imageService } from '../services/imageService';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewImageDialogOpen, setViewImageDialogOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [viewImageExerciseId, setViewImageExerciseId] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [viewVideoDialogOpen, setViewVideoDialogOpen] = useState(false);
  const [viewVideoUrl, setViewVideoUrl] = useState<string | null>(null);
  const [viewVideoExerciseId, setViewVideoExerciseId] = useState<string | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

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
      image_path: exercise.image_path,
      video_path: exercise.video_path,
    });
    // Reset image state
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoError(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      imageService.validateImageFile(file);
      setSelectedImage(file);
      setImageError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setImageDialogOpen(true);
    } catch (error: any) {
      setImageError(error.message);
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageDialogOpen(false);
    setImageError(null);
    // Also remove from edit form
    if (editForm) {
      setEditForm({ ...editForm, image_path: null });
    }
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      imageService.validateVideoFile(file);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setSelectedVideo(file);
      setVideoError(null);

      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      setVideoDialogOpen(true);
    } catch (error: any) {
      setVideoError(error.message);
      setSelectedVideo(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoDialogOpen(false);
    setVideoError(null);
    if (editForm) {
      setEditForm({ ...editForm, video_path: null });
    }
  };

  const handleViewImage = (exercise: Exercise) => {
    if (!exercise.image_path) return;
    const imageUrl = imageService.getImageUrl(exercise.image_path);
    setViewImageUrl(imageUrl);
    setViewImageExerciseId(exercise.id);
    setViewImageDialogOpen(true);
  };

  const handleDeleteExerciseImage = async (exerciseId: string, imagePath: string) => {
    if (!imagePath) return;
    const confirmDelete = window.confirm('Delete this exercise image? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      setDeletingImage(true);
      await imageService.deleteImage(imagePath);
      const updatedExercise = await exerciseService.updateExercise(exerciseId, { image_path: null });
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, ...updatedExercise } : ex));

      if (editingId === exerciseId) {
        setEditForm(prev => prev ? { ...prev, image_path: null } : prev);
      }

      setSelectedImage(null);
      setImagePreview(null);
      setImageError(null);

      if (viewImageExerciseId === exerciseId) {
        setViewImageDialogOpen(false);
        setViewImageUrl(null);
        setViewImageExerciseId(null);
      }
    } catch (err: any) {
      console.error('Error deleting exercise image:', err);
      setImageError(err.message || 'Failed to delete exercise image');
    } finally {
      setDeletingImage(false);
    }
  };

  const handleViewVideo = (exercise: Exercise) => {
    if (!exercise.video_path) return;
    const videoUrl = imageService.getVideoUrl(exercise.video_path);
    setViewVideoUrl(videoUrl);
    setViewVideoExerciseId(exercise.id);
    setViewVideoDialogOpen(true);
  };

  const handleDeleteExerciseVideo = async (exerciseId: string, videoPath: string) => {
    if (!videoPath) return;
    const confirmDelete = window.confirm('Delete this exercise video? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      setDeletingVideo(true);
      await imageService.deleteVideo(videoPath);
      const updatedExercise = await exerciseService.updateExercise(exerciseId, { video_path: null });
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, ...updatedExercise } : ex));

      if (editingId === exerciseId) {
        setEditForm(prev => prev ? { ...prev, video_path: null } : prev);
      }

      if (selectedVideo) {
        setSelectedVideo(null);
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
      setVideoError(null);

      if (viewVideoExerciseId === exerciseId) {
        setViewVideoDialogOpen(false);
        setViewVideoUrl(null);
        setViewVideoExerciseId(null);
      }
    } catch (err: any) {
      console.error('Error deleting exercise video:', err);
      setVideoError(err.message || 'Failed to delete exercise video');
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;
    try {
      setUploading(true);
      let updatedForm = { ...editForm };

      // Upload new image if one was selected
      if (selectedImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated to upload images');
        
        // Delete old image if it exists
        if (editForm.image_path) {
          try {
            await imageService.deleteImage(editForm.image_path);
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }
        
        const imagePath = await imageService.uploadImage(selectedImage, user.id);
        updatedForm.image_path = imagePath;
      }

      if (selectedVideo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated to upload videos');

        if (editForm.video_path) {
          try {
            await imageService.deleteVideo(editForm.video_path);
          } catch (err) {
            console.error('Error deleting old video:', err);
          }
        }

        const videoPath = await imageService.uploadVideo(selectedVideo, user.id);
        updatedForm.video_path = videoPath;
      }

      const updatedExercise = await exerciseService.updateExercise(editingId, updatedForm);
      setExercises(exercises.map(ex => 
        ex.id === editingId ? { ...ex, ...updatedExercise } : ex
      ));
      setEditingId(null);
      setEditForm(null);
      setSelectedImage(null);
      setImagePreview(null);
      setImageError(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setSelectedVideo(null);
      setVideoPreview(null);
      setVideoError(null);
    } catch (err: any) {
      console.error('Error updating exercise:', err);
      setImageError(err.message || 'Failed to update exercise');
      setVideoError(err.message || 'Failed to update exercise');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoError(null);
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

    // Auto-expand dates when a category is selected so users can see the history for that category
    if (field === 'category' && typeof value === 'string') {
      const selectedCategory = value.trim();
      if (selectedCategory) {
        const newExpanded: { [date: string]: boolean } = {};
        exercises.forEach(exercise => {
          if (
            exercise.date &&
            exercise.category &&
            exercise.category.toLowerCase().includes(selectedCategory.toLowerCase())
          ) {
            newExpanded[exercise.date.toDateString()] = true;
          }
        });
        setExpandedDates(newExpanded);
      }
    }
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
      <div className="fitness-empty-state">
        <Typography variant="h3" component="h3">
          No Exercise History
        </Typography>
        <Typography variant="body1">
          Start adding exercises to see your workout history here
        </Typography>
      </div>
    );
  }

  const viewedExercise = viewImageExerciseId ? exercises.find(ex => ex.id === viewImageExerciseId) || null : null;
  const viewedVideoExercise = viewVideoExerciseId ? exercises.find(ex => ex.id === viewVideoExerciseId) || null : null;

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
              <TableCell>Media</TableCell>
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
                      colSpan={10}
                      sx={(theme) => ({
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        py: 1,
                        borderBottom: `2px solid ${theme.palette.divider}`,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 150ms ease',
                        '&:hover': {
                          backgroundColor: 'rgba(245, 128, 37, 0.08)',
                        },
                      })}
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
                              clickable
                              onClick={(e) => { e.stopPropagation(); handleFilterChange('category', cat); }}
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
                        {editingId === exercise.id ? (
                          <Stack spacing={1}>
                            <Box>
                              <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id={`image-upload-edit-${exercise.id}`}
                                type="file"
                                onChange={handleImageSelect}
                              />
                              <label htmlFor={`image-upload-edit-${exercise.id}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  size="small"
                                  startIcon={<PhotoCameraIcon />}
                                >
                                  {editForm?.image_path || selectedImage ? 'Change Image' : 'Add Image'}
                                </Button>
                              </label>
                              {(editForm?.image_path || imagePreview) && (
                                <Box sx={{ mt: 1, position: 'relative', width: 60, height: 60 }}>
                                  <img
                                    src={imagePreview || imageService.getImageUrl(editForm?.image_path!)}
                                    alt="Exercise"
                                    onError={() => {
                                      if (editForm?.image_path) {
                                        console.error('Error loading image:', editForm.image_path);
                                      }
                                    }}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      objectFit: 'cover',
                                      borderRadius: '4px'
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={handleRemoveImage}
                                    sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      bgcolor: 'background.paper'
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                            <Box>
                              <input
                                accept="video/*"
                                style={{ display: 'none' }}
                                id={`video-upload-edit-${exercise.id}`}
                                type="file"
                                onChange={handleVideoSelect}
                              />
                              <label htmlFor={`video-upload-edit-${exercise.id}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  size="small"
                                  startIcon={<VideoCallIcon />}
                                >
                                  {editForm?.video_path || selectedVideo ? 'Change Video' : 'Add Video'}
                                </Button>
                              </label>
                              {(editForm?.video_path || videoPreview) && (
                                <Box sx={{ mt: 1, position: 'relative', width: 120 }}>
                                  <video
                                    src={videoPreview || imageService.getVideoUrl(editForm?.video_path!)}
                                    style={{
                                      width: '120px',
                                      maxHeight: '80px',
                                      borderRadius: '4px',
                                      backgroundColor: 'black',
                                    }}
                                    controls
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={handleRemoveVideo}
                                    sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      bgcolor: 'background.paper'
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          </Stack>
                        ) : (
                          <Stack spacing={0.5}>
                            {exercise.image_path && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="View Image">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewImage(exercise)}
                                    color="primary"
                                  >
                                    <ImageIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={deletingImage ? 'Deleting...' : 'Delete Image'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={deletingImage}
                                      onClick={() => handleDeleteExerciseImage(exercise.id, exercise.image_path!)}
                                    >
                                      <DeleteForeverIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            )}
                            {exercise.video_path && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="View Video">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewVideo(exercise)}
                                    color="primary"
                                  >
                                    <VideoLibraryIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={deletingVideo ? 'Deleting...' : 'Delete Video'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={deletingVideo}
                                      onClick={() => handleDeleteExerciseVideo(exercise.id, exercise.video_path!)}
                                    >
                                      <DeleteForeverIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            )}
                            {!exercise.image_path && !exercise.video_path && (
                              <Typography variant="caption" color="text.secondary">
                                No media
                              </Typography>
                            )}
                          </Stack>
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
                              disabled={uploading}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              onClick={handleCancel}
                              size="small"
                              color="error"
                              disabled={uploading}
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

      {/* Image Upload Error */}
      {imageError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {imageError}
        </Alert>
      )}
      {videoError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {videoError}
        </Alert>
      )}

      {/* Image Preview Dialog (for editing) */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {imagePreview && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveImage} color="error">
            Remove Image
          </Button>
          <Button onClick={() => setImageDialogOpen(false)} variant="contained">
            Looks Good
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog
        open={viewImageDialogOpen}
        onClose={() => setViewImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Exercise Image
          <IconButton
            onClick={() => setViewImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewImageUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img
                src={viewImageUrl}
                alt="Exercise"
                onError={() => {
                  console.error('Error loading image:', viewImageUrl);
                  setImageError('Failed to load image. Please ensure the storage bucket is set to public in Supabase.');
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewedExercise?.image_path && (
            <Button
              onClick={() => handleDeleteExerciseImage(viewedExercise.id, viewedExercise.image_path!)}
              color="error"
              variant="outlined"
              startIcon={<DeleteForeverIcon />}
              disabled={deletingImage}
            >
              Delete Image
            </Button>
          )}
          <Button onClick={() => setViewImageDialogOpen(false)} variant="contained" disabled={deletingImage}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Video Preview
          <IconButton
            onClick={() => setVideoDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {videoPreview && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <video
                src={videoPreview}
                style={{
                  maxWidth: '100%',
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '8px',
                  backgroundColor: 'black',
                }}
                controls
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveVideo} color="error">
            Remove Video
          </Button>
          <Button onClick={() => setVideoDialogOpen(false)} variant="contained">
            Looks Good
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Video Dialog */}
      <Dialog
        open={viewVideoDialogOpen}
        onClose={() => setViewVideoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Exercise Video
          <IconButton
            onClick={() => setViewVideoDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewVideoUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <video
                src={viewVideoUrl}
                style={{
                  width: '100%',
                  maxHeight: '80vh',
                  borderRadius: '8px',
                  backgroundColor: 'black',
                }}
                controls
                onError={() => {
                  console.error('Error loading video:', viewVideoUrl);
                  setVideoError('Failed to load video. Please ensure the storage bucket is set to public in Supabase.');
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewedVideoExercise?.video_path && (
            <Button
              onClick={() => handleDeleteExerciseVideo(viewedVideoExercise.id, viewedVideoExercise.video_path!)}
              color="error"
              variant="outlined"
              startIcon={<DeleteForeverIcon />}
              disabled={deletingVideo}
            >
              Delete Video
            </Button>
          )}
          <Button onClick={() => setViewVideoDialogOpen(false)} variant="contained" disabled={deletingVideo}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
