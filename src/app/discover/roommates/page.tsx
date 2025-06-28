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
import { ArrowBackIos, ArrowForwardIos, Chat as ChatIcon, Favorite, FavoriteBorder } from '@mui/icons-material'
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
  }
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
          backgroundColor: 'var(--background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px 16px 0 0',
          position: 'relative',
        }}
      >
        <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      aspectRatio: '1/1',
      overflow: 'hidden', 
      borderRadius: '16px 16px 0 0',
      '&:hover .carousel-controls': {
        opacity: 1,
      }
    }}>
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
                backgroundColor: idx === current ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#ffffff',
                  transform: 'scale(1.2)',
                }
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
  const itemsPerPage = 12 // Increased for grid layout
  const router = useRouter()

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const raw: RoommatePost[] = await getRoommatePosts()
        
        // Sort by createdAt descending so newest appear first
        raw.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        setPosts(raw)
        setLoading(false)

        // Load profiles in background after initial render
        loadProfiles(raw)
      } catch (error) {
        console.error('Error loading roommate posts:', error)
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  // Separate function to load profiles asynchronously
  const loadProfiles = async (postsData: RoommatePost[]): Promise<void> => {
    setProfilesLoading(true)
    try {
      // Load profiles in batches to avoid overwhelming the system
      const batchSize = 5
      const batches: RoommatePost[][] = []
      for (let i = 0; i < postsData.length; i += batchSize) {
        batches.push(postsData.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const enrichedBatch = await Promise.all(
          batch.map(async (p) => {
            let profileData: undefined | {
              name?: string
              profilePicture?: string
              traits?: string[]
            } = undefined

            try {
              const fetchedProfile = await fetchUserProfile(p.userId)
              profileData = fetchedProfile ? fetchedProfile : undefined
            } catch {
              // ignore if no profile
            }

            return { ...p, profile: profileData }
          })
        )

        // Update posts with the enriched batch
        setPosts(prevPosts => 
          prevPosts.map(post => {
            const enriched = enrichedBatch.find(er => er.id === post.id)
            return enriched ? enriched : post
          })
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
    
    if (!user.uid) {
      console.error('User UID is missing:', user)
      alert('User authentication error. Please try logging in again.')
      return
    }
    
    if (!post.userId) {
      console.error('Post userId is missing:', post)
      alert('Invalid post data. Please try again.')
      return
    }
    
    console.log('Creating chat room between:', user.uid, 'and', post.userId)
    const roomId = [user.uid, post.userId].sort().join('_')
    console.log('Generated room ID:', roomId)
    
    createRoom(roomId, [user.uid, post.userId])
      .then(() => {
        console.log('Room created successfully, navigating to:', `/messages/${roomId}`)
        router.push(`/messages/${roomId}`)
      })
      .catch((error) => {
        console.error('Error creating room:', error)
        alert('Failed to create chat room. Please try again.')
      })
  }

  const toggleFavorite = (postId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(postId)) {
        newFavorites.delete(postId)
      } else {
        newFavorites.add(postId)
      }
      return newFavorites
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
          background: 'var(--gradient-background)',
        }}
      >
        <CircularProgress sx={{ color: 'var(--primary)' }} />
      </Box>
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / itemsPerPage)
  const startIdx = (page - 1) * itemsPerPage
  const paginatedPosts = posts.slice(startIdx, startIdx + itemsPerPage)

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            mb: 2,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}
        >
          Meet Your Perfect Roommate
        </Typography>
        <Typography
          sx={{
            color: 'var(--foreground-secondary)',
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
            color: 'var(--foreground-tertiary)',
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
          <CircularProgress size={16} sx={{ color: 'var(--primary)' }} />
          <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
            Loading profiles...
          </Typography>
        </Box>
      )}

      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {posts.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              background: 'var(--background-card)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '1.1rem' }}>
              No roommate posts found.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Square Grid Layout */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
                mb: 4,
              }}
            >
              {paginatedPosts.map((post) => (
                <Card
                  key={post.id}
                  className="dark-card scale-on-hover"
                  sx={{
                    background: 'var(--background-card)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0, 122, 255, 0.15)',
                      border: '1px solid var(--primary)',
                    },
                  }}
                >
                  {/* Square Image Section */}
                  <Box sx={{ position: 'relative' }}>
                    <SquareCarousel images={post.images} />
                    
                    {/* Favorite Button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(post.id)
                      }}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: favorites.has(post.id) ? '#ff4757' : '#ffffff',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {favorites.has(post.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>

                  {/* Content Section */}
                  <Box sx={{ p: 2.5 }}>
                    {/* Profile Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar
                        src={post.profile?.profilePicture}
                        sx={{ 
                          bgcolor: 'var(--primary)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {post.profile?.name?.[0] || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          sx={{ 
                            color: 'var(--foreground)', 
                            fontWeight: 600, 
                            fontSize: '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {post.profile?.name || 'Anonymous'}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: 'var(--foreground-secondary)', 
                            fontSize: '0.8rem',
                          }}
                        >
                          {post.createdAt.toDate().toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Title */}
                    <Typography
                      sx={{
                        color: 'var(--foreground)',
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

                    {/* Description */}
                    <Typography
                      sx={{
                        color: 'var(--foreground-secondary)',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.8rem', // Consistent height
                      }}
                    >
                      {post.description}
                    </Typography>

                    {/* Traits */}
                    {post.profile?.traits && post.profile.traits.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {post.profile.traits.slice(0, 2).map((trait, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '8px',
                              background: 'var(--background-secondary)',
                              color: 'var(--primary)',
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
                              background: 'var(--background-secondary)',
                              color: 'var(--foreground-secondary)',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            +{post.profile.traits.length - 2}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleChat(post)
                      }}
                      startIcon={<ChatIcon />}
                      fullWidth
                      className="btn-primary"
                      sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        py: 1,
                        fontWeight: 600,
                        '&.btn-primary': {
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, var(--primary-hover) 0%, #003d82 100%)',
                            transform: 'translateY(-1px)',
                          }
                        }
                      }}
                    >
                      Start Chat
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'var(--foreground)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        borderColor: 'var(--primary)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'var(--primary-hover)',
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
