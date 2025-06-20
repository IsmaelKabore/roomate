// File: src/app/discover/roommates/page.tsx
'use client'

import { useEffect, useState } from 'react'
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

function Carousel({ images }: { images: string[] }) {
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
                transform: 'translateY(-50%) scale(1.1)',
              },
              transition: 'all 0.2s ease',
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
                transform: 'translateY(-50%) scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
            size="small"
          >
            <ArrowForwardIos fontSize="small" />
          </Button>
        </>
      )}
    </Box>
  )
}

export default function RoommatesPage() {
  const [posts, setPosts] = useState<RoommatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const raw: RoommatePost[] = await getRoommatePosts()
      const enriched = await Promise.all(
        raw.map(async (p) => {
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

      // Sort by createdAt descending so newest appear first
      enriched.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      setPosts(enriched)
      setLoading(false)
    })()
  }, [])

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
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: '800px',
        mx: 'auto',
      }}
    >
      {posts.length === 0 ? (
        <Typography sx={{ color: 'var(--foreground-secondary)', textAlign: 'center', fontSize: '1.2rem' }}>
          No roommate posts found.
        </Typography>
      ) : (
        <>
          {paginatedPosts.map((person) => (
            <Card
              key={person.id}
              className="dark-card scale-on-hover"
              sx={{
                backgroundColor: 'var(--background-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 'var(--shadow-blue-hover)',
                  border: '1px solid var(--primary)',
                }
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    src={person.profile?.profilePicture || ''}
                    sx={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--foreground)',
                      border: '2px solid var(--border)',
                    }}
                  >
                    {person.profile?.name?.[0] || '?'}
                  </Avatar>
                }
                title={
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'var(--foreground)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'var(--primary)',
                      },
                      transition: 'color 0.2s ease',
                    }}
                    onClick={() => {
                      if (!auth.currentUser) {
                        alert('You must be logged in to view profiles.')
                      } else {
                        router.push(`/profile/${person.userId}`)
                      }
                    }}
                  >
                    {person.profile?.name || 'Unknown User'}
                  </Typography>
                }
                subheader={
                  <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                    {(person.profile?.traits || []).slice(0, 3).join(' • ') || 'No traits listed'}
                  </Typography>
                }
                action={
                  auth.currentUser && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push(`/profile/${person.userId}`)}
                      sx={{
                        color: 'var(--primary)',
                        borderColor: 'var(--primary)',
                        '&:hover': {
                          backgroundColor: 'var(--primary)',
                          color: 'var(--foreground)',
                        },
                        textTransform: 'none',
                        fontWeight: 500,
                      }}
                    >
                      View Profile
                    </Button>
                  )
                }
                sx={{
                  backgroundColor: 'var(--background-secondary)',
                  borderBottom: '1px solid var(--border)',
                }}
              />

              <Carousel images={person.images} />

              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'var(--foreground)',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {person.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--foreground-secondary)',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {person.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<ChatIcon />}
                    onClick={() => handleChat(person)}
                    className="btn-primary"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '12px',
                      px: 3,
                    }}
                  >
                    Chat
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'var(--foreground-secondary)',
                  borderColor: 'var(--border)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    color: 'var(--primary)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--foreground)',
                    '&:hover': {
                      backgroundColor: 'var(--primary-hover)',
                    }
                  }
                }
              }}
            />
          </Box>
        </>
      )}
    </Box>
  )
}
