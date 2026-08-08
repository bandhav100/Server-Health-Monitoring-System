import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Container,
  Card,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  AlertTitle,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper,
  alpha,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form Field States
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & Submission States
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    if (!emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or Username is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await login({ emailOrUsername, password, rememberMe });
      toast.success('Successfully logged in');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setIsLoading(false);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Backend authentication endpoint (POST /api/auth/login) is currently unavailable or returned an error.';
      setAuthError(errMsg);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.info('Password reset API endpoint is currently not documented in backend specs.');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0B0F19',
        p: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Card
          elevation={12}
          sx={{
            bgcolor: '#111827',
            border: '1px solid #1F2937',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header Brand & Logo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
                mb: 1.5,
              }}
            >
              <MonitorHeartIcon sx={{ color: '#FFFFFF', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              Sign In to SHMS
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, textAlign: 'center' }}>
              Server Health Monitoring System
            </Typography>
          </Box>

          {/* Integration Status Notice */}
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              mb: 3,
              bgcolor: '#0D131F',
              color: '#93C5FD',
              border: '1px solid #1E3A8A',
              fontSize: '0.75rem',
              py: 0.5,
              '& .MuiAlert-icon': { color: '#60A5FA' },
            }}
          >
            Backend auth uses <code>POST /api/auth/login</code> via Axios client.
          </Alert>

          {/* Auth Failure Error Banner */}
          {authError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: '#1E1215',
                color: '#FCA5A5',
                border: '1px solid #7F1D1D',
                fontSize: '0.8125rem',
                '& .MuiAlert-icon': { color: '#EF4444' },
              }}
            >
              <AlertTitle sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Authentication Error</AlertTitle>
              {authError}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Email / Username Field */}
              <TextField
                fullWidth
                label="Email or Username"
                variant="outlined"
                size="medium"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                error={Boolean(errors.emailOrUsername)}
                helperText={errors.emailOrUsername}
                inputProps={{ 'aria-label': 'Email or Username' }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiOutlinedInput-root': {
                    color: '#F8FAFC',
                    bgcolor: '#0D131F',
                    '& fieldset': { borderColor: '#1F2937' },
                    '&:hover fieldset': { borderColor: '#3B82F6' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                  },
                }}
              />

              {/* Password Field with Show/Hide Toggle */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                size="medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                inputProps={{ 'aria-label': 'Password' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: '#64748B' }}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiOutlinedInput-root': {
                    color: '#F8FAFC',
                    bgcolor: '#0D131F',
                    '& fieldset': { borderColor: '#1F2937' },
                    '&:hover fieldset': { borderColor: '#3B82F6' },
                    '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                  },
                }}
              />

              {/* Remember Me & Forgot Password Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: '#64748B',
                        '&.Mui-checked': { color: '#3B82F6' },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                      Remember me
                    </Typography>
                  }
                />

                <Link
                  href="#"
                  onClick={handleForgotPassword}
                  sx={{
                    color: '#3B82F6',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Submit Login Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
                sx={{
                  py: 1.25,
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  '&:hover': {
                    bgcolor: '#1D4ED8',
                  },
                }}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
