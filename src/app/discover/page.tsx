// src/app/discover/page.tsx
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
    const timer = setTimeout(() => setCheckingAuth(false), 500)
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
          backgroundColor: '#ffffff',
        }}
      >
        <CircularProgress sx={{ color: '#007AFF' }} />
      </Box>
    )
  }

  const goToMatching = () => {
    if (!auth.currentUser) router.push('/auth/login')
    else router.push('/discover/match')
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
        backgroundColor: '#ffffff',
        color: '#111827',
      }}
    >
      <div className="text-center mb-12">
        <Typography
          variant="h3"
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          Welcome to Discover
        </Typography>

        <Button
          variant="contained"
          onClick={goToMatching}
          sx={{
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: '12px',
            padding: '12px 32px',
            mb: 4,
            background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)',
              transform: 'translateY(-2px)',
            },
          }}
        >
           See My Matches
        </Button>
      </div>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4,
          maxWidth: 1200,
          width: '100%',
          mb: 8,
        }}
      >
        {[{
          Icon: HomeIcon,
          title: 'Explore Rooms',
          desc: 'Browse trusted listings around Berkeley? smooth VR tours, real-time filters, and immersive previews.',
          onClick: () => router.push('/discover/rooms'),
        },{
          Icon: PeopleIcon,
          title: 'Find Roommates',
          desc: 'Build your profile, set preferences, and match with compatible roommates, chat instantly to connect.',
          onClick: () => router.push('/discover/roommates'),
        },{
          Icon: AssignmentIcon,
          title: 'Matching',
          desc: 'Let our AI find your top matches, quickly discover the best room or roommate options tailored to you.',
          onClick: goToMatching,
        }].map(({ Icon, title, desc, onClick }, idx) => (
          <Card
            key={idx}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 260, md: 360 },
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
                border: '1px solid #007AFF',
              },
            }}
          >
            <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Icon sx={{ fontSize: 72, color: '#007AFF', mb: 3, transition: 'all 0.2s ease' }} />
                <Typography variant="h5" sx={{ color: '#111827', fontWeight: 700, mb: 2 }}>
                  {title}
                </Typography>
                <Typography sx={{ color: '#6B7280', mb: 3, px: 2, lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {desc}
                </Typography>
                <Typography
                  onClick={onClick}
                  sx={{
                    color: '#007AFF',
                    fontWeight: 600,
                    fontSize: '1rem',
                    mt: 'auto',
                    px: 2,
                    py: 1.5,
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: '2px solid #007AFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                      borderColor: 'transparent',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  { title === 'Explore Rooms' ? 'View Listings →'
                    : title === 'Find Roommates' ? 'Meet Roommates →'
                    : 'View Matches →' }
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

// References:
// layout.tsx original :contentReference[oaicite:0]{index=0}
// discover page.tsx original :contentReference[oaicite:1]{index=1}
