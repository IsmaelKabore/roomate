'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material'
import { auth } from '@/lib/firebaseConfig'
import { getUserProfile, upsertUserProfile } from '@/lib/userProfile'

type FormValues = {
  displayName: string
  summary: string
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useTheme()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { displayName: '', summary: '' },
  })

  // nextParam might be e.g. "/matches"
  const nextParam = searchParams?.get('next') || ''

  useEffect(() => {
    // 1) If not logged in → send to login
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace(
          `/auth/login?next=/complete-profile${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`
        )
        return
      }

      // 2) If logged in, try to fetch their existing profile
      try {
        const profile = await getUserProfile(user.uid)
        if (profile) {
          // If displayName already exists, skip straight to nextParam
          if (profile.displayName) {
            const target = nextParam || '/discover'
            router.replace(target)
            return
          }
          // Prefill if partial
          reset({
            displayName: profile.displayName,
            summary: profile.summary,
          })
        }
      } catch (e) {
        console.error('[CompleteProfile] getUserProfile error:', e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [nextParam, reset, router])

  const onSubmit = async (data: FormValues) => {
    const user = auth.currentUser
    if (!user) {
      setError('You must be logged in.')
      return
    }
    try {
      setError(null)
      await upsertUserProfile(user.uid, data.displayName, data.summary)
      const target = nextParam || '/discover'
      router.replace(target)
    } catch (err) {
      console.error('[CompleteProfile] upsert error:', err)
      setError('Failed to save profile. Please try again.')
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(
          circle at top left,
          ${theme.palette.primary.light}33,
          ${theme.palette.primary.dark}11
        )`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            textAlign: 'center',
            color: theme.palette.primary.dark,
            fontWeight: 700,
          }}
        >
          Complete Your Profile
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Display Name"
            fullWidth
            {...register('displayName', { required: 'Required' })}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
            sx={{
              mb: 3,
              '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.dark,
              },
              '& .MuiInputBase-input': { color: theme.palette.primary.dark },
            }}
          />

          <TextField
            label="Short Profile Summary"
            fullWidth
            multiline
            rows={4}
            {...register('summary', { required: 'Required' })}
            error={!!errors.summary}
            helperText={
              errors.summary?.message || 'e.g. “CS student who loves cats & jazz”'
            }
            sx={{
              mb: 4,
              '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.dark,
              },
              '& .MuiInputBase-input': { color: theme.palette.primary.dark },
            }}
          />

          {error && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{
              background: `linear-gradient(
                90deg,
                ${theme.palette.primary.light},
                ${theme.palette.primary.main}
              )`,
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              '&:hover': {
                background: `linear-gradient(
                  90deg,
                  ${theme.palette.primary.main},
                  ${theme.palette.primary.dark}
                )`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save & Continue'}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
