'use client'

import { Box, Card, CardContent, Typography, Chip, Button, CardMedia } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'

const roommateSeekers = [
  {
    name: 'Amina',
    bio: 'CS major, early bird, loves quiet evenings and organizing her space.',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    interests: ['Journaling', 'Matcha', 'Clean roommates']
  },
  {
    name: 'Tariq',
    bio: 'Econ transfer student. Big on soccer, meal prepping, and late-night debates.',
    image: 'https://randomuser.me/api/portraits/men/75.jpg',
    interests: ['Cooking', 'Football', 'Quiet study sessions']
  },
  {
    name: 'Jasmine',
    bio: 'Architecture student. Always down to talk design or water her 10 plants.',
    image: 'https://randomuser.me/api/portraits/women/12.jpg',
    interests: ['Interior design', 'Painting', 'Plants']
  },
  {
    name: 'Luis',
    bio: 'Engineering major, gamer, and low-key chef. Clean but not silent.',
    image: 'https://randomuser.me/api/portraits/men/24.jpg',
    interests: ['Gaming', 'Cooking', 'Late-night snacks']
  },
  {
    name: 'Mei',
    bio: 'Business major who values aesthetics, routine, and respectful roomies.',
    image: 'https://randomuser.me/api/portraits/women/40.jpg',
    interests: ['Skincare', 'Modern apartments', 'Cafés']
  },
  {
    name: 'Jonas',
    bio: 'Data Science nerd. Obsessed with cold brew and Figma.',
    image: 'https://randomuser.me/api/portraits/men/10.jpg',
    interests: ['Coding', 'Cold brew', 'Figma']
  }
]

export default function RoommatesPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      {roommateSeekers.map((person, i) => (
        <Card
          key={i}
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: '0 8px 20px rgba(100, 116, 139, 0.2)'
            },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Image on Top */}
          <CardMedia
            component="img"
            image={person.image}
            alt={person.name}
            sx={{
              width: '100%',
              height: '500px',
              objectFit: 'cover'
            }}
          />

          {/* Content */}
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
              {person.name}
            </Typography>

            <Typography sx={{ color: '#475569', fontSize: '0.9rem' }}>
              {person.bio}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {person.interests.map((interest, idx) => (
                <Chip
                  key={idx}
                  label={interest}
                  size="small"
                  sx={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: 500
                  }}
                />
              ))}
            </Box>

            {/* Chat Button */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ChatIcon />}
                sx={{
                  color: '#4f46e5',
                  borderColor: '#4f46e5',
                  fontWeight: 'bold',
                  '&:hover': {
                    borderColor: '#6366f1',
                    backgroundColor: '#eef2ff'
                  }
                }}
              >
                Chat
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
