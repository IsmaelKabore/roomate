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
      <Box textAlign="center" mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  const handleSearch = async () => {
    if (!description.trim()) {
      setError('Tell us what you’re looking for!')
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
    <Box p={4} maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom>
        Find {searchType === 'room' ? 'Rooms' : 'Roommates'}
      </Typography>

      {/* Type toggle */}
      <ToggleButtonGroup
        value={searchType}
        exclusive
        onChange={(_, v) => v && setSearchType(v)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="room">Room</ToggleButton>
        <ToggleButton value="roommate">Roommate</ToggleButton>
      </ToggleButtonGroup>

      {/* Free‐text */}
      <TextField
        label="Describe what you’re looking for…"
        fullWidth
        multiline
        rows={3}
        value={description}
        onChange={e => setDescription(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Budget slider (manual fallback) */}
      <Typography gutterBottom>
        Budget (${budget[0]} – ${budget[1]})
      </Typography>
      <Slider
        value={budget}
        onChange={(_, v) => setBudget(v as [number, number])}
        min={0}
        max={5000}
        valueLabelDisplay="auto"
        sx={{ mb: 3 }}
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
            sx={{ mb: 3 }}
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
            sx={{ mb: 3 }}
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
              />
            }
            label="Furnished"
            sx={{ mb: 3 }}
          />
        </>
      )}

      <Button
        variant="contained"
        fullWidth
        onClick={handleSearch}
        disabled={isSearching}
        sx={{ mb: 3 }}
      >
        {isSearching ? 'Searching…' : 'Find Matches'}
      </Button>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {matches.length > 0 && (
        <List>
          {matches.map(m => (
            <React.Fragment key={m.id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={m.title}
                  secondary={
                    m.type === 'room'
                      ? `$${m.price}/mo — ${m.description.slice(0, 80)}…`
                      : `Roommate — ${m.description.slice(0, 80)}…`
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  )
}
