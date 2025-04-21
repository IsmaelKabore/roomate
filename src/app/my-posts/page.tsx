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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #161621, #1c1c2b)',
        color: '#e0e0e0',
        px: 4,
        py: 6
      }}
    >
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#9be7ff' }}>
        My Posts
      </Typography>

      <Link href="/create" passHref>
        <Button
          variant="outlined"
          sx={{
            mb: 4,
            color: '#9be7ff',
            borderColor: '#9be7ff',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(155, 231, 255, 0.1)',
              borderColor: '#81d4fa'
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
              backgroundColor: '#222236',
              border: '1px solid #333',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(0,0,0,0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 0 30px rgba(155, 231, 255, 0.25)'
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
              <Typography variant="h6" sx={{ color: '#9be7ff', mb: 1 }}>
                {post.title}
              </Typography>
              <Typography sx={{ mb: 1 }}>{post.desc}</Typography>
              <Typography sx={{ color: '#81d4fa', fontWeight: 500 }}>{post.price}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
