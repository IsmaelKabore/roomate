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
  },
  
]

export default function RoomsPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {fakeRooms.map((room, i) => (
        <Card
          key={i}
          sx={{
            backgroundColor: '#222236',
            borderRadius: 3,
            boxShadow: '0 0 20px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 0 40px rgba(155, 231, 255, 0.2)'
            }
          }}
        >
          <CardMedia
            component="img"
            height="10"
            image={room.image}
            alt={room.title}
            sx={{
              objectFit: 'cover'
            }}
          />
          <CardContent>
            <Typography variant="h6" sx={{ color: '#9be7ff', mb: 1 }}>
              {room.title}
            </Typography>
            <Typography sx={{ color: '#cfd8dc', mb: 1 }}>{room.desc}</Typography>
            <Typography sx={{ color: '#81d4fa', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {room.price}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
