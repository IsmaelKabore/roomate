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
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)', // 🌟 light background!
        color: '#1e293b', // dark text
      }}
    >
      <Typography variant="h3" sx={{ mb: 6, fontWeight: 'bold', color: '#4f46e5' }}>
        Discover your next adventure!
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          maxWidth: 900,
          width: '100%',
        }}
      >
        {/* Discover Rooms Card */}
        <Card
          sx={{
            flex: 1,
            backgroundColor: '#ffffff', // white card
            border: '1px solid #cbd5e1',
            borderRadius: 3,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
            },
            transition: '0.3s ease',
          }}
        >
          <CardActionArea onClick={() => router.push('/discover/rooms')}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <HomeIcon sx={{ fontSize: 60, color: '#6366f1', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#334155', mb: 1 }}>
                Explore Rooms
              </Typography>
              <Typography sx={{ color: '#64748b' }}>
                Browse available listings near campus and find your next room.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Discover Roommates Card */}
        <Card
          sx={{
            flex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 3,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
            },
            transition: '0.3s ease',
          }}
        >
          <CardActionArea onClick={() => router.push('/discover/roommates')}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PeopleIcon sx={{ fontSize: 60, color: '#6366f1', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#334155', mb: 1 }}>
                Find Roommates
              </Typography>
              <Typography sx={{ color: '#64748b' }}>
                Find students with similar interests to share your space.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}
