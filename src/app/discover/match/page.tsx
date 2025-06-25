// File: src/app/discover/match/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  TuneRounded as FilterIcon,
  InfoOutlined as InfoIcon,
  AutoAwesome as AIIcon,
  Chat as ChatIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebaseConfig'
import { createRoom } from '@/lib/firestoreMessages'
import type { StructuredFilters } from '@/lib/types'

type ListingType = 'room' | 'roommate'

interface MatchResult {
  id: string
  title: string
  description: string
  price?: number
  address?: string
  images: string[]
  type: 'room' | 'roommate'
  structuredScore: number
  semanticScore: number
  combinedScore: number
  explanation: string
  userId: string
}

export default function MatchesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchType, setSearchType] = useState<ListingType>('room')
  const [activeStep, setActiveStep] = useState(0)

  // Free‐text
  const [description, setDescription] = useState('')

  // Manual Filters (fallback)
  const [budget, setBudget] = useState<[number, number]>([500, 1500])
  const [bedrooms, setBedrooms] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [furnished, setFurnished] = useState(false)

  // AI Parsed preferences display
  const [aiPreferences, setAiPreferences] = useState<{
    bedrooms: number | null
    budgetMax: number | null
    furnished: boolean | null
  } | null>(null)

  // Geolocation
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  })
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading')

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => {
        console.warn('Geo denied, using default')
        setLocationStatus('denied')
      }
    )
  }, [])

  // Results
  const [isSearching, setIsSearching] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      if (u) setUserId(u.uid)
      else router.replace('/auth/login')
      setCheckingAuth(false)
    })
    return () => unsub()
  }, [router])

  if (checkingAuth || !userId) {
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
            Loading intelligent matching...
          </Typography>
        </Box>
      </Box>
    )
  }

  const handleSearch = async () => {
    if (!description.trim()) {
      setError('Please describe what you\'re looking for!')
      return
    }
    setError(null)
    setIsSearching(true)
    setActiveStep(1)

    // 1) Call the AI to parse out bedrooms/budgetMax/furnished
    let aiPrefs = { bedrooms: null as number | null, budgetMax: null as number | null, furnished: null as boolean | null }
    try {
      const p = await fetch('/api/parsePreferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      })
      if (p.ok) {
        const json = await p.json()
        aiPrefs = {
          bedrooms:  typeof json.bedrooms  === 'number' ? json.bedrooms  : null,
          budgetMax: typeof json.budgetMax === 'number' ? json.budgetMax : null,
          furnished: typeof json.furnished === 'boolean' ? json.furnished : null,
        }
        setAiPreferences(aiPrefs)
      }
    } catch (e) {
      console.warn('parsePreferences failed, using manual values', e)
    }

    // 2) Build your filters, merging AI + manual defaults
    const structuredFilters: StructuredFilters = {
      budgetMin:      budget[0],
      budgetMax:      aiPrefs.budgetMax ?? budget[1],
      location,
      locationRadiusKm: 10,
      bedrooms:       aiPrefs.bedrooms  ?? bedrooms,
      bathrooms:      bathrooms,
      furnished:      aiPrefs.furnished ?? furnished,
    }

    setActiveStep(2)

    // 3) Call your existing matches API
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          searchType,
          description: description.trim(),
          structuredFilters,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Server error')
      setMatches(body.matches)
      setActiveStep(3)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
      setMatches([])
      setActiveStep(0)
    } finally {
      setIsSearching(false)
    }
  }

  const handleChat = async (match: MatchResult) => {
    const user = auth.currentUser
    if (!user) {
      alert('You must be logged in to chat.')
      return
    }
    const roomId = [user.uid, match.userId].sort().join('_')
    await createRoom(roomId, [user.uid, match.userId])
    router.push(`/messages/${roomId}`)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#22c55e' // green
    if (score >= 0.6) return '#eab308' // yellow
    if (score >= 0.4) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.6) return 'Good Match'
    if (score >= 0.4) return 'Fair Match'
    return 'Potential Match'
  }

  const steps = [
    'Describe your preferences',
    'AI analyzes your needs',
    'Finding matches',
    'Results ready'
  ]

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <AIIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3rem' },
            }}
          >
            AI-Powered Matching
          </Typography>
          <Typography
            sx={{
              color: 'var(--foreground-secondary)',
              fontSize: '1.1rem',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Describe what you're looking for and let our AI find your perfect {searchType === 'room' ? 'room' : 'roommate'} match
          </Typography>
        </Box>

        {/* Progress Stepper */}
        {(isSearching || matches.length > 0) && (
          <Card
            className="dark-card"
            sx={{
              background: 'var(--background-card)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 4,
              p: 3,
            }}
          >
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: 'var(--foreground-secondary)',
                        '&.Mui-active': {
                          color: 'var(--primary)',
                        },
                        '&.Mui-completed': {
                          color: 'var(--foreground)',
                        },
                      },
                      '& .MuiStepIcon-root': {
                        color: 'var(--background-secondary)',
                        '&.Mui-active': {
                          color: 'var(--primary)',
                        },
                        '&.Mui-completed': {
                          color: 'var(--primary)',
                        },
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Card>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Search Form */}
          <Box sx={{ flex: matches.length > 0 ? '0 0 400px' : '1 1 100%', maxWidth: matches.length > 0 ? '400px' : '600px', mx: matches.length > 0 ? 0 : 'auto' }}>
            <Card
              className="dark-card"
              sx={{
                background: 'var(--background-card)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                p: 4,
              }}
            >
              {/* Search Type Toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Typography sx={{ color: 'var(--foreground)', fontWeight: 600 }}>
                  I'm looking for:
                </Typography>
                <ToggleButtonGroup
                  value={searchType}
                  exclusive
                  onChange={(_, v) => v && setSearchType(v)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: 'var(--foreground-secondary)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      px: 3,
                      py: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'var(--primary-hover)',
                        }
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                      }
                    }
                  }}
                >
                  <ToggleButton value="room">
                    <HomeIcon sx={{ mr: 1 }} />
                    A Room
                  </ToggleButton>
                  <ToggleButton value="roommate">
                    <PersonIcon sx={{ mr: 1 }} />
                    A Roommate
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Description Input */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2 }}>
                  Describe your ideal {searchType}:
                </Typography>
                <TextField
                  placeholder={searchType === 'room' 
                    ? "e.g., Looking for a 2-bedroom furnished apartment under $1200/month near downtown, pet-friendly..."
                    : "e.g., Looking for a clean, quiet roommate who's a graduate student, non-smoker, enjoys cooking..."
                  }
                  fullWidth
                  multiline
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--background-secondary)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
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
                    '& textarea::placeholder': {
                      color: 'var(--foreground-secondary)',
                      opacity: 1,
                    }
                  }}
                />
                <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)', mt: 1 }}>
                  💡 Be specific! Our AI will extract preferences like budget, location, and amenities.
                </Typography>
              </Box>

              {/* Location Status */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon sx={{ color: 'var(--primary)', fontSize: 20 }} />
                  <Typography sx={{ color: 'var(--foreground)', fontWeight: 600 }}>
                    Location
                  </Typography>
                </Box>
                {locationStatus === 'loading' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: 'var(--primary)' }} />
                    <Typography sx={{ fontSize: '0.9rem', color: 'var(--foreground-secondary)' }}>
                      Getting your location...
                    </Typography>
                  </Box>
                )}
                {locationStatus === 'granted' && (
                  <Typography sx={{ fontSize: '0.9rem', color: 'var(--foreground-secondary)' }}>
                    ✅ Location detected - we'll find matches within 10km
                  </Typography>
                )}
                {locationStatus === 'denied' && (
                  <Typography sx={{ fontSize: '0.9rem', color: '#f97316' }}>
                    ⚠️ Location access denied - matches may be less accurate
                  </Typography>
                )}
              </Box>

              {/* Advanced Filters Toggle */}
              <Accordion 
                expanded={showAdvancedFilters} 
                onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}
                sx={{
                  background: 'transparent',
                  boxShadow: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  mb: 4,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'var(--primary)' }} />}
                  sx={{ color: 'var(--foreground)' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon sx={{ color: 'var(--primary)', fontSize: 20 }} />
                    <Typography fontWeight={600}>Advanced Filters</Typography>
                    <Chip 
                      label="Optional" 
                      size="small" 
                      sx={{ 
                        background: 'rgba(0, 122, 255, 0.1)', 
                        color: 'var(--primary)',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Budget slider */}
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ mb: 2, color: 'var(--foreground)', fontWeight: 600 }}>
                      Budget Range: ${budget[0].toLocaleString()} – ${budget[1].toLocaleString()}
                    </Typography>
                    <Slider
                      value={budget}
                      onChange={(_, v) => setBudget(v as [number, number])}
                      min={0}
                      max={5000}
                      step={50}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                      sx={{
                        color: 'var(--primary)',
                        '& .MuiSlider-thumb': {
                          backgroundColor: 'var(--primary)',
                          border: '2px solid var(--background)',
                          '&:hover': {
                            boxShadow: '0 0 0 8px rgba(0, 122, 255, 0.16)',
                          }
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: 'var(--primary)',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: 'var(--primary)',
                        },
                      }}
                    />
                  </Box>

                  {/* Room-specific filters */}
                  {searchType === 'room' && (
                    <>
                      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                          select
                          label="Bedrooms"
                          value={bedrooms}
                          onChange={e => setBedrooms(Number(e.target.value))}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'var(--background-secondary)',
                              borderRadius: '12px',
                              color: 'var(--foreground)',
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
                            '& .MuiInputLabel-root': {
                              color: 'var(--foreground-secondary)',
                              '&.Mui-focused': {
                                color: 'var(--primary)',
                              }
                            }
                          }}
                        >
                          {[1, 2, 3, 4].map(n => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          label="Bathrooms"
                          value={bathrooms}
                          onChange={e => setBathrooms(Number(e.target.value))}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'var(--background-secondary)',
                              borderRadius: '12px',
                              color: 'var(--foreground)',
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
                            '& .MuiInputLabel-root': {
                              color: 'var(--foreground-secondary)',
                              '&.Mui-focused': {
                                color: 'var(--primary)',
                              }
                            }
                          }}
                        >
                          {[1, 2, 3].map(n => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={furnished}
                            onChange={e => setFurnished(e.target.checked)}
                            sx={{
                              color: 'var(--foreground-secondary)',
                              '&.Mui-checked': {
                                color: 'var(--primary)',
                              }
                            }}
                          />
                        }
                        label="Furnished"
                        sx={{ color: 'var(--foreground)' }}
                      />
                    </>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* AI Preferences Display */}
              {aiPreferences && (
                <Alert 
                  severity="info" 
                  icon={<AIIcon />}
                  sx={{ 
                    mb: 4, 
                    borderRadius: '12px',
                    background: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid rgba(0, 122, 255, 0.2)',
                    '& .MuiAlert-message': {
                      color: 'var(--foreground)',
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>AI Detected Preferences:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {aiPreferences.bedrooms && (
                      <Chip 
                        label={`${aiPreferences.bedrooms} bedroom${aiPreferences.bedrooms > 1 ? 's' : ''}`}
                        size="small"
                        sx={{ background: 'var(--primary)', color: 'white' }}
                      />
                    )}
                    {aiPreferences.budgetMax && (
                      <Chip 
                        label={`Max $${aiPreferences.budgetMax}/month`}
                        size="small"
                        sx={{ background: 'var(--primary)', color: 'white' }}
                      />
                    )}
                    {aiPreferences.furnished !== null && (
                      <Chip 
                        label={aiPreferences.furnished ? 'Furnished' : 'Unfurnished'}
                        size="small"
                        sx={{ background: 'var(--primary)', color: 'white' }}
                      />
                    )}
                  </Box>
                </Alert>
              )}

              {/* Search Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleSearch}
                disabled={isSearching}
                startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '16px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)',
                  '&:hover': {
                    background: 'var(--primary-hover)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(0, 122, 255, 0.4)',
                  },
                  '&:disabled': {
                    background: 'var(--background-secondary)',
                    color: 'var(--foreground-secondary)',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {isSearching ? 'Finding Matches...' : '🔍 Find My Perfect Match'}
              </Button>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 3, borderRadius: '12px' }}
                >
                  {error}
                </Alert>
              )}
            </Card>
          </Box>

          {/* Results Section */}
          {matches.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'var(--foreground)', 
                    fontWeight: 700, 
                    mb: 1 
                  }}
                >
                  Your Matches ({matches.length})
                </Typography>
                <Typography sx={{ color: 'var(--foreground-secondary)' }}>
                  Ranked by AI compatibility score
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {matches.map((match, index) => (
                  <Card
                    key={match.id}
                    className="dark-card scale-on-hover"
                    sx={{
                      background: 'var(--background-card)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Match Ranking Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: getScoreColor(match.combinedScore),
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <StarIcon sx={{ fontSize: 14 }} />
                      #{index + 1} {getScoreLabel(match.combinedScore)}
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                      {/* Header with image and basic info */}
                      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                        {match.images.length > 0 && (
                          <Box
                            component="img"
                            src={match.images[0]}
                            alt={match.title}
                            sx={{
                              width: 120,
                              height: 120,
                              borderRadius: '12px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ 
                              color: 'var(--foreground)', 
                              fontWeight: 700, 
                              mb: 1,
                              pr: 10, // Space for badge
                            }}
                          >
                            {match.title || `${match.type === 'room' ? 'Room' : 'Roommate'} Listing`}
                          </Typography>
                          <Typography
                            sx={{
                              color: 'var(--foreground-secondary)',
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.5,
                            }}
                          >
                            {match.description}
                          </Typography>
                          {match.price && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <MoneyIcon sx={{ color: 'var(--primary)', fontSize: 20 }} />
                              <Typography
                                sx={{
                                  color: 'var(--primary)',
                                  fontWeight: 700,
                                  fontSize: '1.2rem',
                                }}
                              >
                                ${match.price.toLocaleString()}/month
                              </Typography>
                            </Box>
                          )}
                          {match.address && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon sx={{ color: 'var(--foreground-secondary)', fontSize: 18 }} />
                              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                                {match.address.split(',').slice(0, 2).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Compatibility Scores */}
                      <Box sx={{ mb: 3 }}>
                        <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2 }}>
                          Compatibility Analysis
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)', mb: 1 }}>
                              Overall
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: '1.5rem', 
                                fontWeight: 700, 
                                color: getScoreColor(match.combinedScore) 
                              }}
                            >
                              {Math.round(match.combinedScore * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)', mb: 1 }}>
                              Semantic
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 600, 
                                color: 'var(--foreground)' 
                              }}
                            >
                              {Math.round(match.semanticScore * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', color: 'var(--foreground-secondary)', mb: 1 }}>
                              Filters
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 600, 
                                color: 'var(--foreground)' 
                              }}
                            >
                              {Math.round(match.structuredScore * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Explanation */}
                      <Box sx={{ mb: 3 }}>
                        <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}>
                          Why this is a good match:
                        </Typography>
                        <Typography sx={{ color: 'var(--foreground-secondary)', lineHeight: 1.6 }}>
                          {match.explanation}
                        </Typography>
                      </Box>

                      {/* Action Button */}
                      <Button
                        onClick={() => handleChat(match)}
                        startIcon={<ChatIcon />}
                        fullWidth
                        sx={{
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          py: 1.5,
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'var(--primary-hover)',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Start Conversation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* How It Works Section */}
        <Card
          className="dark-card"
          sx={{
            background: 'var(--background-card)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 6,
            p: 4,
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'var(--foreground)', 
              fontWeight: 700, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <InfoIcon sx={{ color: 'var(--primary)' }} />
            How Our AI Matching Works
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(0, 122, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AIIcon sx={{ color: 'var(--primary)', fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}>
                AI Preference Extraction
              </Typography>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                Our AI analyzes your description to extract specific preferences like budget, location, and amenities.
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(0, 122, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <SearchIcon sx={{ color: 'var(--primary)', fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}>
                Semantic Similarity
              </Typography>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                We compare your description with listing content using advanced language understanding.
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(0, 122, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <StarIcon sx={{ color: 'var(--primary)', fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1 }}>
                Smart Ranking
              </Typography>
              <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem' }}>
                Results are ranked by a combination of filter matching, semantic similarity, and location proximity.
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Matching Logic Location Info */}
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ 
            mt: 4, 
            borderRadius: '12px',
            background: 'rgba(0, 122, 255, 0.1)',
            border: '1px solid rgba(0, 122, 255, 0.2)',
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            🔧 For Developers: Matching Logic Location
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', mb: 1 }}>
            The AI matching system consists of several components:
          </Typography>
          <Box component="ul" sx={{ fontSize: '0.9rem', pl: 2, mb: 0 }}>
            <li><code>/api/parsePreferences/route.ts</code> - Extracts preferences from natural language</li>
            <li><code>/api/matches/route.ts</code> - Main matching API endpoint</li>
            <li><code>/lib/matching.ts</code> - Core matching algorithm with semantic similarity</li>
            <li><code>/lib/enhancedMatching.ts</code> - Advanced matching with detailed scoring</li>
            <li><code>/lib/openai-embed.ts</code> - Generates embeddings for semantic comparison</li>
          </Box>
        </Alert>
      </Box>
    </Box>
  )
}
