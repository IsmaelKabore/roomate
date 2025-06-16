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
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', height: 300, overflow: 'hidden' }}>
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
              backgroundColor: 'rgba(255,255,255,0.7)',
              minWidth: '32px',
              p: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
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
              backgroundColor: 'rgba(255,255,255,0.7)',
              minWidth: '32px',
              p: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
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
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <CircularProgress />
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
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
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
        <Typography>No roommate posts found.</Typography>
      ) : (
        <>
          {paginatedPosts.map((person) => (
            <Card
              key={person.id}
              sx={{
                backgroundColor: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 8px 20px rgba(100,116,139,0.2)',
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    src={person.profile?.profilePicture}
                    alt={person.profile?.name || 'User'}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (!auth.currentUser) {
                        alert('You must be logged in to view profiles.')
                      } else {
                        router.push(`/profile/${person.userId}`)
                      }
                    }}
                  />
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
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
                    {auth.currentUser && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(`/profile/${person.userId}`)}
                        sx={{ textTransform: 'none' }}
                      >
                        View Profile
                      </Button>
                    )}
                  </Box>
                }
                subheader={(person.profile?.traits || []).slice(0, 2).join(', ')}
              />

              <Carousel images={person.images} />

              <CardContent>
                <Typography sx={{ fontSize: '0.9rem' }}>{person.description}</Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => handleChat(person)}
                    sx={{
                      color: '#4f46e5',
                      borderColor: '#4f46e5',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: '#eef2ff',
                      },
                    }}
                  >
                    Contact
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
