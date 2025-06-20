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
  CircularProgress,
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
          background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #2d3748 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#007AFF' }} />
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
        pt: 8,
        px: 4,
        background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #2d3748 100%)',
        color: '#ffffff',
      }}
    >
      <div className="text-center mb-12 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <Typography
          variant="h3"
          sx={{ 
            mb: 3, 
            background: 'linear-gradient(135deg, #007AFF 0%, #00BFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700, 
            textAlign: 'center',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Welcome to Discover
        </Typography>

        {/* "See My Matches" at top */}
        <Button
          variant="contained"
          onClick={goToMatching}
          sx={{
            background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: '12px',
            padding: '12px 32px',
            boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
            '&:hover': { 
              background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)'
            },
            transition: 'all 0.3s ease',
            mb: 4
          }}
        >
          ✨ See My Matches
        </Button>

        <Typography
          variant="h6"
          sx={{
            color: '#a0aec0',
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.1rem' },
            mx: 'auto'
          }}
        >
          Find your next home or connect with like‐minded roommates—powered by a sleek,
          futuristic interface that feels right at home with Berkeley's vibrant community.
        </Typography>
      </div>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          maxWidth: 1200,
          width: '100%',
          mb: 8
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
              <Typography sx={buttonSx}>View Listings →</Typography>
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
              <Typography sx={buttonSx}>Meet Roommates →</Typography>
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
              <Typography sx={buttonSx}>View Matches →</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}

// Dark theme card styles
const cardSx = {
  flex: 1,
  background: 'rgba(30, 40, 53, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.5s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: -100,
    left: -100,
    width: 200,
    height: 200,
    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    transition: 'all 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(0, 122, 255, 0.2)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
  },
  '&:hover:before': {
    top: -150,
    left: -150,
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%)',
  },
}

const contentSx = { 
  textAlign: 'center', 
  py: 6, 
  px: 4, 
  position: 'relative', 
  zIndex: 1,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}

const iconSx = { 
  fontSize: 72, 
  color: '#007AFF', 
  mb: 3, 
  filter: 'drop-shadow(0 0 20px rgba(0, 122, 255, 0.5))',
  transition: 'all 0.3s ease'
}

const titleSx = { 
  color: '#ffffff', 
  fontWeight: 700, 
  mb: 2,
  fontSize: '1.5rem'
}

const textSx = { 
  color: '#a0aec0', 
  px: 2, 
  mb: 3, 
  lineHeight: 1.6,
  fontSize: '0.95rem'
}

const buttonSx = {
  color: '#007AFF',
  fontWeight: 600,
  fontSize: '1rem',
  mt: 'auto',
  padding: '10px 20px',
  borderRadius: '12px',
  background: 'transparent',
  border: '2px solid transparent',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.1), transparent)',
    transition: 'left 0.5s ease'
  },
  '&:hover': {
    color: '#ffffff',
    background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
    borderColor: '#007AFF',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 122, 255, 0.3)'
  },
  '&:hover:before': {
    left: '100%'
  }
}
