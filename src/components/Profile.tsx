import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ProfileData {
  display_name: string;
  email: string;
}

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    email: ''
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          setProfileData({
            display_name: user.user_metadata?.display_name || '',
            email: user.email || ''
          });
        }
      } catch (err) {
        console.error('Error getting user:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profileData.display_name
        }
      });

      if (error) throw error;
      
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: profileData.email
      });

      if (error) throw error;
      
      setSuccess('Check your email for a confirmation link to update your email address.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You must be signed in to view your profile.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        👤 Profile Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3
              }}
            >
              {profileData.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {profileData.display_name 
                  ? `${profileData.display_name}`
                  : user.email
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleUpdateProfile}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Name"
                value={profileData.display_name}
                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                margin="normal"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ mb: 3 }}
            >
              {saving ? <CircularProgress size={20} /> : 'Update Profile'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            Account Settings
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              margin="normal"
            />
            <Button
              variant="outlined"
              onClick={handleUpdateEmail}
              disabled={saving}
              sx={{ mt: 1 }}
            >
              Update Email
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Change your password
            </Typography>
            <Button
              variant="outlined"
              onClick={handleUpdatePassword}
              disabled={saving}
            >
              Send Password Reset Email
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
