// File: src/app/profile/page.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { auth } from '@/lib/firebaseConfig'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import RequireAuth from '@/components/RequireAuth'
import FloatingMessageButton from '@/components/FloatingMessageButton'
import { useRouter } from 'next/navigation'

// MUI imports (each component from its own path)
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import Paper from '@mui/material/Paper'

// MUI icons
import { PhotoCamera } from '@mui/icons-material'
import SchoolIcon from '@mui/icons-material/School'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BookIcon from '@mui/icons-material/Book'
import HomeIcon from '@mui/icons-material/Home'

// Possible hobbies/interests (up to 6)
const allHobbies = [
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

export default function Profile() {
  const theme = useTheme()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Profile state
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
  const [editing, setEditing] = useState(false)

  // Fetch existing profile from Firestore on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser
      if (!user) return
      const docRef = doc(db, 'profiles', user.uid)
      const snapshot = await getDoc(docRef)
      if (snapshot.exists()) {
        const data = snapshot.data()
        setProfile({
          name: data.name || '',
          bio: data.bio || '',
          profilePicture: data.profilePicture || '',
          hobbies: data.hobbies || [],
          school: data.school || '',
          major: data.major || '',
          year: data.year || '',
          hometown: data.hometown || '',
        })
      }
    }
    fetchProfile()
  }, [])

  // Save updated profile back to Firestore
  const saveProfileToFirestore = async () => {
    const user = auth.currentUser
    if (!user) return
    await setDoc(doc(db, 'profiles', user.uid), profile)
  }

  // Handle image upload, convert to base64 string, store in state
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, profilePicture: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Toggle a hobby (max 6)
  const toggleHobby = (hobby: string) => {
    setProfile((prev) => {
      if (prev.hobbies.includes(hobby)) {
        return { ...prev, hobbies: prev.hobbies.filter((h) => h !== hobby) }
      } else if (prev.hobbies.length < 6) {
        return { ...prev, hobbies: [...prev.hobbies, hobby] }
      }
      return prev
    })
  }

  return (
    <RequireAuth>
      {/* ========================================================= */}
      {/* Hero Header with Angled Polygon Background */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#ffffff',
          mb: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: { xs: 300, md: 350 },
            backgroundColor: theme.palette.primary.main,
            clipPath: {
              xs: 'polygon(0 0, 100% 0, 100% 75%, 0% 100%)',
              md: 'polygon(0 0, 100% 0, 100% 65%, 0% 100%)',
            },
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 920,
            mx: 'auto',
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 6, md: 8 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 4, md: 8 },
            color: '#ffffff',
          }}
        >
          {/* Avatar with White Frame */}
          <Box
            sx={{
              position: 'relative',
              width: 180,
              height: 180,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              p: 1,
              flexShrink: 0,
            }}
          >
            <Avatar
              src={profile.profilePicture}
              alt={profile.name || 'User'}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </Box>

          {/* Name and roommate-related info */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#ffffff' }}>
              {profile.name || 'Unnamed User'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#f0f0f0', mb: 2 }}>
              {profile.school || 'School not set'} — {profile.year || 'Year not set'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#e0e0e0', mb: 1 }}>
              <strong>Major:</strong> {profile.major || '—'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#e0e0e0' }}>
              <strong>Hometown:</strong> {profile.hometown || '—'}
            </Typography>
          </Box>

          {/* “Settings” button (if not editing) */}
          {!editing && (
            <Box sx={{ mt: { xs: 2, md: 0 } }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/settings')}
                sx={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: '#e0e0e0',
                  },
                }}
              >
                Settings
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ========================================================= */}
      {/* Main Content Container */}
      <Box sx={{ maxWidth: 920, mx: 'auto', px: { xs: 2, sm: 4, md: 6 }, mb: 12 }}>
        {!editing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* ─── About Me in full-width rectangle ─── */}
            {profile.bio && (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  About Me
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {profile.bio}
                </Typography>
              </Paper>
            )}

            {/* ─── Four Cards: School, Year, Major, Hometown with Icons ─── */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
              }}
            >
              {/* School Card */}
              <Paper
                elevation={1}
                sx={{
                  width: 180,
                  height: 140,
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  School
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                  {profile.school || 'N/A'}
                </Typography>
              </Paper>

              {/* Year Card */}
              <Paper
                elevation={1}
                sx={{
                  width: 180,
                  height: 140,
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Year
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                  {profile.year || 'N/A'}
                </Typography>
              </Paper>

              {/* Major Card */}
              <Paper
                elevation={1}
                sx={{
                  width: 180,
                  height: 140,
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <BookIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Major
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                  {profile.major || 'N/A'}
                </Typography>
              </Paper>

              {/* Hometown Card */}
              <Paper
                elevation={1}
                sx={{
                  width: 180,
                  height: 140,
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <HomeIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Hometown
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                  {profile.hometown || 'N/A'}
                </Typography>
              </Paper>
            </Box>

            {/* ─── Hobbies & Interests Section ─── */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: '#ffffff',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Hobbies & Interests
              </Typography>
              {profile.hobbies.length ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.hobbies.map((hobby) => (
                    <Box
                      key={hobby}
                      sx={{
                        px: 2,
                        py: 0.5,
                        backgroundColor: '#e3f2fd',
                        color: '#0d47a1',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {hobby}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  No hobbies selected.
                </Typography>
              )}
            </Paper>

            {/* ─── Edit Profile Button ─── */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setEditing(true)}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: '#ffffff',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>
        ) : (
          /* ─── Edit Mode: Form ─── */
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault()
              await saveProfileToFirestore()
              setEditing(false)
            }}
            sx={{
              backgroundColor: '#ffffff',
              p: 4,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* ─── Picture Upload ─── */}
            <Box sx={{ textAlign: 'center' }}>
              <input
                type="file"
                ref={fileRef}
                onChange={handleImageUpload}
                accept="image/*"
                hidden
              />
              <IconButton
                onClick={() => fileRef.current?.click()}
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '&:hover': { backgroundColor: theme.palette.primary.main },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: '1.5rem',
                }}
              >
                <PhotoCamera fontSize="large" />
              </IconButton>
              <Typography sx={{ mt: 1, color: theme.palette.text.secondary }}>
                {profile.profilePicture ? 'Replace Picture' : 'Upload Picture'}
              </Typography>
            </Box>

            {/* ─── Full Name ─── */}
            <TextField
              placeholder="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& fieldset': {
                  borderColor: '#cccccc',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '& input': {
                  fontWeight: 500,
                },
              }}
            />

            {/* ─── About Me/Bio ─── */}
            <TextField
              placeholder="About Me"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& fieldset': {
                  borderColor: '#cccccc',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '& textarea': {
                  fontWeight: 400,
                },
              }}
            />

            {/* ─── School & Major ─── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <TextField
                placeholder="School"
                value={profile.school}
                onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                fullWidth
                variant="outlined"
                sx={{
                  '& fieldset': { borderColor: '#cccccc' },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                }}
              />
              <TextField
                placeholder="Major"
                value={profile.major}
                onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                fullWidth
                variant="outlined"
                sx={{
                  '& fieldset': { borderColor: '#cccccc' },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                }}
              />
            </Box>

            {/* ─── Year & Hometown ─── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <TextField
                select
                label="Year"
                value={profile.year}
                onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& fieldset': { borderColor: '#cccccc' },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                }}
              >
                <MenuItem value="" disabled>
                  Select Year
                </MenuItem>
                <MenuItem value="Freshman">Freshman</MenuItem>
                <MenuItem value="Sophomore">Sophomore</MenuItem>
                <MenuItem value="Junior">Junior</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Graduate">Graduate</MenuItem>
              </TextField>
              <TextField
                placeholder="Hometown"
                value={profile.hometown}
                onChange={(e) => setProfile({ ...profile, hometown: e.target.value })}
                fullWidth
                variant="outlined"
                sx={{
                  '& fieldset': { borderColor: '#cccccc' },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                }}
              />
            </Box>

            {/* ─── Hobbies Picker ─── */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: '#333', mb: 1 }}
              >
                Select Hobbies (Max 6)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allHobbies.map((hobby) => (
                  <Button
                    key={hobby}
                    variant={profile.hobbies.includes(hobby) ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => toggleHobby(hobby)}
                    sx={{
                      color: profile.hobbies.includes(hobby)
                        ? '#ffffff'
                        : theme.palette.primary.main,
                      backgroundColor: profile.hobbies.includes(hobby)
                        ? theme.palette.primary.main
                        : 'transparent',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: profile.hobbies.includes(hobby)
                          ? theme.palette.primary.dark
                          : 'rgba(25,118,210,0.08)',
                      },
                      fontSize: '0.875rem',
                      textTransform: 'none',
                    }}
                  >
                    {hobby}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* ─── Save / Cancel Buttons ─── */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Save Profile
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setEditing(false)}
                sx={{
                  borderColor: theme.palette.grey[500],
                  color: theme.palette.grey[700],
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderColor: theme.palette.grey[700],
                  },
                  textTransform: 'none',
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Floating Chat Button (optional) */}
      <FloatingMessageButton />
    </RequireAuth>
  )
}
