// File: src/app/discover/page.tsx

'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Button,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import HomeIcon from '@mui/icons-material/MeetingRoom'
import PeopleIcon from '@mui/icons-material/Group'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { auth } from '@/lib/firebaseConfig'

export default function DiscoverRootPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  if (checkingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography>Loading…</Typography>
      </Box>
    )
  }

  const goToMatching = () => {
    if (!auth.currentUser) {
      router.push('/auth/login')
    } else {
      router.push('/discover/match')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 6,
        px: 4,
        background: 'linear-gradient(to bottom right, #ffffff, #EFF6FF)',
        color: '#1e293b',
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 2, color: '#1E40AF', fontWeight: 700, textAlign: 'center' }}
      >
        Welcome to Discover
      </Typography>

      {/* “See My Matches” at top */}
      <Button
        variant="contained"
        onClick={goToMatching}
        sx={{
          mb: 4,
          background: '#3B82F6',
          color: '#fff',
          '&:hover': { background: '#2563EB' },
        }}
      >
        See My Matches
      </Button>

      <Typography
        variant="subtitle1"
        sx={{
          mb: 6,
          color: '#475569',
          textAlign: 'center',
          maxWidth: 640,
          lineHeight: 1.5,
        }}
      >
        Find your next home or connect with like‐minded roommates—powered by a sleek,
        futuristic interface that feels right at home with Berkeley’s vibrant community.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          maxWidth: 960,
          width: '100%',
        }}
      >
        {/* Explore Rooms */}
        <Card sx={cardSx}>
          <CardActionArea onClick={() => router.push('/discover/rooms')}>
            <CardContent sx={contentSx}>
              <HomeIcon sx={iconSx} />
              <Typography variant="h5" sx={titleSx}>
                Explore Rooms
              </Typography>
              <Typography sx={textSx}>
                Browse trusted listings around Berkeley—​butter-smooth VR tours,
                real-time filters, and immersive neighborhood previews to help you choose your perfect space.
              </Typography>
              <Typography sx={buttonSx}>View Listings</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Find Roommates */}
        <Card sx={cardSx}>
          <CardActionArea onClick={() => router.push('/discover/roommates')}>
            <CardContent sx={contentSx}>
              <PeopleIcon sx={iconSx} />
              <Typography variant="h5" sx={titleSx}>
                Find Roommates
              </Typography>
              <Typography sx={textSx}>
                Build your profile, set lifestyle preferences, and match with compatible roommates—chat instantly to find the perfect living partner in Berkeley.
              </Typography>
              <Typography sx={buttonSx}>Meet Roommates</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Matching */}
        <Card sx={cardSx}>
          <CardActionArea onClick={goToMatching}>
            <CardContent sx={contentSx}>
              <AssignmentIcon sx={iconSx} />
              <Typography variant="h5" sx={titleSx}>
                Matching
              </Typography>
              <Typography sx={textSx}>
                Enter a few keywords or let our AI find your top 5 matches—quickly discover the best room or roommate options tailored to you.
              </Typography>
              <Typography sx={buttonSx}>View Matches</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}

// Shared styles
const cardSx = {
  flex: 1,
  bgcolor: '#ffffff',
  borderRadius: 3,
  boxShadow: '0px 4px 16px rgba(59,130,246,0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    bgcolor: 'rgba(59,130,246,0.1)',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0px 8px 32px rgba(59,130,246,0.2)',
  },
  '&:hover:before': {
    top: -80,
    left: -80,
    width: 200,
    height: 200,
    bgcolor: 'rgba(59,130,246,0.15)',
  },
}

const contentSx = { textAlign: 'center', py: 8, position: 'relative', zIndex: 1 }
const iconSx    = { fontSize: 64, color: '#3B82F6', mb: 2, filter: 'drop-shadow(0 0 5px rgba(59,130,246,0.6))' }
const titleSx   = { color: '#1E40AF', fontWeight: 700, mb: 1 }
const textSx    = { color: '#475569', px: 2, mb: 2, lineHeight: 1.4 }
const buttonSx  = {
  display: 'inline-block',
  mt: 2,
  px: 3,
  py: 1,
  bgcolor: '#3B82F6',
  color: '#ffffff',
  borderRadius: 2,
  fontWeight: 600,
  transition: 'background 0.3s ease',
  '&:hover': { bgcolor: '#2563EB' },
}
