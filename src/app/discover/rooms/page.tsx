'use client'

import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material'

const fakeRooms = [
  {
    title: '🌇 Cozy Room in Downtown Berkeley',
    desc: '5-minute walk from campus, furnished with a desk, chair, and closet. Shared bathroom. Ideal for focused students.',
    price: '$850/mo',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: '🚇 Sunny Room near North Berkeley BART',
    desc: 'Bright and quiet, with large window and free high-speed Wi-Fi. Female-only household. Utilities included.',
    price: '$950/mo',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: '🛏️ Fully Furnished Room w/ Balcony – Southside',
    desc: 'Balcony view, full-sized bed, personal mini-fridge. 2 roommates, both quiet grad students.',
    price: '$1,050/mo',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: '📚 Minimalist Study Space Room',
    desc: 'Room with a modern desk setup and cozy lighting. Ideal for late-night study sessions.',
    price: '$880/mo',
    image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: '🌿 Zen Room with Garden View',
    desc: 'Peaceful room overlooking a quiet garden. Ideal for early risers and plant lovers.',
    price: '$920/mo',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
  }
]

export default function RoomsPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, sm: 4 },
          py: 6,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#e2e8f0',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '4px',
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {fakeRooms.map((room, i) => (
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
                flexDirection: 'column' // ✅ Force image on top, text below
              }}
            >
              {/* IMAGE ON TOP */}
              <CardMedia
                component="img"
                image={room.image}
                alt={room.title}
                sx={{
                  width: '100%',
                  height: '500px', // ✅ Small size
                  objectFit: 'cover'
                }}
              />

              {/* TEXT BELOW */}
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
                  {room.title}
                </Typography>
                <Typography sx={{ color: '#475569', mb: 1 }}>
                  {room.desc}
                </Typography>
                <Typography sx={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {room.price}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
