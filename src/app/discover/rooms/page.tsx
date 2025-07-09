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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { ArrowBackIosNew, ArrowForwardIos, Chat as ChatIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { getRoomPosts } from '@/lib/firestorePosts'
import { fetchUserProfile, type UserProfile } from '@/lib/firestoreProfile'
import { auth } from '@/lib/firebaseConfig'
import { createRoom } from '@/lib/firestoreMessages'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
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
  profile: UserProfile | null
}

const Carousel = React.memo(({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          flexBasis: '70%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Typography sx={{ color: '#000000' }}>No Image</Typography>
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
        loading="lazy"
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
              color: '#ffffff',
              width: 40,
              height: 40,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
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
              color: '#ffffff',
              width: 40,
              height: 40,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
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
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  const [rooms, setRooms] = useState<RoomPost[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sortBy, setSortBy] = useState('createdAt_desc')
  const [addressFilter, setAddressFilter] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)
        const raw = await getRoomPosts()
        if (raw.length === 0) {
          setRooms([])
          setLoading(false)
          return
        }
        const withLocation = raw.map(p => ({
          ...p,
          locationLabel: p.address?.split(',')[0]?.trim() || 'Other',
          profile: null as UserProfile | null,
        }))
        setRooms(withLocation)
        setLoading(false)
        loadProfiles(withLocation)
      } catch (err) {
        console.error(err)
        setError('Failed to load room listings.')
        setLoading(false)
      }
    }
    loadRooms()
  }, [])

  const loadProfiles = async (roomsData: RoomPost[]) => {
    setProfilesLoading(true)
    try {
      const batchSize = 5
      for (let i = 0; i < roomsData.length; i += batchSize) {
        const batch = roomsData.slice(i, i + batchSize)
        const enriched = await Promise.all(batch.map(async p => {
          let prof: UserProfile | null = null
          try {
            prof = await fetchUserProfile(p.userId)
          } catch { /* ignore */ }
          return { ...p, profile: prof }
        }))
        setRooms(prev =>
          prev.map(r => enriched.find(e => e.id === r.id) || r)
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProfilesLoading(false)
    }
  }

  const handleChat = (room: RoomPost) => {
    const user = auth.currentUser
    if (!user) return alert('You must be logged in to chat.')
    const roomId = [user.uid, room.userId].sort().join('_')
    createRoom(roomId, [user.uid, room.userId])
      .then(() => router.push(`/messages/${roomId}`))
      .catch(() => alert('Failed to create chat room.'))
  }

  const filteredAndSortedRooms = useMemo(() => {
    let result = rooms.filter(r =>
      !addressFilter ||
      r.address?.toLowerCase().includes(addressFilter.toLowerCase()) ||
      r.locationLabel?.toLowerCase().includes(addressFilter.toLowerCase())
    )
    if (sortBy === 'price_desc')
      result.sort((a, b) => (b.price || 0) - (a.price || 0))
    else if (sortBy === 'price_asc')
      result.sort((a, b) => (a.price || 0) - (b.price || 0))
    else
      result.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return result
  }, [rooms, addressFilter, sortBy])

  const totalPages = Math.ceil(filteredAndSortedRooms.length / itemsPerPage)
  const paginatedRooms = filteredAndSortedRooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handlePageChange = (_: unknown, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleSortChange = (e: SelectChangeEvent) => {
    setSortBy(e.target.value)
    setPage(1)
  }
  const handleAddressFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFilter(e.target.value)
    setPage(1)
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
  if (error) {
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
        <Typography sx={{ color: '#000000' }}>{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff', color: '#000000', p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: '#000000' }}>
        Explore Rooms
      </Typography>

      {isMobile && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setFilterDialogOpen(true)}
              sx={{
                background: '#3b82f6',
                color: '#ffffff',
                '&:hover': { background: '#2563eb' },
              }}
            >
              Filter
            </Button>
          </Box>
          <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth>
            <DialogTitle sx={{ color: '#000000' }}>Filters &amp; Sort</DialogTitle>
            <DialogContent sx={{ background: '#f9fafb' }}>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{
                  mb: 3,
                  background: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000000' },
                  '& .MuiOutlinedInput-root': { color: '#000000' },
                  '& .MuiInputLabel-root': { color: '#000000' },
                  '& .MuiSelect-icon': { color: '#000000' },
                }}
              >
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
                  <MenuItem value="createdAt_desc">Most Recent</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                </Select>
              </FormControl>
              <Box>
                <Typography sx={{ mb: 1, color: '#000000' }}>Location</Typography>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Enter location..."
                  value={addressFilter}
                  onChange={handleAddressFilterChange}
                  sx={{
                    background: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000000' },
                    '& .MuiInputBase-input': {
                      color: '#000000',
                      '::placeholder': { color: '#000000', opacity: 1 },
                    },
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFilterDialogOpen(false)} sx={{ color: '#000000' }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 4,
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        {!isMobile && (
          <Box
            sx={{
              width: 300,
              flexShrink: 0,
              background: '#f9fafb',
              border: '1px solid #ccc',
              borderRadius: 2,
              p: 3,
              height: 'fit-content',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: '#000000' }}>
              Filters &amp; Sort
            </Typography>
            <FormControl
              fullWidth
              variant="outlined"
              sx={{
                mb: 4,
                background: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000000' },
                '& .MuiOutlinedInput-root': { color: '#000000' },
                '& .MuiInputLabel-root': { color: '#000000' },
                '& .MuiSelect-icon': { color: '#000000' },
              }}
            >
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
                <MenuItem value="createdAt_desc">Most Recent</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography sx={{ mb: 1, color: '#000000' }}>Location</Typography>
              <TextField
                variant="outlined"
                fullWidth
                placeholder="Enter location..."
                value={addressFilter}
                onChange={handleAddressFilterChange}
                sx={{
                  background: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000000' },
                  '& .MuiInputBase-input': {
                    color: '#000000',
                    '::placeholder': { color: '#000000', opacity: 1 },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        <Box sx={{ flex: 1 }}>
          {paginatedRooms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: '#000000' }}>No rooms found matching your criteria.</Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: 3,
                  mb: 4,
                }}
              >
                {paginatedRooms.map(room => (
                  <Card
                    key={room.id}
                    sx={{
                      background: '#ffffff',
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
                      <Carousel images={room.images} />
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <CardHeader
                          avatar={<Avatar src={room.profile?.profilePicture || undefined} />}
                          title={room.profile?.name || 'Anonymous'}
                          subheader={room.locationLabel}
                          sx={{ p: 0, mb: 2, color: '#000000' }}
                        />
                        <Typography variant="h6" sx={{ mb: 1, color: '#000000' }}>
                          {room.title}
                        </Typography>
                        <Typography
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            color: '#000000',
                          }}
                        >
                          {room.description}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          {room.price && (
                            <Typography sx={{ color: '#000000' }}>
                              ${room.price.toLocaleString()}/month
                            </Typography>
                          )}
                          <Button
                            onClick={() => handleChat(room)}
                            startIcon={<ChatIcon />}
                            variant="contained"
                            sx={{
                              background: '#3b82f6',
                              color: '#ffffff',
                              '&:hover': { background: '#2563eb' },
                            }}
                          >
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
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    sx={{ '& .MuiPaginationItem-root': { color: '#000000' } }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
