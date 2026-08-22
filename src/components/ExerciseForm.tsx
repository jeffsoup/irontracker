import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ExerciseFormData, Workout } from '../types/Exercise';
import { exerciseService } from '../services/exerciseService';
import { imageService } from '../services/imageService';
import { supabase } from '../lib/supabase';

interface ExerciseFormProps {
  onSubmit: (exercise: ExerciseFormData) => void;
  activeWorkout: Workout | null;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSubmit, activeWorkout }) => {
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    category: '',
    reps: 0,
    weight: 0,
    date: new Date().toISOString(),
    rating: null,
    notes: '',
    workout: null,
    image_path: null,
    myorep: false,
    dropset: false,
    restpause: false,
    video_path: null,
  });

  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showStarterDialog, setShowStarterDialog] = useState(false);

  useEffect(() => {
    // Only fetch categories from the active workout
    if (activeWorkout) {
      setCategories(activeWorkout.categories);
      // Prepopulate form fields with the most recent exercise for this workout
      exerciseService.getMostRecentExerciseForWorkout(activeWorkout.id)
        .then((exercise) => {
          if (exercise) {
            setFormData((prev) => ({
              ...prev,
              category: exercise.category || '',
              name: exercise.name || '',
              reps: exercise.reps || 0,
              weight: exercise.weight || 0,
              myorep: !!exercise.myorep,
              dropset: !!exercise.dropset,
              restpause: !!exercise.restpause,
              video_path: null,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              category: '',
              name: '',
              reps: 0,
              weight: 0,
              myorep: false,
              dropset: false,
              restpause: false,
              video_path: null,
            }));
          }
        })
        .catch(() => {
          setFormData((prev) => ({
            ...prev,
            category: '',
            name: '',
            reps: 0,
            weight: 0,
            myorep: false,
            dropset: false,
            restpause: false,
            video_path: null,
          }));
        });
    } else {
      setCategories([]);
      setFormData((prev) => ({
        ...prev,
        category: '',
        name: '',
        reps: 0,
        weight: 0,
        myorep: false,
        dropset: false,
        restpause: false,
        video_path: null,
      }));
    }
  }, [activeWorkout]);

  // New effect: When category changes, prepopulate from most recent exercise in that category for the current workout
  useEffect(() => {
    if (activeWorkout && formData.category) {
      // Find the most recent exercise in the current workout for the selected category
      exerciseService.getExercises()
        .then((exercises) => {
          const match = exercises
            .filter(ex => ex.workout === activeWorkout.id && ex.category === formData.category)
            .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0))[0];
          if (match) {
            setFormData(prev => ({
              ...prev,
              name: match.name || '',
              reps: match.reps || 0,
              weight: match.weight || 0,
              notes: match.notes || '',
              myorep: !!match.myorep,
              dropset: !!match.dropset,
              restpause: !!match.restpause
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              name: '',
              reps: 0,
              weight: 0,
              notes: '',
              myorep: false,
              dropset: false,
              restpause: false
            }));
          }
        })
        .catch(() => {
          setFormData(prev => ({
            ...prev,
            name: '',
            reps: 0,
            weight: 0,
            notes: '',
            myorep: false,
            dropset: false,
            restpause: false
          }));
        });
    }
  }, [formData.category, activeWorkout]);

  useEffect(() => {
    if (formData.category) {
      exerciseService.getExerciseNamesByCategory(formData.category)
        .then((names) => {
          setExerciseNames(names.filter((n): n is string => !!n));
          if (names.length > 0 && formData.name && !names.includes(formData.name)) {
            setFormData(prev => ({ ...prev, name: '' }));
          }
        })
        .catch(error => {
          console.error('Error fetching exercise data:', error);
          setExerciseNames([]);
        });
    } else {
      setExerciseNames([]);
    }
  }, [formData.category]);

  useEffect(() => {
    let isMounted = true;
    const checkStarter = async () => {
      try {
        const hasExercises = await exerciseService.hasUserExercises();
        if (!hasExercises && isMounted) {
          setShowStarterDialog(true);
        }
      } catch (error) {
        console.error('Error checking for starter exercises:', error);
      }
    };

    checkStarter();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkout) return;

    try {
      setUploading(true);
      let imagePath: string | null = null;
      let videoPath: string | null = null;

      // Upload image if one was selected
      if (selectedImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated to upload images');
        imagePath = await imageService.uploadImage(selectedImage, user.id);
      }

      if (selectedVideo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated to upload videos');
        videoPath = await imageService.uploadVideo(selectedVideo, user.id);
      }

      onSubmit({
        ...formData,
        name: formData.name ? formData.name.trim() : null,
        notes: formData.notes || null,
        workout: activeWorkout.id,
        image_path: imagePath,
        video_path: videoPath,
      });

      // Reset form
      setFormData({
        name: '',
        category: '',
        reps: 0,
        weight: 0,
        date: new Date().toISOString(),
        rating: null,
        notes: '',
        workout: null,
        image_path: null,
        myorep: false,
        dropset: false,
        restpause: false,
        video_path: null,
      });
      setExerciseNames([]);
      setSelectedImage(null);
      setImagePreview(null);
      setImageError(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setSelectedVideo(null);
      setVideoPreview(null);
      setVideoError(null);
    } catch (error: any) {
      const message = error.message || 'Failed to upload media';
      setImageError(message);
      setVideoError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleExerciseChange = (value: string | null) => {
    setFormData(prev => ({ ...prev, name: value ? value.trim() : '' }));
  };

  const currentSetType: 'standard' | 'myorep' | 'dropset' =
    formData.myorep ? 'myorep' : formData.dropset ? 'dropset' : 'standard';

  const handleSetTypeChange = (value: 'standard' | 'myorep' | 'dropset') => {
    setFormData(prev => ({
      ...prev,
      myorep: value === 'myorep',
      dropset: value === 'dropset',
    }));
  };

  const handleStarterYes = async () => {
    try {
      await exerciseService.populateStarterExercisesFromCanonical();
      setShowStarterDialog(false);

      // Refresh exercise names for the current category if selected
      if (formData.category) {
        try {
          const names = await exerciseService.getExerciseNamesByCategory(formData.category);
          setExerciseNames(names.filter((n): n is string => !!n));
        } catch (error) {
          console.error('Error refreshing exercise names after starter populate:', error);
        }
      }
    } catch (error) {
      console.error('Error populating starter exercises:', error);
    }
  };

  const handleStarterNo = () => {
    setShowStarterDialog(false);
  };

  if (!activeWorkout) {
    return (
      <div className="fitness-empty-state">
        <Typography variant="h3" component="h3">
          No Active Workout (YET)
        </Typography>
        <Typography variant="body1">
          Please start a workout to add exercises
        </Typography>
      </div>
    );
  }

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        maxWidth: 500, 
        width: '100%',
        mx: 'auto', 
        p: { xs: 2, sm: 4 },
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }} 
      className="fitness-card"
    >
      <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4 }}>
        🔥 Add New Set
      </Typography>
      <Stack spacing={4} sx={{ width: '100%', boxSizing: 'border-box' }}>
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            label="Category"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          freeSolo
          options={exerciseNames.filter((n): n is string => !!n)}
          value={formData.name}
          onChange={(_, newValue) => handleExerciseChange(newValue)}
          onInputChange={(_, newInputValue) => handleExerciseChange(newInputValue)}
          disabled={!formData.category}
          sx={{ width: '100%' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exercise"
              required
              fullWidth
              helperText={formData.category ? "Select an existing exercise or type a new one" : "Select a category first"}
            />
          )}
        />
        <TextField
          label="Reps"
          type="number"
          value={formData.reps}
          onChange={(e) => setFormData({ ...formData, reps: parseFloat(e.target.value) })}
          required
          fullWidth
          inputProps={{ min: 0, step: 'any' }}
        />
        <TextField
          label="Weight"
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
          required
          fullWidth
          inputProps={{ min: 0, step: 'any' }}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            value={formData.date ? new Date(formData.date) : new Date()}
            onChange={(newDate) => setFormData({ ...formData, date: newDate?.toISOString() || new Date().toISOString() })}
          />
        </LocalizationProvider>
        <Box>
          <Typography component="legend">Rating</Typography>
          <Rating
            value={formData.rating}
            onChange={(_, newValue) => setFormData({ ...formData, rating: newValue || null })}
            max={5}
          />
        </Box>
        <FormControl fullWidth>
          <InputLabel>Set Type</InputLabel>
          <Select
            value={currentSetType}
            label="Set Type"
            onChange={(e) => handleSetTypeChange(e.target.value as 'standard' | 'myorep' | 'dropset')}
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="myorep">MyoRep</MenuItem>
            <MenuItem value="dropset">Dropset</MenuItem>
            <MenuItem value="restpause">RestPause</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          multiline
          rows={3}
          fullWidth
        />
        
        {/* Image Upload Section */}
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload-button"
            type="file"
            onChange={handleImageSelect}
          />
          <label htmlFor="image-upload-button">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PhotoCameraIcon />}
              fullWidth
            >
              {selectedImage ? 'Change Image' : 'Add Image (Optional)'}
            </Button>
          </label>
          {imagePreview && (
            <Box sx={{ mt: 2, position: 'relative' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' }
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          {imageError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {imageError}
            </Alert>
          )}
        </Box>

        {/* Video Upload Section */}
        <Box>
          <input
            accept="video/*"
            style={{ display: 'none' }}
            id="video-upload-button"
            type="file"
            onChange={handleVideoSelect}
          />
          <label htmlFor="video-upload-button">
            <Button
              variant="outlined"
              component="span"
              startIcon={<VideocamIcon />}
              fullWidth
            >
              {selectedVideo ? 'Change Video' : 'Add Video (Optional)'}
            </Button>
          </label>
          {videoPreview && (
            <Box sx={{ mt: 2, position: 'relative' }}>
              <video
                src={videoPreview}
                style={{
                  width: '100%',
                  maxHeight: '250px',
                  borderRadius: '8px',
                  backgroundColor: 'black',
                }}
                controls
              />
              <IconButton
                onClick={handleRemoveVideo}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' }
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          {videoError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {videoError}
            </Alert>
          )}
        </Box>

        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '💪 Add Set 💪'}
        </Button>
      </Stack>

      {/* Image Preview Dialog */}
      <Dialog
        open={showStarterDialog}
        onClose={handleStarterNo}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Welcome to IronTracker</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Hi there, it looks like this is your first time using the app. You can add any exercise you want by typing in the name of the exercise.
          </Typography>
          <Typography>
            Also, if you would like we can populate your exercise choices with our starter set. Would you like us to add the starter set of exercises to these choices?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStarterNo}>
            No
          </Button>
          <Button onClick={handleStarterYes} variant="contained" color="primary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};
