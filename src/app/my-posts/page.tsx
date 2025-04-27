'use client'

import { useState } from 'react'
import { Box, Button, Typography, Card, CardMedia, CardContent } from '@mui/material'
import Link from 'next/link'

const fakePosts = [
  {
    title: 'Room in Downtown Berkeley',
    desc: 'Chill 2 bed apartment, 5 minutes from campus. Furnished room, shared kitchen and bath.',
    price: '$800/mo',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: 'Sunny Room Near BART',
    desc: 'Private room with desk and closet. Utilities included. 10 min walk to BART.',
    price: '$920/mo',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: 'Room with Balcony – Southside',
    desc: 'Top floor with great light, balcony access, and fast Wi-Fi. Ideal for quiet students.',
    price: '$1,050/mo',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
  }
]

export default function MyPostsPage() {
  const [posts] = useState(fakePosts)

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#171717', px: 4, py: 6 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#0f172a' }}>
        My Posts
      </Typography>

      <Link href="/create" passHref>
        <Button
          variant="outlined"
          sx={{
            mb: 4,
            color: '#0f172a',
            borderColor: '#0f172a',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#e0f2fe',
              borderColor: '#0ea5e9'
            }
          }}
        >
          ➕ Create New Post
        </Button>
      </Link>

      <Box
        sx={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        {posts.map((post, idx) => (
          <Card
            key={idx}
            sx={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            {post.image && (
              <CardMedia
                component="img"
                height="200"
                image={post.image}
                alt={post.title}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Typography variant="h6" sx={{ color: '#0ea5e9', mb: 1 }}>
                {post.title}
              </Typography>
              <Typography sx={{ mb: 1, color: '#334155' }}>{post.desc}</Typography>
              <Typography sx={{ color: '#0f172a', fontWeight: 600 }}>{post.price}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
