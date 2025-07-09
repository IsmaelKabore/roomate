// File: src/app/discover/roommates/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Pagination,
  IconButton,
} from '@mui/material'
import {
  ArrowBackIos,
  ArrowForwardIos,
  Chat as ChatIcon,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { getRoommatePosts } from '@/lib/firestorePosts'
import { fetchUserProfile } from '@/lib/firestoreProfile'
import { auth } from '@/lib/firebaseConfig'
import { createRoom } from '@/lib/firestoreMessages'
import type { Timestamp } from 'firebase/firestore'

type RoommatePost = {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  createdAt: Timestamp
  profile?: {
    name?: string
    profilePicture?: string
    traits?: string[]
  } | null
}

// Memoized square carousel component for better performance
const SquareCarousel = React.memo(({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          aspectRatio: '1/1',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px 16px 0 0',
          position: 'relative',
        }}
      >
        <Typography sx={{ color: '#000000', fontSize: '0.9rem' }}>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1/1',
        overflow: 'hidden',
        borderRadius: '16px 16px 0 0',
        '&:hover .carousel-controls': {
          opacity: 1,
        },
      }}
    >
      <Box
        component="img"
        src={images[current]}
        alt={`carousel-${current}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.3s ease',
        }}
        loading="lazy"
      />

      {/* Image indicators */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {images.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrent(idx)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: idx === current ? '#000000' : 'rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#000000',
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box>
      )}

      {images.length > 1 && (
        <>
          <IconButton
            onClick={prev}
            className="carousel-controls"
            sx={{
              position: 'absolute',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              width: 36,
              height: 36,
              opacity: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>
          <IconButton
            onClick={next}
            className="carousel-controls"
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              width: 36,
              height: 36,
              opacity: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  )
})

SquareCarousel.displayName = 'SquareCarousel'

export default function RoommatesPage() {
  const [posts, setPosts] = useState<RoommatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const itemsPerPage = 12
  const router = useRouter()

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const raw: RoommatePost[] = await getRoommatePosts()
        raw.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        setPosts(raw)
        setLoading(false)
        loadProfiles(raw)
      } catch (error) {
        console.error('Error loading roommate posts:', error)
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  const loadProfiles = async (postsData: RoommatePost[]) => {
    setProfilesLoading(true)
    try {
      const batchSize = 5
      for (let i = 0; i < postsData.length; i += batchSize) {
        const batch = postsData.slice(i, i + batchSize)
        const enrichedBatch = await Promise.all(
          batch.map(async (p) => {
            let profileData: { name?: string; profilePicture?: string; traits?: string[] } | null = null
            try {
              const fetched = await fetchUserProfile(p.userId)
              profileData = fetched
            } catch {
              // ignore
            }
            return { ...p, profile: profileData }
          })
        )
        setPosts((prev) =>
          prev.map((post) => enrichedBatch.find((e) => e.id === post.id) || post)
        )
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setProfilesLoading(false)
    }
  }

  const handleChat = (post: RoommatePost) => {
    const user = auth.currentUser
    if (!user) {
      alert('You must be logged in to chat.')
      return
    }
    const roomId = [user.uid, post.userId].sort().join('_')
    createRoom(roomId, [user.uid, post.userId])
      .then(() => router.push(`/messages/${roomId}`))
      .catch(() => alert('Failed to create chat room.'))
  }

  const toggleFavorite = (postId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      prev.has(postId) ? next.delete(postId) : next.add(postId)
      return next
    })
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff',
        }}
      >
        <CircularProgress sx={{ color: '#000000' }} />
      </Box>
    )
  }

  const totalPages = Math.ceil(posts.length / itemsPerPage)
  const paginatedPosts = posts.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#000000',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            mb: 2,
            color: '#000000',
            fontWeight: 700,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}
        >
          Meet Your Perfect Roommate
        </Typography>
        <Typography
          sx={{
            color: '#000000',
            fontSize: '1.2rem',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
            mb: 1,
          }}
        >
          Discover amazing people looking for roommates just like you
        </Typography>
        <Typography
          sx={{
            color: '#000000',
            fontSize: '1rem',
            maxWidth: '500px',
            mx: 'auto',
            fontStyle: 'italic',
          }}
        >
          Swipe through profiles, connect instantly, and find your ideal living companion
        </Typography>
      </Box>

      {profilesLoading && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: '#000000' }} />
          <Typography sx={{ color: '#000000', fontSize: '0.9rem' }}>
            Loading profiles...
          </Typography>
        </Box>
      )}

      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {paginatedPosts.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <Typography sx={{ color: '#000000', fontSize: '1.1rem' }}>
              No roommate posts found.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1,1fr)',
                  sm: 'repeat(2,1fr)',
                  md: 'repeat(3,1fr)',
                  lg: 'repeat(4,1fr)',
                },
                gap: 3,
                mb: 4,
              }}
            >
              {paginatedPosts.map((post) => (
                <Card
                  key={post.id}
                  sx={{
                    background: '#ffffff',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(59,130,246,0.15)',
                      border: '1px solid #3b82f6',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <SquareCarousel images={post.images} />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(post.id)
                      }}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        color: favorites.has(post.id) ? '#ff4757' : '#000000',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {favorites.has(post.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>

                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar
                        src={post.profile?.profilePicture}
                        sx={{
                          bgcolor: '#3b82f6',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {post.profile?.name?.[0] || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: '#000000',
                            fontWeight: 600,
                            fontSize: '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {post.profile?.name || 'Anonymous'}
                        </Typography>
                        <Typography sx={{ color: '#000000', fontSize: '0.8rem' }}>
                          {post.createdAt.toDate().toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        color: '#000000',
                        fontWeight: 600,
                        fontSize: '1.1rem',
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
                        color: '#000000',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.8rem',
                      }}
                    >
                      {post.description}
                    </Typography>

                    {post.profile?.traits && post.profile.traits.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {post.profile.traits.slice(0, 2).map((trait, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '8px',
                              background: '#f3f4f6',
                              color: '#3b82f6',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {trait}
                          </Box>
                        ))}
                        {post.profile.traits.length > 2 && (
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '8px',
                              background: '#f3f4f6',
                              color: '#000000',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            +{post.profile.traits.length - 2}
                          </Box>
                        )}
                      </Box>
                    )}

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleChat(post)
                      }}
                      startIcon={<ChatIcon />}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        py: 1,
                        fontWeight: 600,
                        background: '#3b82f6',
                        color: '#ffffff',
                        '&:hover': {
                          background: '#2563eb',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      Start Chat
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => {
                    setPage(v)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#000000',
                      borderColor: 'rgba(0,0,0,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#2563eb',
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
