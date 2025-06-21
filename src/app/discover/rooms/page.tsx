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
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@mui/material'
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  Chat as ChatIcon,
} from '@mui/icons-material'
import BedIcon from '@mui/icons-material/Bed'
import BathtubIcon from '@mui/icons-material/Bathtub'
import { useRouter } from 'next/navigation'
import { getRoomPosts, RoomPost } from '@/lib/firestorePosts'
import { fetchUserProfile } from '@/lib/firestoreProfile'
import { auth } from '@/lib/firebaseConfig'
import { createRoom } from '@/lib/firestoreMessages'

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  if (!images.length) {
    return (
      <Box
        sx={{
          width: '100%',
          height: { xs: 200, md: '100%' },
          background: 'linear-gradient(135deg, #E0F2FE, #FFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
        }}
      >
        <Typography>No Image</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 200, md: '100%' },
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      <Box
        component="img"
        src={images[current]}
        alt={`slide-${current}`}
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <ArrowBackIosNew fontSize="inherit" />
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
    </Box>
  )
}

export default function RoomsPage() {
  type RoomWithProfile = RoomPost & { profile?: Awaited<ReturnType<typeof fetchUserProfile>> }
  const [rooms, setRooms] = useState<RoomWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // ─── Filters ─────────────────────────────────
  const [addressFilter, setAddressFilter] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [bedroomsFilter, setBedroomsFilter] = useState(0)
  const [bathroomsFilter, setBathroomsFilter] = useState(0)
  const [furnishedOnly, setFurnishedOnly] = useState(false)

  // ─── Pagination ───────────────────────────────
  const [page, setPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    ;(async () => {
      const raw = await getRoomPosts()
      // attach profile & sort
      const withProfile = await Promise.all(
        raw.map(async (p) => {
          let profile
          try {
            profile = await fetchUserProfile(p.userId)
          } catch {
            profile = undefined
          }
          return { ...p, profile }
        })
      )
      withProfile.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

      // derive slider bounds
      const prices = withProfile.map(r => r.price ?? 0).filter(p => p > 0)
      const low = prices.length ? Math.min(...prices) : 0
      const high = prices.length ? Math.max(...prices) : 0
      setMinPrice(low)
      setMaxPrice(high)
      setPriceRange([low, high])

      setRooms(withProfile)
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
    createRoom(roomId, [user.uid, room.userId]).then(() =>
      router.push(`/messages/${roomId}`)
    )
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
        <CircularProgress color="primary" />
      </Box>
    )
  }

  // ─── Apply filters ────────────────────────────
  const filtered = rooms.filter((r) => {
    const priceOK =
      r.price == null ||
      (r.price >= priceRange[0] && r.price <= priceRange[1])
    const locOK =
      !addressFilter ||
      (r.address?.toLowerCase() || '').includes(addressFilter.toLowerCase())
    const bedOK =
      bedroomsFilter === 0 || (r.bedrooms ?? 0) >= bedroomsFilter
    const bathOK =
      bathroomsFilter === 0 || (r.bathrooms ?? 0) >= bathroomsFilter
    const furOK = !furnishedOnly || r.furnished === true

    return priceOK && locOK && bedOK && bathOK && furOK
  })

  // ─── Paginate ────────────────────────────────
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paged = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#F3F4F6' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: '100%', sm: 300 },
          flexShrink: 0,
          bgcolor: '#1E40AF',
          color: '#FFF',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          height: '100vh',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Filters</Typography>

        {/* Location */}
        <TextField
          label="Location"
          fullWidth
          value={addressFilter}
          onChange={e => { setAddressFilter(e.target.value); setPage(1) }}
          sx={{
            bgcolor: '#FFF',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
            '& .MuiInputLabel-root': { color: '#CBD5E1' },
            '& .MuiInputBase-input': { color: '#1E293B' },
            '& .MuiSvgIcon-root': { color: '#3B82F6' },
          }}
        />

        {/* Price */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#CBD5E1' }}>Price Range</Typography>
          <Slider
            value={priceRange}
            onChange={(_, v) => {
              if (Array.isArray(v)) {
                setPriceRange([v[0], v[1]])
                setPage(1)
              }
            }}
            min={minPrice}
            max={maxPrice}
            valueLabelDisplay="auto"
            sx={{
              color: '#93C5FD',
              '& .MuiSlider-thumb': { bgcolor: '#FFF', border: '2px solid #3B82F6' },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#CBD5E1' }}>${priceRange[0]}</Typography>
            <Typography sx={{ color: '#CBD5E1' }}>${priceRange[1]}</Typography>
          </Box>
        </Box>

        {/* Bedrooms */}
        <TextField
          select
          label="Min Bedrooms"
          fullWidth
          value={bedroomsFilter}
          onChange={e => { setBedroomsFilter(Number(e.target.value)); setPage(1) }}
          sx={{ bgcolor: '#FFF', borderRadius: 1 }}
        >
          <MenuItem value={0}>Any</MenuItem>
          {[1, 2, 3, 4, 5].map(n => (
            <MenuItem key={n} value={n}>{n}+ beds</MenuItem>
          ))}
        </TextField>

        {/* Bathrooms */}
        <TextField
          select
          label="Min Bathrooms"
          fullWidth
          value={bathroomsFilter}
          onChange={e => { setBathroomsFilter(Number(e.target.value)); setPage(1) }}
          sx={{ bgcolor: '#FFF', borderRadius: 1 }}
        >
          <MenuItem value={0}>Any</MenuItem>
          {[1, 2, 3, 4].map(n => (
            <MenuItem key={n} value={n}>{n}+ baths</MenuItem>
          ))}
        </TextField>

        {/* Furnished */}
        <FormControlLabel
          control={
            <Checkbox
              checked={furnishedOnly}
              onChange={(_, v) => { setFurnishedOnly(v); setPage(1) }}
              sx={{ color: '#FFF', '&.Mui-checked': { color: '#3B82F6' } }}
            />
          }
          label="Furnished only"
        />
      </Box>

      {/* Listings */}
      <Box sx={{ flexGrow: 1, px: { xs: 2, sm: 4 }, py: 4, overflowY: 'auto' }}>
        {paged.map(room => (
          <Card
            key={room.id}
            sx={{
              maxWidth: 900,
              mx: 'auto',
              mb: 4,
              bgcolor: '#FFF',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              },
            }}
          >
            <CardHeader
              avatar={
                <Avatar
                  src={room.profile?.profilePicture}
                  alt={room.profile?.name}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!auth.currentUser) alert('Log in to view profiles.')
                    else router.push(`/profile/${room.userId}`)
                  }}
                />
              }
              title={
                <Typography
                  variant="subtitle1"
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    if (!auth.currentUser) alert('Log in to view profiles.')
                    else router.push(`/profile/${room.userId}`)
                  }}
                >
                  {room.profile?.name || 'Unknown'}
                </Typography>
              }
              subheader={Array.isArray((room.profile as any)?.interests) ? (room.profile as any).interests.slice(0, 2).join(', ') : ''}
              sx={{ px: 2, py: 1 }}
            />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flexBasis: { xs: '100%', md: '40%' }, p: 2 }}>
                <Carousel images={room.images} />
              </Box>
              <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1E40AF' }}>
                    {room.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: '#334155',
                      lineHeight: 1.4,
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
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {room.address}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                    ${room.price?.toLocaleString()}/mo
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    {room.bedrooms != null && (
                      <Typography
                        variant="subtitle2"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#4B5563',
                        }}
                      >
                        <BedIcon fontSize="small" /> {room.bedrooms}
                      </Typography>
                    )}
                    {room.bathrooms != null && (
                      <Typography
                        variant="subtitle2"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#4B5563',
                        }}
                      >
                        <BathtubIcon fontSize="small" /> {room.bathrooms}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => handleChat(room)}
                    sx={{
                      color: '#FFF',
                      bgcolor: '#3B82F6',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#2563EB' },
                    }}
                  >
                    Contact
                  </Button>
                </Box>
              </CardContent>
            </Box>
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
    </Box>
  )
}
