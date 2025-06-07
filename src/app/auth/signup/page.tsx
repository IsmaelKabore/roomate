'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import Link from 'next/link'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@/lib/firebaseConfig'
import { styled, keyframes } from '@mui/material/styles'

// — Slow White↔Blue Neon Spin (60s) —
const slowSpin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const NeonCircle = styled('div')({
  position: 'absolute',
  top: -28,
  left: -28,
  right: -28,
  bottom: -28,
  borderRadius: '50%',
  border: '4px solid transparent',
  borderImage: 'conic-gradient(from 0deg, #ffffff, rgb(32, 107, 205), #ffffff) 1',
  animation: `${slowSpin} 60s linear infinite`,
  zIndex: 0,
})

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, send to /discover
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace('/discover')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const form = e.currentTarget as HTMLFormElement
      const email = (form.elements.namedItem('email') as HTMLInputElement).value
      const password = (form.elements.namedItem('password') as HTMLInputElement).value

      await createUserWithEmailAndPassword(auth, email, password)
      router.replace('/discover')
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof FirebaseError) {
        setError(
          err.code === 'auth/email-already-in-use'
            ? 'That email is already registered.'
            : err.code === 'auth/weak-password'
            ? 'Password must be at least 6 characters.'
            : err.message
        )
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.replace('/discover')
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof FirebaseError) {
        setError('Google sign-up failed: ' + err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Google sign-up failed or was closed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #e3f2fd, #ffffff)',
        p: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          p: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
          overflow: 'visible',
        }}
      >
        <NeonCircle />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 1, color: '#1976d2', textAlign: 'center' }}
          >
            Create Account
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mb: 3, color: '#555', textAlign: 'center' }}
          >
            Join the platform
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              required
              InputProps={{
                sx: { backgroundColor: '#fafafa', color: '#000' },
              }}
              InputLabelProps={{
                sx: { color: '#1976d2' },
              }}
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              required
              InputProps={{
                sx: { backgroundColor: '#fafafa', color: '#000' },
              }}
              InputLabelProps={{
                sx: { color: '#1976d2' },
              }}
            />
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(to right, #1976d2, #42a5f5)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(to right, #1565c0, #1e88e5)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography color="#555" sx={{ mb: 1 }}>
              Or sign up with
            </Typography>
            <Button
              variant="outlined"
              onClick={handleGoogle}
              disabled={loading}
              sx={{
                px: 2,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': { borderColor: '#42a5f5' },
              }}
            >
              Google
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography color="#555">
              Already have an account?{' '}
              <Link href="/auth/login" passHref style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                Log In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
