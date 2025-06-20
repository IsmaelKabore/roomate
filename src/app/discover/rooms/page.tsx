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
                transform: 'translateY(-50%) scale(1.1)',
              },
              transition: 'all 0.2s ease',
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
                transform: 'translateY(-50%) scale(1.1)',
              },
              transition: 'all 0.2s ease',
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

  // Filter rooms based on price range and address
  const filteredRooms = rooms.filter((room) => {
    const roomPrice = room.price || 0
    const matchesPrice = roomPrice >= priceRange[0] && roomPrice <= priceRange[1]
    const matchesAddress = addressFilter
      ? room.address?.toLowerCase().includes(addressFilter.toLowerCase())
      : true
    return matchesPrice && matchesAddress
  })

  // Group by location
  const groupedByLocation = filteredRooms.reduce((acc, room) => {
    const location = room.locationLabel || 'Other'
    if (!acc[location]) acc[location] = []
    acc[location].push(room)
    return acc
  }, {} as Record<string, RoomPost[]>)

  // Calculate pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const startIdx = (page - 1) * itemsPerPage
  const paginatedRooms = filteredRooms.slice(startIdx, startIdx + itemsPerPage)

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
        background: 'var(--gradient-background)',
      }}
    >
      {/* ==========================
            1) Left Sidebar (Filters)
         ========================== */}
      <Box
        className="dark-card"
        sx={{
          width: { xs: '100%', sm: 300 },
          flexShrink: 0,
          background: 'var(--background-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          px: 3,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 1, 
            fontWeight: 700, 
            letterSpacing: 1,
            color: 'var(--foreground)',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
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
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--foreground)',
              borderRadius: '12px',
              '& fieldset': {
                borderColor: 'var(--border)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--primary)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--primary)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'var(--foreground-secondary)',
              '&.Mui-focused': {
                color: 'var(--primary)',
              }
            },
          }}
        />

        {/* Price Range Slider */}
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'var(--foreground)', 
              mb: 1, 
              fontWeight: 600 
            }}
          >
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
              color: 'var(--primary)',
              '& .MuiSlider-thumb': {
                backgroundColor: 'var(--foreground)',
                border: '2px solid var(--primary)',
                boxShadow: 'var(--shadow-blue)',
                '&:hover': {
                  boxShadow: 'var(--glow-blue)',
                }
              },
              '& .MuiSlider-track': {
                backgroundColor: 'var(--primary)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--border)',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography sx={{ fontSize: '0.875rem', color: 'var(--foreground-secondary)', fontWeight: 500 }}>
              ${priceRange[0].toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'var(--foreground-secondary)', fontWeight: 500 }}>
              ${priceRange[1].toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Apply Button */}
        <Button
          variant="contained"
          className="btn-primary"
          sx={{
            mt: 'auto',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            padding: '12px 24px',
          }}
          onClick={() => {
            // Real-time filtering, so no extra logic
          }}
        >
          Apply Filters
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
        {Object.keys(groupedByLocation).length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '1.2rem' }}>
              No rooms found matching your criteria.
            </Typography>
          </Box>
        ) : (
          <>
            {Object.entries(groupedByLocation).map(([location, roomsInLocation]) => (
              <Box key={location} sx={{ mb: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    color: 'var(--primary)',
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
                      className="dark-card scale-on-hover"
                      sx={{
                        backgroundColor: 'var(--background-card)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-dark)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 'var(--shadow-blue-hover)',
                          border: '1px solid var(--primary)',
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
                            src={room.profile?.profilePicture || ''}
                            sx={{ 
                              cursor: 'pointer',
                              backgroundColor: 'var(--primary)',
                              color: 'var(--foreground)',
                              border: '2px solid var(--border)',
                            }}
                            onClick={() => {
                              if (!auth.currentUser) {
                                alert('You must be logged in to view profiles.')
                              } else {
                                router.push(`/profile/${room.userId}`)
                              }
                            }}
                          >
                            {room.profile?.name?.[0] || '?'}
                          </Avatar>
                        }
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ 
                                cursor: 'pointer', 
                                fontWeight: 600,
                                color: 'var(--foreground)',
                                '&:hover': {
                                  color: 'var(--primary)',
                                },
                                transition: 'color 0.2s ease',
                              }}
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
                                sx={{ 
                                  textTransform: 'none',
                                  color: 'var(--primary)',
                                  borderColor: 'var(--primary)',
                                  '&:hover': {
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--foreground)',
                                  }
                                }}
                              >
                                View Profile
                              </Button>
                            )}
                          </Box>
                        }
                        subheader={
                          <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                            {(room.profile?.traits || []).slice(0, 2).join(', ') || 'No traits listed'}
                          </Typography>
                        }
                        sx={{ 
                          px: 2, 
                          py: 1,
                          backgroundColor: 'var(--background-secondary)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      />

                      {/* --- Image Carousel --- */}
                      <Carousel images={room.images} />

                      {/* --- Content Area --- */}
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          p: 3,
                        }}
                      >
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              mb: 1,
                            }}
                          >
                            {room.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'var(--foreground-secondary)',
                              lineHeight: 1.6,
                              mb: 2,
                            }}
                          >
                            {room.description}
                          </Typography>
                        </Box>

                        {/* Room Details */}
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: 'var(--primary)',
                              mb: 1,
                            }}
                          >
                            ${room.price?.toLocaleString() || 'N/A'}/month
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'var(--foreground-secondary)',
                              mb: 1,
                            }}
                          >
                            📍 {room.address || 'Address not provided'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {room.bedrooms && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--foreground-secondary)',
                                  backgroundColor: 'var(--background-secondary)',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                🛏️ {room.bedrooms} bed{room.bedrooms > 1 ? 's' : ''}
                              </Typography>
                            )}
                            {room.bathrooms && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--foreground-secondary)',
                                  backgroundColor: 'var(--background-secondary)',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                🚿 {room.bathrooms} bath{room.bathrooms > 1 ? 's' : ''}
                              </Typography>
                            )}
                            {room.sqft && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--foreground-secondary)',
                                  backgroundColor: 'var(--background-secondary)',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                📐 {room.sqft} sqft
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Action Button */}
                        <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                          <Button
                            variant="contained"
                            startIcon={<ChatIcon />}
                            onClick={() => handleChat(room)}
                            className="btn-primary"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: '12px',
                              px: 3,
                            }}
                          >
                            Contact
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
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
    </Box>
  )
}
