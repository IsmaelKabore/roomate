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

  // Filter state - Initialize with reasonable defaults
  const [priceRange, setPriceRange] = useState<number[]>([0, 5000])
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(5000)
  const [addressFilter, setAddressFilter] = useState<string>('')

  // Pagination state
  const [page, setPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching room posts...')
        
        const raw: RoomPost[] = await getRoomPosts()
        console.log('Fetched rooms:', raw.length, raw)

        if (raw.length === 0) {
          console.log('No room posts found in database')
          setRooms([])
          setLoading(false)
          return
        }

        // Derive a simple locationLabel from the address (text before comma)
        const withLocation = raw.map((p) => ({
          ...p,
          locationLabel: p.address?.split(',')[0]?.trim() || 'Other',
        }))

        // Sort by createdAt descending (most recent first)
        withLocation.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

        // Compute actual min/max price from fetched data
        const validPrices = withLocation
          .map((r) => r.price)
          .filter((p): p is number => typeof p === 'number' && p > 0)
        
        console.log('Valid prices found:', validPrices)

        if (validPrices.length > 0) {
          const derivedMin = Math.min(...validPrices)
          const derivedMax = Math.max(...validPrices)
          console.log('Price range:', derivedMin, 'to', derivedMax)
          
          setMinPrice(derivedMin)
          setMaxPrice(derivedMax)
          setPriceRange([derivedMin, derivedMax])
        } else {
          // No valid prices found, use defaults
          console.log('No valid prices found, using defaults')
          setMinPrice(0)
          setMaxPrice(5000)
          setPriceRange([0, 5000])
        }

        setRooms(withLocation)
        setLoading(false)

        // Load profiles in background after initial render
        loadProfiles(withLocation)
      } catch (error) {
        console.error('Error loading rooms:', error)
        setError('Failed to load room listings. Please try again.')
        setLoading(false)
      }
    }

    loadRooms()
  }, [])

  // Separate function to load profiles asynchronously
  const loadProfiles = async (roomsData: RoomPost[]): Promise<void> => {
    setProfilesLoading(true)
    try {
      console.log('Loading profiles for', roomsData.length, 'rooms')
      
      // Load profiles in batches to avoid overwhelming the system
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

        // Update rooms with the enriched batch
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
    const roomId = [user.uid, room.userId].sort().join('_')
    createRoom(roomId, [user.uid, room.userId]).then(() => {
      router.push(`/messages/${roomId}`)
    })
  }

  // Memoized filtered rooms for better performance
  const filteredRooms = useMemo(() => {
    console.log('Filtering rooms with price range:', priceRange, 'address filter:', addressFilter)
    console.log('All rooms:', rooms.map(r => ({ title: r.title, price: r.price })))
    
    const filtered = rooms.filter((room) => {
      // Price filtering - strict filtering based on slider values
      let matchesPrice = true
      
      if (room.price && typeof room.price === 'number' && room.price > 0) {
        // Room has a valid price - check if it's within the range
        matchesPrice = room.price >= priceRange[0] && room.price <= priceRange[1]
        console.log(`Room "${room.title}" price: $${room.price}, range: $${priceRange[0]}-$${priceRange[1]}, matches: ${matchesPrice}`)
      } else {
        // Room has no price or invalid price - only include if slider starts at minimum possible value
        matchesPrice = priceRange[0] === minPrice
        console.log(`Room "${room.title}" has no price, minPrice: ${minPrice}, range starts at: ${priceRange[0]}, matches: ${matchesPrice}`)
      }
      
      // Address filtering
      const matchesAddress = !addressFilter || 
        room.address?.toLowerCase().includes(addressFilter.toLowerCase()) ||
        room.locationLabel?.toLowerCase().includes(addressFilter.toLowerCase())
      
      const matches = matchesPrice && matchesAddress
      
      console.log(`Room "${room.title}": price=${room.price}, matchesPrice=${matchesPrice}, matchesAddress=${matchesAddress}, finalMatch=${matches}`)
      
      return matches
    })
    
    console.log('Filtered rooms count:', filtered.length, 'out of', rooms.length)
    console.log('Filtered rooms:', filtered.map(r => ({ title: r.title, price: r.price })))
    return filtered
  }, [rooms, priceRange, addressFilter, minPrice])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const startIdx = (page - 1) * itemsPerPage
  const paginatedRooms = filteredRooms.slice(startIdx, startIdx + itemsPerPage)

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle price range change
  const handlePriceRangeChange = (_: Event, newValue: number | number[]) => {
    const range = newValue as number[]
    console.log('Price range changed to:', range)
    setPriceRange(range)
    setPage(1) // Reset to first page when filtering
  }

  // Handle address filter change
  const handleAddressFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFilter(event.target.value)
    setPage(1) // Reset to first page when filtering
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
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: 'var(--primary)', mb: 2 }} />
          <Typography sx={{ color: 'var(--foreground-secondary)' }}>
            Loading room listings...
          </Typography>
        </Box>
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
          background: 'var(--gradient-background)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#ef4444', mb: 2, fontSize: '1.1rem' }}>
            {error}
          </Typography>
          <Button 
            onClick={() => window.location.reload()} 
            sx={{ color: 'var(--primary)' }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    )
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
        Explore Rooms
      </Typography>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)' }}>
            Debug: Total rooms: {rooms.length}, Filtered: {filteredRooms.length}, 
            Price range: ${priceRange[0]}-${priceRange[1]}, Min/Max: ${minPrice}-${maxPrice}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'var(--foreground-secondary)', mt: 1 }}>
            Filter active: {priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 'YES' : 'NO'}, 
            Address filter: "{addressFilter}"
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 4, maxWidth: 1400, mx: 'auto' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 300,
            flexShrink: 0,
            background: 'var(--background-card)',
            borderRadius: '16px',
            p: 3,
            height: 'fit-content',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, color: 'var(--foreground)', fontWeight: 600 }}>
            Filters
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontWeight: 500 }}>
                Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setPriceRange([minPrice, maxPrice])
                  setPage(1)
                }}
                sx={{
                  color: 'var(--primary)',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  px: 1,
                  '&:hover': {
                    background: 'rgba(0, 122, 255, 0.1)',
                  }
                }}
              >
                Reset
              </Button>
            </Box>
            <Slider
              value={priceRange}
              onChange={handlePriceRangeChange}
              min={minPrice}
              max={maxPrice}
              step={25}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              sx={{
                color: 'var(--primary)',
                '& .MuiSlider-thumb': {
                  backgroundColor: 'var(--primary)',
                  border: '2px solid var(--background)',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(0, 122, 255, 0.16)',
                  },
                  '&.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(0, 122, 255, 0.16)',
                  },
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'var(--primary)',
                  height: 4,
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  height: 4,
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.75rem',
                  '&:before': {
                    borderTopColor: 'var(--primary)',
                  },
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)' }}>
                ${minPrice.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)' }}>
                ${maxPrice.toLocaleString()}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'var(--foreground-secondary)', mt: 1, fontStyle: 'italic' }}>
              Showing {filteredRooms.length} of {rooms.length} listings
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ mb: 2, color: 'var(--foreground-secondary)', fontWeight: 500 }}>
              Location
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter location..."
              value={addressFilter}
              onChange={handleAddressFilterChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--background-secondary)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'var(--foreground)',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'var(--foreground-secondary)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {profilesLoading && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'var(--primary)' }} />
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                Loading profiles...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {rooms.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                background: 'var(--background-card)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '1.1rem', mb: 2 }}>
                No room listings available yet.
              </Typography>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                Be the first to create a room listing!
              </Typography>
              <Button
                onClick={() => router.push('/create')}
                sx={{
                  mt: 2,
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'var(--primary-hover)',
                  }
                }}
              >
                Create Listing
              </Button>
            </Box>
          ) : filteredRooms.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                background: 'var(--background-card)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '1.1rem', mb: 2 }}>
                No rooms found matching your criteria.
              </Typography>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                Try adjusting your filters or search terms.
              </Typography>
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
                {paginatedRooms.map((room) => (
                  <Card
                    key={room.id}
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
                      <Carousel images={room.images} />
                      
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <CardHeader
                          avatar={
                            <Avatar
                              src={room.profile?.profilePicture}
                              sx={{ 
                                bgcolor: 'var(--primary)',
                                width: 40,
                                height: 40,
                              }}
                            >
                              {room.profile?.name?.[0] || '?'}
                            </Avatar>
                          }
                          title={
                            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600 }}>
                              {room.profile?.name || 'Anonymous'}
                            </Typography>
                          }
                          subheader={
                            <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                              {room.locationLabel}
                            </Typography>
                          }
                          sx={{ p: 0, mb: 2 }}
                        />

                        <Typography
                          variant="h6"
                          sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}
                        >
                          {room.title}
                        </Typography>

                        <Typography
                          sx={{
                            color: 'var(--foreground-secondary)',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                          }}
                        >
                          {room.description}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          {room.price && (
                            <Typography
                              sx={{
                                color: 'var(--primary)',
                                fontWeight: 700,
                                fontSize: '1.2rem',
                              }}
                            >
                              ${room.price.toLocaleString()}/month
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 2, fontSize: '0.9rem', color: 'var(--foreground-secondary)' }}>
                            {room.bedrooms && <span>{room.bedrooms} bed</span>}
                            {room.bathrooms && <span>{room.bathrooms} bath</span>}
                            {room.sqft && <span>{room.sqft} sqft</span>}
                          </Box>
                        </Box>

                        <Button
                          onClick={() => handleChat(room)}
                          startIcon={<ChatIcon />}
                          className="btn-primary"
                          fullWidth
                          sx={{
                            mt: 'auto',
                            textTransform: 'none',
                            borderRadius: '12px',
                            py: 1.5,
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
                          Contact Owner
                        </Button>
                      </CardContent>
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
    </Box>
  )
}
