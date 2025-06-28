// File: src/app/profile/page.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
  Paper,
  Divider,
} from '@mui/material'
import { PhotoCamera } from '@mui/icons-material'
import { auth } from '@/lib/firebaseConfig'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import RequireAuth from '@/components/RequireAuth'
import { useTheme } from '@mui/material/styles'
import SchoolIcon from '@mui/icons-material/School'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BookIcon from '@mui/icons-material/Book'
import HomeIcon from '@mui/icons-material/Home'

// Available hobbies (max 6)
const hobbyOptions = [
  'Soccer',
  'Basketball',
  'Reading',
  'Gaming',
  'Music',
  'Traveling',
  'Cooking',
  'Photography',
  'Hiking',
  'Drawing',
  'Dancing',
  'Coding',
]

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    profilePicture: '',
    hobbies: [] as string[],
    school: '',
    major: '',
    year: '',
    hometown: '',
  })
  const [editMode, setEditMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const theme = useTheme()

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser
      if (!user) return
      const snap = await getDoc(doc(db, 'profiles', user.uid))
      if (snap.exists()) {
        setProfile({
          name: snap.data().name || '',
          bio: snap.data().bio || '',
          profilePicture: snap.data().profilePicture || '',
          hobbies: snap.data().hobbies || [],
          school: snap.data().school || '',
          major: snap.data().major || '',
          year: snap.data().year || '',
          hometown: snap.data().hometown || '',
        })
      }
    }
    fetchProfile()
  }, [])

  // Save profile
  const handleSave = async () => {
    const user = auth.currentUser
    if (!user) return
    await setDoc(doc(db, 'profiles', user.uid), profile)
    setEditMode(false)
  }

  // Image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, profilePicture: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Toggle hobbies (max 6)
  const toggleHobby = (hobby: string) => {
    setProfile((prev) => {
      if (prev.hobbies.includes(hobby)) {
        return { ...prev, hobbies: prev.hobbies.filter((h) => h !== hobby) }
      }
      if (prev.hobbies.length >= 6) return prev
      return { ...prev, hobbies: [...prev.hobbies, hobby] }
    })
  }

  return (
    <RequireAuth>
      {/* Gradient header */}
      <Box sx={{ height: 170, background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})` }} />

      {/* Main container */}
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, mb: 4 }}>
        {/* View Mode */}
        {!editMode ? (
          <Paper elevation={4} sx={{ p: 3, textAlign: 'center', mt: -9 }}>
            {/* Avatar – floats above card */}
            <Avatar
              src={profile.profilePicture}
              alt={profile.name || 'User'}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mt: -10,
                mb: 1,
                border: `4px solid ${theme.palette.background.paper}`,
              }}
            />

            <Typography variant="h5" fontWeight={600} gutterBottom>
              {profile.name || 'Unnamed User'}
            </Typography>

            {(profile.school || profile.year) && (
              <Typography color="text.secondary" gutterBottom>
                {profile.school} {profile.year && `— ${profile.year}`}
              </Typography>
            )}

            {/* Details with icons */}
            <Stack direction="column" spacing={1} alignItems="center" sx={{ my: 2 }}>
              {profile.major && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <BookIcon fontSize="small" color="action" />
                  <Typography>{profile.major}</Typography>
                </Stack>
              )}
              {profile.hometown && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <HomeIcon fontSize="small" color="action" />
                  <Typography>{profile.hometown}</Typography>
                </Stack>
              )}
            </Stack>

            {profile.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profile.bio}
              </Typography>
            )}

            {!!profile.hobbies.length && (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                justifyContent="center"
                mb={2}
              >
                {profile.hobbies.map((h) => (
                  <Chip key={h} label={h} color="primary" size="small" />
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />
            <Button variant="contained" fullWidth onClick={() => setEditMode(true)}>
              Edit Profile
            </Button>
          </Paper>
        ) : (
          /* Edit Mode */
          <Paper
            component="form"
            elevation={4}
            sx={{ p: 3, mt: -9, display: 'flex', flexDirection: 'column', gap: 2 }}
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            {/* Image */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
            <Box textAlign="center">
              <Avatar
                src={profile.profilePicture}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 1 }}
              />
              <Button
                size="small"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
              >
                {profile.profilePicture ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </Box>

            {/* Text Fields */}
            <TextField
              label="Full Name *"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
            <TextField
              label="About Me"
              value={profile.bio}
              multiline
              rows={3}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <TextField
              label="School"
              value={profile.school}
              onChange={(e) => setProfile({ ...profile, school: e.target.value })}
            />
            <TextField
              label="Major"
              value={profile.major}
              onChange={(e) => setProfile({ ...profile, major: e.target.value })}
            />
            <TextField
              label="Year"
              value={profile.year}
              onChange={(e) => setProfile({ ...profile, year: e.target.value })}
              placeholder="Freshman, Sophomore, ..."
            />
            <TextField
              label="Hometown"
              value={profile.hometown}
              onChange={(e) => setProfile({ ...profile, hometown: e.target.value })}
            />

            {/* Hobbies */}
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Select up to 6 hobbies
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {hobbyOptions.map((h) => (
                  <Chip
                    key={h}
                    label={h}
                    clickable
                    color={profile.hobbies.includes(h) ? 'primary' : 'default'}
                    onClick={() => toggleHobby(h)}
                  />
                ))}
              </Stack>
            </Box>

            {/* Buttons */}
            <Stack direction="row" gap={2} mt={1}>
              <Button type="submit" variant="contained" fullWidth>
                Save
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </RequireAuth>
  )
}
