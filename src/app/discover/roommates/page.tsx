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
  IconButton,
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

// Updated Carousel: always a square, image covers it
function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: '1 / 1',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        backgroundColor: '#f0f0f0',
      }}
    >
      {images && images.length > 0 ? (
        <>
          <Box
            component="img"
            src={images[current]}
            alt={`slide-${current}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {images.length > 1 && (
            <>
              <IconButton
                onClick={prev}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 8,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                }}
              >
                <ArrowBackIos fontSize="inherit" />
              </IconButton>
              <IconButton
                onClick={next}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 8,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                }}
              >
                <ArrowForwardIos fontSize="inherit" />
              </IconButton>
            </>
          )}
        </>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="textSecondary">No Image</Typography>
        </Box>
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
      const raw = await getRoommatePosts()
      const enriched = await Promise.all(
        raw.map(async (p) => {
          let profileData
          try {
            profileData = (await fetchUserProfile(p.userId)) || undefined
          } catch {
            profileData = undefined
          }
          return { ...p, profile: profileData }
        })
      )
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
    createRoom(roomId, [user.uid, post.userId]).then(() =>
      router.push(`/messages/${roomId}`)
    )
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const totalPages = Math.ceil(posts.length / itemsPerPage)
  const paginated = posts.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <Box
      sx={{
        minHeight: '200vh',
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
        px: 6,
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      {paginated.map((person) => (
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
                  if (!auth.currentUser) alert('Log in to view profiles.')
                  else router.push(`/profile/${person.userId}`)
                }}
              />
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    if (!auth.currentUser) alert('Log in to view profiles.')
                    else router.push(`/profile/${person.userId}`)
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
            <Typography sx={{ fontSize: '0.9rem' }}>
              {person.description}
            </Typography>
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
            onChange={(_, v) => {
              setPage(v)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}
