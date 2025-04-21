'use client'

import { Box, Typography, Card, CardActionArea, CardContent } from '@mui/material'
import { useRouter } from 'next/navigation'
import HomeIcon from '@mui/icons-material/MeetingRoom'
import PeopleIcon from '@mui/icons-material/Group'

export default function DiscoverRootPage() {
  const router = useRouter()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: 8,
        background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
        color: '#e0e0e0'
      }}
    >
      <Typography variant="h3" sx={{ mb: 6, fontWeight: 'bold', color: '#9be7ff' }}>
        Skip the stress-live your best!
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          maxWidth: 900,
          width: '100%'
        }}
      >
        {/* Discover Rooms Card */}
        <Card
          sx={{
            flex: 1,
            backgroundColor: '#222236',
            border: '1px solid #333',
            borderRadius: 3,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 0 25px rgba(155, 231, 255, 0.25)'
            },
            transition: '0.3s ease'
          }}
        >
          <CardActionArea onClick={() => router.push('/discover/rooms')}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <HomeIcon sx={{ fontSize: 60, color: '#81d4fa', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#9be7ff', mb: 1 }}>
                Explore Rooms
              </Typography>
              <Typography sx={{ color: '#cfd8dc' }}>
                Browse available listings near campus and find your next room.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Discover Roommates Card */}
        <Card
          sx={{
            flex: 1,
            backgroundColor: '#222236',
            border: '1px solid #333',
            borderRadius: 3,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 0 25px rgba(155, 231, 255, 0.25)'
            },
            transition: '0.3s ease'
          }}
        >
          <CardActionArea onClick={() => router.push('/discover/roommates')}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PeopleIcon sx={{ fontSize: 60, color: '#81d4fa', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#9be7ff', mb: 1 }}>
                Find Roommates
              </Typography>
              <Typography sx={{ color: '#cfd8dc' }}>
                Find students with similar interests to share your space.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}
