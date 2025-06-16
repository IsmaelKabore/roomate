// File: src/app/profile/[userId]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Divider,
  useTheme,
  Paper,
} from '@mui/material'
import {
  Info as InfoIcon,
  School as SchoolIcon,
  CalendarToday as CalendarTodayIcon,
  Book as BookIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import { fetchUserProfile } from '@/lib/firestoreProfile'

interface UserProfileData {
  profilePicture?: string
  name?: string
  major?: string
  school?: string
  bio?: string
  hometown?: string
  year?: string
  hobbies?: string[]
}

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>()
  const userId = params?.userId
  const router = useRouter()
  const theme = useTheme()

  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchUserProfile(userId)
      .then((data) => {
        setProfile(data as UserProfileData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="h6" color="textSecondary">
          Profile not found.
        </Typography>
        <Button
          onClick={() => router.back()}
          sx={{
            mt: 2,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            textTransform: 'none',
          }}
          variant="outlined"
        >
          Go Back
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        maxWidth: 700,
        mx: 'auto',
        my: 4,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'visible', // ensure avatar is fully visible
      }}
    >
      {/* ─────────────── Header + Avatar Container ─────────────── */}
      <Box sx={{ position: 'relative', overflow: 'visible' }}>
        {/* Clipped header */}
        <Box
          sx={{
            height: 200,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0% 100%)',
          }}
        />

        {/* Avatar as a sibling, with negative margin top */}
        <Box
          sx={{
            position: 'relative',
            mt: '-50px', // pull it up so half overlaps the header
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              p: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Avatar
              src={profile.profilePicture}
              alt={profile.name}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ─────────────── Main Content ─────────────── */}
      <Box sx={{ pt: 2, px: 4, pb: 4 }}>
        {/* Name */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: theme.palette.primary.dark,
            mb: 1,
          }}
        >
          {profile.name || 'Unnamed User'}
        </Typography>

        {/* Major @ School */}
        {profile.major && profile.school && (
          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.secondary,
              mb: 2,
            }}
          >
            {profile.major} @ {profile.school}
          </Typography>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ─── About Me Section ─── */}
        {profile.bio && (
          <Paper
            elevation={1}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              backgroundColor: '#f7f9fc',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <InfoIcon
              sx={{ fontSize: 32, color: theme.palette.primary.main, flexShrink: 0 }}
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.dark }}
              >
                About Me
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {profile.bio}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* ─── Education & Year ─── */}
        {(profile.school || profile.year) && (
          <Paper
            elevation={1}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              backgroundColor: '#f7f9fc',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            {profile.school && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <SchoolIcon
                  sx={{ fontSize: 32, color: theme.palette.primary.main, flexShrink: 0 }}
                />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: theme.palette.primary.dark }}
                  >
                    School
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile.school}
                  </Typography>
                </Box>
              </Box>
            )}
            {profile.year && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <CalendarTodayIcon
                  sx={{ fontSize: 32, color: theme.palette.primary.main, flexShrink: 0 }}
                />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: theme.palette.primary.dark }}
                  >
                    Year
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile.year}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* ─── Major & Hometown ─── */}
        {(profile.major || profile.hometown) && (
          <Paper
            elevation={1}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              backgroundColor: '#f7f9fc',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            {profile.major && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <BookIcon
                  sx={{ fontSize: 32, color: theme.palette.primary.main, flexShrink: 0 }}
                />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: theme.palette.primary.dark }}
                  >
                    Major
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile.major}
                  </Typography>
                </Box>
              </Box>
            )}
            {profile.hometown && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <HomeIcon
                  sx={{ fontSize: 32, color: theme.palette.primary.main, flexShrink: 0 }}
                />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: theme.palette.primary.dark }}
                  >
                    Hometown
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile.hometown}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* ─── Hobbies & Interests ─── */}
        {Array.isArray(profile.hobbies) && profile.hobbies.length > 0 && (
          <Paper
            elevation={1}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              backgroundColor: '#f7f9fc',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.dark }}
            >
              Hobbies & Interests
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.hobbies.map((hobby) => (
                <Chip
                  key={hobby}
                  label={hobby}
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 500, borderRadius: 1 }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* ─── Return Button ─── */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              textTransform: 'none',
              px: 4,
              py: 1.2,
              '&:hover': {
                backgroundColor: theme.palette.primary.light,
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            Return
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
