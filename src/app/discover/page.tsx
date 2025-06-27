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
    // Faster auth check with timeout
    const timer = setTimeout(() => {
      setCheckingAuth(false)
    }, 500) // Max 500ms wait

    const unsubscribe = auth.onAuthStateChanged(() => {
      setCheckingAuth(false)
      clearTimeout(timer)
    })
    
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  if (checkingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--gradient-background)',
        }}
      >
        <CircularProgress sx={{ color: 'var(--primary)' }} />
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
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
      }}
    >
      <div className="text-center mb-12">
        <Typography
          variant="h3"
          sx={{ 
            mb: 3, 
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700, 
            textAlign: 'center',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Welcome to Discover
        </Typography>

        {/* "See My Matches" at top - Using consistent button styling */}
        <Button
          variant="contained"
          onClick={goToMatching}
          className="btn-primary"
          sx={{
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: '12px',
            padding: '12px 32px',
            mb: 4,
            '&.btn-primary': {
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-blue)',
              '&:hover': {
                background: 'linear-gradient(135deg, var(--primary-hover) 0%, #003d82 100%)',
                boxShadow: 'var(--shadow-blue-hover)',
                transform: 'translateY(-2px)'
              }
            }
          }}
        >
          ✨ See My Matches
        </Button>

        <Typography
          variant="h6"
          sx={{
            color: 'var(--foreground-secondary)',
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
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4,
          maxWidth: 1200,
          width: '100%',
          mb: 8
        }}
      >
        {/* Explore Rooms */}
        <Card className="dark-card scale-on-hover" sx={cardSx}>
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
              <Typography className="btn-outline" sx={buttonSx}>View Listings →</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Find Roommates */}
        <Card className="dark-card scale-on-hover" sx={cardSx}>
          <CardActionArea onClick={() => router.push('/discover/roommates')}>
            <CardContent sx={contentSx}>
              <PeopleIcon sx={iconSx} />
              <Typography variant="h5" sx={titleSx}>
                Find Roommates
              </Typography>
              <Typography sx={textSx}>
                Build your profile, set lifestyle preferences, and match with compatible roommates—chat instantly to find the perfect living partner in Berkeley.
              </Typography>
              <Typography className="btn-outline" sx={buttonSx}>Meet Roommates →</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Matching */}
        <Card className="dark-card scale-on-hover" sx={cardSx}>
          <CardActionArea onClick={goToMatching}>
            <CardContent sx={contentSx}>
              <AssignmentIcon sx={iconSx} />
              <Typography variant="h5" sx={titleSx}>
                Matching
              </Typography>
              <Typography sx={textSx}>
                Enter a few keywords or let our AI find your top 5 matches—quickly discover the best room or roommate options tailored to you.
              </Typography>
              <Typography className="btn-outline" sx={buttonSx}>View Matches →</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}

// Optimized card styles - reduced complexity for better performance
const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: { xs: 260, md: 360 },
  background: 'var(--background-card)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow-dark)',
  transition: 'all 0.3s ease', // Reduced from 0.5s
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)', // Reduced movement for better performance
    boxShadow: 'var(--shadow-blue-hover)',
    border: '1px solid var(--primary)',
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
  color: 'var(--primary)', 
  mb: 3, 
  transition: 'all 0.2s ease' // Simplified transition
}

const titleSx = { 
  color: 'var(--foreground)', 
  fontWeight: 700, 
  mb: 2,
  fontSize: '1.5rem'
}

const textSx = { 
  color: 'var(--foreground-secondary)', 
  px: 2, 
  mb: 3, 
  lineHeight: 1.6,
  fontSize: '0.95rem'
}

const buttonSx = {
  color: 'var(--primary)',
  fontWeight: 600,
  fontSize: '1rem',
  mt: 'auto',
  padding: '10px 20px',
  borderRadius: '12px',
  background: 'transparent',
  border: '2px solid transparent',
  transition: 'all 0.2s ease', // Faster transition
  cursor: 'pointer',
  '&:hover': {
    color: 'var(--foreground)',
    background: 'var(--gradient-primary)',
    borderColor: 'var(--primary)',
    transform: 'translateY(-2px)',
  }
}
