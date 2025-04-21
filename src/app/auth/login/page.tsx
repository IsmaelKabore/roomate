'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, Button, Typography, Box } from '@mui/material'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push('/profile') // simulate successful login
    }, 1000)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #f3e8ff, #fdf2f8)',
        p: 2
      }}
    >
      <Box
        sx={{
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
          backgroundColor: '#ffffffcc',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#6a11cb' }}>
          Welcome Back!
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 3, color: '#555' }}>
          Sign in to your EAZY account
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth margin="normal" required />
          <TextField label="Password" type="password" fullWidth margin="normal" required />
          <Button
            type="submit"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 3,
              background: 'linear-gradient(to right, #6a11cb, #2575fc)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(to right, #5f0ecb, #1c66f9)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 3, color: '#555' }}>
          Don’t have an account?{' '}
          <Link href="/auth/signup" passHref>
            <Typography component="span" sx={{ color: '#6a11cb', fontWeight: 500 }}>
              Sign up here
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
