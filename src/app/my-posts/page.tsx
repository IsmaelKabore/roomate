// File: src/app/my-posts/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material'
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { onAuthStateChanged } from 'firebase/auth'
import Link from 'next/link'
import RequireAuth from '@/components/RequireAuth'
import { auth } from '@/lib/firebaseConfig'
import { getPostsByUser } from '@/lib/firestorePosts'
import type { Timestamp } from 'firebase/firestore'

type UserPost = {
  id: string
  userId: string
  title: string
  description: string
  price: number
  address: string
  images: string[]
  furnished?: boolean
  petsAllowed?: boolean
  genderPreference?: 'male' | 'female' | 'any'
  type: 'room' | 'roommate'
  createdAt: Timestamp
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userPosts = await getPostsByUser(user.uid)
        setPosts(userPosts as UserPost[])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate()
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#FFFFFF',
        }}
      >
        <CircularProgress sx={{ color: '#3B82F6' }} size={48} />
      </Box>
    )
  }

  return (
    <RequireAuth>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#FFFFFF',
          color: '#000000',
          p: { xs: 2, md: 4 },
        }}
      >
        {/* Hero Header */}
        <Box sx={{ textAlign: 'center', mb: 6, pt: 4 }}>
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              background: 'linear-gradient(to right, #3B82F6, #2563EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            Your Listings
          </Typography>
          <Typography
            sx={{
              color: 'rgba(0,0,0,0.7)',
              fontSize: '1.2rem',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            Manage your room listings and roommate requests all in one place
          </Typography>
          <Link href="/create" passHref>
            <Button
              startIcon={<AddIcon />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '16px',
                background: 'linear-gradient(to right, #3B82F6, #2563EB)',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                '&:hover': {
                  background: '#2563EB',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(59,130,246,0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Create New Listing
            </Button>
          </Link>
        </Box>

        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {posts.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 12,
                px: 6,
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.1)',
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 4,
                  opacity: 0.8,
                }}
              >
                <HomeIcon sx={{ fontSize: 60, color: '#FFFFFF' }} />
              </Box>
              <Typography 
                variant="h5" 
                sx={{ color: '#000000', fontWeight: 600, mb: 2 }}
              >
                No listings yet
              </Typography>
              <Typography 
                sx={{ color: 'rgba(0,0,0,0.7)', fontSize: '1.1rem', mb: 4, lineHeight: 1.6 }}
              >
                Ready to find your perfect roommate or list your room? Create your first listing and start connecting with amazing people!
              </Typography>
              <Link href="/create" passHref>
                <Button
                  startIcon={<AddIcon />}
                  sx={{
                    px: 3,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(to right, #3B82F6, #2563EB)',
                    color: '#FFFFFF',
                    '&:hover': {
                      background: '#2563EB',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Link>
            </Box>
          ) : (
            <>
              {/* Stats Bar */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 4,
                  mb: 6,
                  flexWrap: 'wrap',
                }}
              >
                {[ 
                  { label: 'Total Listings', value: posts.length },
                  { label: 'Room Listings',   value: posts.filter(p => p.type === 'room').length },
                  { label: 'Roommate Requests', value: posts.filter(p => p.type === 'roommate').length },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      px: 4,
                      py: 2,
                      borderRadius: '16px',
                      textAlign: 'center',
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography sx={{ color: '#3B82F6', fontSize: '2rem', fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Posts Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    sx={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(59,130,246,0.15)',
                        border: '1px solid #3B82F6',
                      },
                    }}
                  >
                    {/* Image */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/10',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      {post.images && post.images.length > 0 ? (
                        <Box
                          component="img"
                          src={post.images[0]}
                          alt={post.title}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#3B82F6',
                            opacity: 0.8,
                          }}
                        >
                          <HomeIcon sx={{ fontSize: 48, color: '#FFFFFF' }} />
                        </Box>
                      )}
                      <Chip
                        icon={post.type === 'room' ? <HomeIcon /> : <PersonIcon />}
                        label={post.type === 'room' ? 'Room' : 'Roommate'}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: post.type === 'room'
                            ? '#3B82F6'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          '& .MuiChip-icon': { color: '#FFFFFF' },
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#000000',
                          fontWeight: 600,
                          fontSize: '1.2rem',
                          mb: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(0,0,0,0.7)',
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                          mb: 2,
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          display: '-webkit-box',
                          overflow: 'hidden',
                          minHeight: '3rem',
                        }}
                      >
                        {post.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                        {post.type === 'room' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MoneyIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                            <Typography sx={{ color: '#3B82F6', fontWeight: 600, fontSize: '1.1rem' }}>
                              ${post.price.toLocaleString()}/month
                            </Typography>
                          </Box>
                        )}
                        {post.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 16, color: 'rgba(0,0,0,0.7)' }} />
                            <Typography
                              sx={{
                                color: 'rgba(0,0,0,0.7)',
                                fontSize: '0.9rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {post.address}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'rgba(0,0,0,0.7)' }} />
                          <Typography sx={{ color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem' }}>
                            {formatDate(post.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Link href={`/create/${post.id}`} passHref>
                        <Button
                          startIcon={<EditIcon />}
                          fullWidth
                          sx={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            py: 1.2,
                            fontWeight: 600,
                            background: '#FFFFFF',
                            color: '#3B82F6',
                            border: '1px solid rgba(59,130,246,0.3)',
                            '&:hover': {
                              background: '#3B82F6',
                              color: '#FFFFFF',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          Edit Listing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </RequireAuth>
  )
}
