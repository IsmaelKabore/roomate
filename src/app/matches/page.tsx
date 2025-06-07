// src/app/matches/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebaseConfig'
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'

interface PostWithMeta {
  id: string
  title: string
  description: string
  address?: string
  price?: number
  images?: string[]
  type: 'room' | 'roommate'
  userId: string
  createdAt: any
  embedding: number[]
}

/**
 * This page prompts the user to enter a keyword, then calls /api/matches,
 * and displays up to five best-matching posts (excluding their own posts).
 */
export default function MatchesPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<null | { uid: string }>(null)

  // Keyword + search state
  const [keyword, setKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [matches, setMatches] = useState<PostWithMeta[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid })
      } else {
        router.replace('/auth/login')
      }
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [router])

  if (checkingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null // redirect already happened
  }

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('Please enter a keyword.')
      setMatches([])
      return
    }
    setError(null)
    setIsSearching(true)
    setMatches([])

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), userId: user.uid }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to fetch matches')
      }

      const { matches: fetchedMatches } = (await res.json()) as {
        matches: PostWithMeta[]
      }
      setMatches(fetchedMatches)
    } catch (err: any) {
      console.error('[MatchesPage] fetch error:', err)
      setError(err.message || 'Unknown error fetching matches.')
      setMatches([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Box
      sx={{
        px: 2,
        pt: 4,
        maxWidth: 700,
        mx: 'auto',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Find Your Top 5 Matches
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Enter a keyword and we’ll show you the five posts whose embeddings match
        best.
      </Typography>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}
      >
        <TextField
          label="Keyword"
          variant="outlined"
          size="small"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Searching…' : 'Search'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {isSearching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isSearching && matches.length > 0 && (
        <List>
          {matches.map((post) => (
            <React.Fragment key={post.id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={post.title}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {post.type === 'room'
                          ? `Room • $${post.price ?? 'N/A'}`
                          : 'Roommate'}
                      </Typography>
                      {' — '}
                      {post.description.length > 100
                        ? post.description.substring(0, 100) + '…'
                        : post.description}
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      {!isSearching && !error && matches.length === 0 && keyword.trim() !== '' && (
        <Typography>No matches found for “{keyword}.”</Typography>
      )}

      <Box sx={{ mt: 5 }}>
        <Button
          variant="outlined"
          onClick={() => {
            auth.signOut().then(() => {
              router.replace('/auth/login')
            })
          }}
        >
          Log Out
        </Button>
      </Box>
    </Box>
  )
}
