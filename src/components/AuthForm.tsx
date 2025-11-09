import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { getSupabase } from '../lib/supabase';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const AuthForm: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  // Password reset form state
  const [resetEmail, setResetEmail] = useState('');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            full_name: `${signUpData.firstName} ${signUpData.lastName}`
          }
        }
      });

      if (error) throw error;
      
      if (data.user && !data.session) {
        setSuccess('Check your email for a confirmation link!');
        setSignUpData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
      } else if (data.session) {
        setSuccess('Account created successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      });

      if (error) throw error;
      // Success - user will be redirected automatically by the auth state change
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      // Success - user will be redirected automatically
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      setSuccess('Password reset email sent! Check your inbox.');
      setResetEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(74, 74, 74, 0.52)',
      p: 2
    }}>
      <Card sx={{ maxWidth: 500, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ textAlign: 'center', p: 3, pb: 0, backgroundColor: '#000', color: 'rgb(245, 166, 35)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F51cc6beedd56403385e006cba32cbc20%2F3149914a25fd44d8b9f9b79ff4e104d9?format=webp&width=800"
                alt="IronTracker Logo"
                style={{ height: '40px', width: 'auto' }}
              />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                IronTracker
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'rgb(155, 155, 155)' }}>
              Track your fitness journey
            </Typography>
          </Box>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: 'rgba(0, 0, 0, 1)',
              color: 'rgba(155, 155, 155, 1)',
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Sign Up" sx={{ color: 'rgba(74, 74, 74, 1)' }} />
            <Tab label="Reset Password" sx={{ color: 'rgba(74, 74, 74, 1)' }} />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ m: 2 }}>
              {success}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleSignIn}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgb(155, 155, 155)',
                    opacity: 1,
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgb(155, 155, 155)',
                    opacity: 1,
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Continue with Google
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setTabValue(2)}
                sx={{ cursor: 'pointer' }}
              >
                Forgot password?
              </Link>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleSignUp}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={signUpData.firstName}
                  onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#999' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'rgb(155, 155, 155)',
                    },
                    '& .MuiFormLabel-root': {
                      color: 'rgb(155, 155, 155)',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={signUpData.lastName}
                  onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#999' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'rgb(155, 155, 155)',
                    },
                    '& .MuiFormLabel-root': {
                      color: 'rgb(155, 155, 155)',
                    },
                  }}
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Continue with Google
            </Button>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            <form onSubmit={handlePasswordReset}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '& fieldset': { borderColor: '#ccc' },
                    '&:hover fieldset': { borderColor: '#999' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgb(155, 155, 155)',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgb(155, 155, 155)',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
            </form>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
