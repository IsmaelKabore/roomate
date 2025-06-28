// File: src/app/discover/rooms/page.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { ArrowBackIosNew, ArrowForwardIos, Chat as ChatIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { getRoomPosts } from '@/lib/firestorePosts'
import { fetchUserProfile } from '@/lib/firestoreProfile'
import { auth } from '@/lib/firebaseConfig'
import { createRoom } from '@/lib/firestoreMessages'
import type { Timestamp } from 'firebase/firestore'

type RoomPost = {
  id: string
  userId: string
  title: string
  description: string
  price?: number
  address?: string
  locationLabel?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number
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
          flexBasis: '70%',
          background: 'var(--background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Typography sx={{ color: 'var(--foreground-secondary)' }}>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        flexBasis: '70%',
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
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
        }}
        loading="lazy" // Add lazy loading for images
      />
      {images.length > 1 && (
        <>
          <IconButton
            onClick={prev}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 12,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'var(--foreground)',
              width: 40,
              height: 40,
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              transition: 'background-color 0.2s ease',
            }}
            size="small"
          >
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <IconButton
            onClick={next}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 12,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'var(--foreground)',
              width: 40,
              height: 40,
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              transition: 'background-color 0.2s ease',
            }}
            size="small"
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  )
})

Carousel.displayName = 'Carousel'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomPost[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [sortBy, setSortBy] = useState('createdAt_desc') // Initial sort

  // Filter state
  const [addressFilter, setAddressFilter] = useState<string>('')

  // Pagination state
  const [page, setPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const raw: RoomPost[] = await getRoomPosts()

        if (raw.length === 0) {
          setRooms([])
          setLoading(false)
          return
        }

        const withLocation = raw.map((p) => ({
          ...p,
          locationLabel: p.address?.split(',')[0]?.trim() || 'Other',
        }))

        setRooms(withLocation)
        setLoading(false)

        loadProfiles(withLocation)
      } catch (error) {
        console.error('Error loading rooms:', error)
        setError('Failed to load room listings. Please try again.')
        setLoading(false)
      }
    }

    loadRooms()
  }, [])

  const loadProfiles = async (roomsData: RoomPost[]): Promise<void> => {
    setProfilesLoading(true)
    try {
      const batchSize = 5
      const batches: RoomPost[][] = []
      for (let i = 0; i < roomsData.length; i += batchSize) {
        batches.push(roomsData.slice(i, i + batchSize))
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
            } catch (err) {
              console.warn('Failed to fetch profile for user:', p.userId, err)
            }
            return { ...p, profile: profileData }
          })
        )

        setRooms(prevRooms => 
          prevRooms.map(room => {
            const enriched = enrichedBatch.find(er => er.id === room.id)
            return enriched ? enriched : room
          })
        )
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setProfilesLoading(false)
    }
  }

  const handleChat = (room: RoomPost) => {
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
    
    if (!room.userId) {
      console.error('Room userId is missing:', room)
      alert('Invalid room data. Please try again.')
      return
    }
    
    console.log('Creating chat room between:', user.uid, 'and', room.userId)
    const roomId = [user.uid, room.userId].sort().join('_')
    console.log('Generated room ID:', roomId)
    
    createRoom(roomId, [user.uid, room.userId])
      .then(() => {
        console.log('Room created successfully, navigating to:', `/messages/${roomId}`)
        router.push(`/messages/${roomId}`)
      })
      .catch((error) => {
        console.error('Error creating room:', error)
        alert('Failed to create chat room. Please try again.')
      })
  }

  const filteredAndSortedRooms = useMemo(() => {
    let result = rooms.filter((room) => {
      if (!addressFilter) return true
      return room.address?.toLowerCase().includes(addressFilter.toLowerCase()) ||
             room.locationLabel?.toLowerCase().includes(addressFilter.toLowerCase())
    })

    if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else {
      result.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    }

    return result
  }, [rooms, addressFilter, sortBy])

  const totalPages = Math.ceil(filteredAndSortedRooms.length / itemsPerPage)
  const paginatedRooms = filteredAndSortedRooms.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as string)
    setPage(1)
  }

  const handleAddressFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFilter(event.target.value)
    setPage(1)
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--gradient-background)', color: 'var(--foreground)', p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Explore Rooms
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ width: 300, flexShrink: 0, background: 'var(--background-card)', borderRadius: '16px', p: 3, height: 'fit-content' }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Filters & Sort</Typography>

          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
              <MenuItem value="createdAt_desc">Most Recent</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography sx={{ mb: 2 }}>Location</Typography>
            <TextField
              fullWidth
              placeholder="Enter location..."
              value={addressFilter}
              onChange={handleAddressFilterChange}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          {paginatedRooms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography>No rooms found matching your criteria.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 3, mb: 4 }}>
                {paginatedRooms.map((room) => (
                  <Card key={room.id} sx={{ background: 'var(--background-card)', borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
                      <Carousel images={room.images} />
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <CardHeader
                          avatar={<Avatar src={room.profile?.profilePicture} />}
                          title={room.profile?.name || 'Anonymous'}
                          subheader={room.locationLabel}
                          sx={{ p: 0, mb: 2 }}
                        />
                        <Typography variant="h6" sx={{ mb: 1 }}>{room.title}</Typography>
                        <Typography sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {room.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          {room.price && <Typography>${room.price.toLocaleString()}/month</Typography>}
                          <Button onClick={() => handleChat(room)} startIcon={<ChatIcon />}>
                            Contact Owner
                          </Button>
                        </Box>
                      </CardContent>
                    </Box>
                  </Card>
                ))}
              </Box>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination count={totalPages} page={page} onChange={handlePageChange} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
