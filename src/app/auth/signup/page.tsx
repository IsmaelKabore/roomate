// src/app/auth/signup/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebaseConfig';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace('/discover');
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const form = e.currentTarget as HTMLFormElement;
      const email = (form.elements.namedItem('email') as HTMLInputElement).value;
      const password = (form.elements.namedItem('password') as HTMLInputElement).value;

      await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/discover');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof FirebaseError) {
        setError(
          err.code === 'auth/email-already-in-use'
            ? 'That email is already registered.'
            : err.code === 'auth/weak-password'
            ? 'Password must be at least 6 characters.'
            : err.message
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.replace('/discover');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof FirebaseError) {
        setError('Google sign-up failed: ' + err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Google sign-up failed or was closed.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <CircularProgress sx={{ color: '#007AFF' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 5,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          border: '1px solid rgba(209, 213, 219, 0.5)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          position: 'relative',
        }}
      >
        {/* Decorative gradient border */}
        <Box
          sx={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: 3,
            background: 'linear-gradient(45deg, #007AFF, transparent, #007AFF)',
            zIndex: -1,
            opacity: 0.2,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center mb-8">
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Create Account
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: '#6B7280', textAlign: 'center', fontSize: '1.1rem' }}
            >
              Join ShareSpace and find your perfect roommate
            </Typography>
          </div>

          <form onSubmit={handleSubmit}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              required
              autoComplete="email"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(243, 244, 246, 0.8)',
                  color: '#111827',
                  borderRadius: '12px',
                  transition: 'border-color 0.2s ease',
                  '& fieldset': { borderColor: 'rgba(156, 163, 175, 0.5)' },
                  '&:hover fieldset': { borderColor: '#007AFF' },
                  '&.Mui-focused fieldset': { borderColor: '#0056b3' },
                },
                '& .MuiInputLabel-root': { color: '#6B7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0056b3' },
                mb: 2,
              }}
            />

            <TextField
              name="password"
              label="Password (6+ characters)"
              type="password"
              fullWidth
              margin="normal"
              required
              autoComplete="new-password"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(243, 244, 246, 0.8)',
                  color: '#111827',
                  borderRadius: '12px',
                  transition: 'border-color 0.2s ease',
                  '& fieldset': { borderColor: 'rgba(156, 163, 175, 0.5)' },
                  '&:hover fieldset': { borderColor: '#007AFF' },
                  '&.Mui-focused fieldset': { borderColor: '#0056b3' },
                },
                '& .MuiInputLabel-root': { color: '#6B7280' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0056b3' },
                mb: 2,
              }}
            />

            {error && (
              <Typography
                color="error"
                variant="body2"
                sx={{
                  mt: 1,
                  mb: 2,
                  p: 2,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(254, 226, 226, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 2,
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0, 122, 255, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(160, 174, 192, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Button
              onClick={handleGoogle}
              fullWidth
              disabled={loading}
              sx={{
                py: 2,
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: '12px',
                textTransform: 'none',
                backgroundColor: '#ffffff',
                color: '#111827',
                border: '1px solid rgba(209, 213, 219, 0.8)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(243, 244, 246, 1)',
                  borderColor: '#007AFF',
                  color: '#007AFF',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(160, 174, 192, 0.2)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Continue with Google'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Already have an account?{' '}
              <Link
                href="/auth/login"
                style={{
                  color: '#0056b3',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Log in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
