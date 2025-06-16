// File: src/app/discover/rooms/page.tsx
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
  Slider,
  TextField,
  IconButton,
  Pagination,
} from '@mui/material'
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

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          flexBasis: '70%',
          background: 'linear-gradient(135deg, #E0F2FE, #FFFFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <Typography sx={{ color: '#475569' }}>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        flexBasis: '70%',
        overflow: 'hidden',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#FFFFFF',
              width: 36,
              height: 36,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#FFFFFF',
              width: 36,
              height: 36,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
            size="small"
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  )
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomPost[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Filter state
  const [priceRange, setPriceRange] = useState<number[]>([0, 1])
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(1)
  const [addressFilter, setAddressFilter] = useState<string>('')

  // Pagination state
  const [page, setPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    ;(async () => {
      const raw: RoomPost[] = await getRoomPosts()

      // Derive a simple locationLabel from the address (text before comma)
      const withLocation = raw.map((p) => ({
        ...p,
        locationLabel: p.address?.split(',')[0]?.trim() || 'Other',
      }))

      // Enrich with profile if available
      const enriched = await Promise.all(
        withLocation.map(async (p) => {
          let profileData:
            | undefined
            | { name?: string; profilePicture?: string; traits?: string[] } = undefined
          try {
            const fetchedProfile = await fetchUserProfile(p.userId)
            profileData = fetchedProfile ? fetchedProfile : undefined
          } catch {
            // ignore
          }
          return { ...p, profile: profileData }
        })
      )

      // Sort by createdAt descending (most recent first)
      enriched.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

      // Compute actual min/max price from fetched data
      const prices = enriched
        .map((r) => (typeof r.price === 'number' ? r.price : 0))
        .filter((p) => p > 0)
      const derivedMin = prices.length ? Math.min(...prices) : 0
      const derivedMax = prices.length ? Math.max(...prices) : derivedMin

      setMinPrice(derivedMin)
      setMaxPrice(derivedMax)
      setPriceRange([derivedMin, derivedMax])
      setRooms(enriched)
      setLoading(false)
    })()
  }, [])

  const handleChat = (room: RoomPost) => {
    const user = auth.currentUser
    if (!user) {
      alert('You must be logged in to chat.')
      return
    }
    const roomId = [user.uid, room.userId].sort().join('_')
    createRoom(roomId, [user.uid, room.userId]).then(() => {
      router.push(`/messages/${roomId}`)
    })
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    )
  }

  // Apply both filters: price + address substring (case‐insensitive)
  const filteredRooms = rooms.filter((r) => {
    // ALLOW posts with no price (undefined) OR those whose price falls within the slider range
    const priceOK =
      typeof r.price !== 'number' ||
      (r.price >= priceRange[0] && r.price <= priceRange[1])

    const addressOK =
      addressFilter.trim() === ''
        ? true
        : r.address
        ? r.address.toLowerCase().includes(addressFilter.trim().toLowerCase())
        : false

    return priceOK && addressOK
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const paginatedRooms = filteredRooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Group by locationLabel
  const groupedByLocation: Record<string, RoomPost[]> = {}
  paginatedRooms.forEach((r) => {
    const key = r.locationLabel || 'Other'
    if (!groupedByLocation[key]) groupedByLocation[key] = []
    groupedByLocation[key].push(r)
  })

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background: '#F3F4F6',
      }}
    >
      {/* ==========================
            1) Left Sidebar (Filters)
         ========================== */}
      <Box
        sx={{
          width: { xs: '100%', sm: 300 },
          flexShrink: 0,
          background: '#1E40AF',
          color: '#FFFFFF',
          px: 3,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, letterSpacing: 1 }}>
          Filters
        </Typography>

        {/* Address Filter (substring search) */}
        <TextField
          label="Location"
          placeholder="e.g. Berkeley"
          fullWidth
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
            '& .MuiInputLabel-root': { color: '#CBD5E1' },
            '& .MuiInputBase-input': { color: '#1E293B', fontWeight: 500 },
            '& .MuiSvgIcon-root': { color: '#3B82F6' },
          }}
        />

        {/* Price Range Slider */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#CBD5E1', mb: 1 }}>
            Price Range
          </Typography>
          <Slider
            value={priceRange}
            onChange={(_, val) => {
              if (Array.isArray(val)) setPriceRange(val)
            }}
            valueLabelDisplay="auto"
            min={minPrice}
            max={maxPrice}
            sx={{
              color: '#93C5FD',
              '& .MuiSlider-thumb': {
                backgroundColor: '#FFFFFF',
                border: '2px solid #3B82F6',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#CBD5E1', fontWeight: 500 }}>
              ${priceRange[0].toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#CBD5E1', fontWeight: 500 }}>
              ${priceRange[1].toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Apply Button */}
        <Button
          variant="contained"
          sx={{
            mt: 'auto',
            bgcolor: '#3B82F6',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#2563EB' },
          }}
          onClick={() => {
            // Real-time filtering, so no extra logic
          }}
        >
          Apply
        </Button>
      </Box>

      {/* ==========================
            2) Right Content Area (Listings)
         ========================== */}
      <Box
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 4 },
          py: 4,
          overflowY: 'auto',
        }}
      >
        {Object.entries(groupedByLocation).map(([location, roomsInLocation]) => (
          <Box key={location} sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontWeight: 700,
                color: '#1E40AF',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {location}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr',
                  md: '1fr',
                },
                gap: 4,
              }}
            >
              {roomsInLocation.map((room) => (
                <Card
                  key={room.id}
                  sx={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 20px rgba(100,116,139,0.15)',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    height: 620,
                  }}
                >
                  {/* --- Profile Header --- */}
                  <CardHeader
                    avatar={
                      <Avatar
                        src={room.profile?.profilePicture}
                        alt={room.profile?.name || 'User'}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (!auth.currentUser) {
                            alert('You must be logged in to view profiles.')
                          } else {
                            router.push(`/profile/${room.userId}`)
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
                              router.push(`/profile/${room.userId}`)
                            }
                          }}
                        >
                          {room.profile?.name || 'Unknown User'}
                        </Typography>
                        {auth.currentUser && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => router.push(`/profile/${room.userId}`)}
                            sx={{ textTransform: 'none' }}
                          >
                            View Profile
                          </Button>
                        )}
                      </Box>
                    }
                    subheader={(room.profile?.traits || []).slice(0, 2).join(', ')}
                    sx={{ px: 2, py: 1 }}
                  />

                  {/* --- Image Carousel --- */}
                  <Carousel images={room.images} />

                  {/* --- Content Area --- */}
                  <CardContent
                    sx={{
                      flexBasis: '30%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      px: 3,
                      py: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          color: '#1E40AF',
                          letterSpacing: 0.5,
                          lineHeight: 1.2,
                          maxHeight: '2.8em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          display: '-webkit-box',
                        }}
                      >
                        {room.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: '#334155',
                          fontStyle: 'italic',
                          lineHeight: 1.3,
                          maxHeight: '3.9em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          display: '-webkit-box',
                        }}
                      >
                        {room.description}
                      </Typography>
                      {room.address && (
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            color: '#64748B',
                            mb: 1,
                            fontWeight: 500,
                          }}
                        >
                          {room.address}
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        {typeof room.price === 'number' && (
                          <Typography sx={{ color: '#3B82F6', fontWeight: 700 }}>
                            ${room.price.toLocaleString()}/mo
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {room.bedrooms != null && (
                            <Typography sx={{ fontSize: '0.875rem', color: '#4B5563' }}>
                              🛏 {room.bedrooms}
                            </Typography>
                          )}
                          {room.bathrooms != null && (
                            <Typography sx={{ fontSize: '0.875rem', color: '#4B5563' }}>
                              🛁 {room.bathrooms}
                            </Typography>
                          )}
                          {room.sqft != null && (
                            <Typography sx={{ fontSize: '0.875rem', color: '#4B5563' }}>
                              📐 {room.sqft} sqft
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<ChatIcon />}
                          onClick={() => handleChat(room)}
                          sx={{
                            color: '#FFFFFF',
                            bgcolor: '#3B82F6',
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                            '&:hover': {
                              bgcolor: '#2563EB',
                              boxShadow: '0 6px 18px rgba(59,130,246,0.4)',
                            },
                          }}
                        >
                          Contact
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ))}

        {/* ============ Pagination Controls ============ */}
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
      </Box>
    </Box>
  )
}
