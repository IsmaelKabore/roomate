'use client'

import { Box, Card, CardContent, Typography, Chip, Button } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import Image from 'next/image'

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
    <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {roommateSeekers.map((person, i) => (
        <Card
          key={i}
          sx={{
            backgroundColor: '#222236',
            border: '1px solid #333',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 0 25px rgba(0,0,0,0.25)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: '0 0 40px rgba(155, 231, 255, 0.25)'
            }
          }}
        >
          <Box sx={{ position: 'relative', height: 300 }}>
            <Image
              src={person.image}
              alt={person.name}
              fill
              sizes="(max-width: 600px) 100vw, 300px"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6" sx={{ color: '#9be7ff' }}>
              {person.name}
            </Typography>
            <Typography sx={{ color: '#cfd8dc' }}>{person.bio}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {person.interests.map((interest, idx) => (
                <Chip
                  key={idx}
                  label={interest}
                  size="small"
                  sx={{
                    backgroundColor: '#2a2a40',
                    color: '#81d4fa',
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
                  color: '#81d4fa',
                  borderColor: '#81d4fa',
                  '&:hover': {
                    borderColor: '#9be7ff',
                    backgroundColor: 'rgba(155, 231, 255, 0.1)'
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
