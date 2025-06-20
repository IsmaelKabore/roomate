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
} from '@mui/material'
import { ArrowBackIos, ArrowForwardIos, Chat as ChatIcon } from '@mui/icons-material'
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

// Memoized carousel component for better performance
const Carousel = React.memo(({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          height: 300,
          backgroundColor: 'var(--background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <Typography sx={{ color: 'var(--foreground-secondary)' }}>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', height: 300, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
      <Box
        component="img"
        src={images[current]}
        alt={`carousel-${current}`}
        sx={{
          width: '100%',
          height: 300,
          objectFit: 'cover',
        }}
        loading="lazy" // Add lazy loading for images
      />
      {images.length > 1 && (
        <>
          <Button
            onClick={prev}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              minWidth: '32px',
              p: 0.5,
              borderRadius: '50%',
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              transition: 'background-color 0.2s ease',
            }}
            size="small"
          >
            <ArrowBackIos fontSize="small" />
          </Button>
          <Button
            onClick={next}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              minWidth: '32px',
              p: 0.5,
              borderRadius: '50%',
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              transition: 'background-color 0.2s ease',
            }}
            size="small"
          >
            <ArrowForwardIos fontSize="small" />
          </Button>
        </>
      )}
    </Box>
  )
})

Carousel.displayName = 'Carousel'

export default function RoommatesPage() {
  const [posts, setPosts] = useState<RoommatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
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
    const roomId = [user.uid, post.userId].sort().join('_')
    createRoom(roomId, [user.uid, post.userId]).then(() => {
      router.push(`/messages/${roomId}`)
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
        p: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          textAlign: 'center',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}
      >
        Find Roommates
      </Typography>

      {profilesLoading && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: 'var(--primary)' }} />
          <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
            Loading profiles...
          </Typography>
        </Box>
      )}

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
              {paginatedPosts.map((post) => (
                <Card
                  key={post.id}
                  className="dark-card"
                  sx={{
                    background: 'var(--background-card)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 'var(--shadow-blue-hover)',
                      border: '1px solid var(--primary)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 300 }}>
                    {/* Image Section */}
                    <Box sx={{ flex: { xs: 'none', md: '0 0 400px' } }}>
                      <Carousel images={post.images} />
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <CardHeader
                        avatar={
                          <Avatar
                            src={post.profile?.profilePicture}
                            sx={{ 
                              bgcolor: 'var(--primary)',
                              width: 50,
                              height: 50,
                            }}
                          >
                            {post.profile?.name?.[0] || '?'}
                          </Avatar>
                        }
                        title={
                          <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '1.1rem' }}>
                            {post.profile?.name || 'Anonymous'}
                          </Typography>
                        }
                        subheader={
                          <Box sx={{ mt: 1 }}>
                            {post.profile?.traits && post.profile.traits.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {post.profile.traits.slice(0, 3).map((trait, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: '12px',
                                      background: 'var(--background-secondary)',
                                      color: 'var(--primary)',
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {trait}
                                  </Box>
                                ))}
                                {post.profile.traits.length > 3 && (
                                  <Box
                                    sx={{
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: '12px',
                                      background: 'var(--background-secondary)',
                                      color: 'var(--foreground-secondary)',
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    +{post.profile.traits.length - 3} more
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                        sx={{ p: 3, pb: 2 }}
                      />

                      <CardContent sx={{ flexGrow: 1, pt: 0, p: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2 }}
                        >
                          {post.title}
                        </Typography>

                        <Typography
                          sx={{
                            color: 'var(--foreground-secondary)',
                            mb: 3,
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {post.description}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                          <Typography
                            sx={{
                              color: 'var(--foreground-secondary)',
                              fontSize: '0.9rem',
                            }}
                          >
                            Posted {post.createdAt.toDate().toLocaleDateString()}
                          </Typography>

                          <Button
                            onClick={() => handleChat(post)}
                            startIcon={<ChatIcon />}
                            className="btn-primary"
                            sx={{
                              textTransform: 'none',
                              borderRadius: '12px',
                              px: 3,
                              py: 1,
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
                      </CardContent>
                    </Box>
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
