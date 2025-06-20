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
  List,
  ListItem,
  ListItemText,
  Divider,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebaseConfig'
import type { StructuredFilters } from '@/lib/types'

type ListingType = 'room' | 'roommate'

export default function MatchesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchType, setSearchType] = useState<ListingType>('room')

  // Free‐text
  const [description, setDescription] = useState('')

  // Manual Filters (fallback)
  const [budget, setBudget]       = useState<[number, number]>([500, 1500])
  const [bedrooms, setBedrooms]   = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [furnished, setFurnished] = useState(false)

  // Geolocation
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  })
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn('Geo denied, using default')
    )
  }, [])

  // Results
  const [isSearching, setIsSearching] = useState(false)
  const [matches, setMatches]         = useState<any[]>([])
  const [error, setError]             = useState<string | null>(null)

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
        <CircularProgress sx={{ color: 'var(--primary)' }} />
      </Box>
    )
  }

  const handleSearch = async () => {
    if (!description.trim()) {
      setError('Tell us what you are looking for!')
      return
    }
    setError(null)
    setIsSearching(true)

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
      }
    } catch (e) {
      console.warn('parsePreferences failed, using manual values', e)
    }

    // 2) Build your filters, merging AI + manual defaults
    const structuredFilters: StructuredFilters = {
      budgetMin:      budget[0],
      budgetMax:      aiPrefs.budgetMax ?? budget[1],
      location,
      locationRadiusKm: 10,            // your default radius
      bedrooms:       aiPrefs.bedrooms  ?? bedrooms,
      bathrooms:      bathrooms,
      furnished:      aiPrefs.furnished ?? furnished,
    }

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
    } catch (e: any) {
      console.error(e)
      setError(e.message)
      setMatches([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        p: 4,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        className="dark-card"
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 4,
          borderRadius: '16px',
          height: 'fit-content',
        }}
      >
        <Typography 
          variant="h4" 
          sx={{
            mb: 4,
            color: 'var(--foreground)',
            fontWeight: 700,
            textAlign: 'center',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Find {searchType === 'room' ? 'Rooms' : 'Roommates'}
        </Typography>

        {/* Type toggle */}
        <ToggleButtonGroup
          value={searchType}
          exclusive
          onChange={(_, v) => v && setSearchType(v)}
          sx={{ 
            mb: 3,
            '& .MuiToggleButton-root': {
              color: 'var(--foreground-secondary)',
              borderColor: 'var(--border)',
              '&.Mui-selected': {
                backgroundColor: 'var(--primary)',
                color: 'var(--foreground)',
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
          <ToggleButton value="room">Room</ToggleButton>
          <ToggleButton value="roommate">Roommate</ToggleButton>
        </ToggleButtonGroup>

        {/* Free‐text */}
        <TextField
          label="Describe what you're looking for…"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--foreground)',
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
            }
          }}
        />

        {/* Budget slider (manual fallback) */}
        <Typography 
          sx={{ 
            mb: 2,
            color: 'var(--foreground)',
            fontWeight: 600,
          }}
        >
          Budget (${budget[0]} – ${budget[1]})
        </Typography>
        <Slider
          value={budget}
          onChange={(_, v) => setBudget(v as [number, number])}
          min={0}
          max={5000}
          valueLabelDisplay="auto"
          sx={{ 
            mb: 3,
            color: 'var(--primary)',
            '& .MuiSlider-thumb': {
              backgroundColor: 'var(--primary)',
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
            }
          }}
        />

        {/* Room‐specific manual controls */}
        {searchType === 'room' && (
          <>
            <TextField
              select
              label="Bedrooms"
              fullWidth
              value={bedrooms}
              onChange={e => setBedrooms(Number(e.target.value))}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      backgroundColor: 'var(--background-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      '& .MuiMenuItem-root': {
                        color: 'var(--foreground)',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        }
                      }
                    }
                  }
                }
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--foreground)',
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
                '& .MuiSvgIcon-root': {
                  color: 'var(--primary)',
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
              fullWidth
              value={bathrooms}
              onChange={e => setBathrooms(Number(e.target.value))}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      backgroundColor: 'var(--background-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      '& .MuiMenuItem-root': {
                        color: 'var(--foreground)',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        }
                      }
                    }
                  }
                }
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--foreground)',
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
                '& .MuiSvgIcon-root': {
                  color: 'var(--primary)',
                }
              }}
            >
              {[1, 2, 3].map(n => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
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
              sx={{ 
                mb: 3,
                color: 'var(--foreground)',
              }}
            />
          </>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleSearch}
          disabled={isSearching}
          className="btn-primary"
          sx={{
            mb: 3,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '12px',
          }}
        >
          {isSearching ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
              Searching…
            </>
          ) : (
            '🔍 Find Matches'
          )}
        </Button>

        {error && (
          <Typography 
            sx={{ 
              mb: 2,
              color: '#ef4444',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {error}
          </Typography>
        )}

        {matches.length > 0 && (
          <Box
            className="dark-card"
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <List>
              {matches.map(m => (
                <React.Fragment key={m.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography sx={{ color: 'var(--foreground)', fontWeight: 600 }}>
                          {m.title}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: 'var(--foreground-secondary)' }}>
                          {m.type === 'room'
                            ? `$${m.price}/mo — ${m.description.slice(0, 80)}…`
                            : `Roommate — ${m.description.slice(0, 80)}…`}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider 
                    component="li" 
                    sx={{ 
                      borderColor: 'var(--border)',
                    }}
                  />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  )
}
