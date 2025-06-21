// File: src/app/create/page.tsx
'use client'

import React, { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Paper,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox,
  useTheme,
  alpha,
} from '@mui/material'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { auth } from '@/lib/firebaseConfig'
import { uploadImage } from '@/lib/uploadImage'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import SpellcheckIcon from '@mui/icons-material/Spellcheck'
import DeleteIcon from '@mui/icons-material/Delete'

type FormValues = {
  type: 'room' | 'roommate'
  title: string
  description: string
  price?: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  address: string
  keywordsInput: string
}

interface CreatePostPayload {
  title: string
  description: string
  address: string
  images: string[]
  userId: string
  type: 'room' | 'roommate'
  price?: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  keywords: string[]
}

// keep this array truly static
const MAP_LIBRARIES: Array<'places'> = ['places']

export default function CreatePostPage() {
  const router = useRouter()
  const theme = useTheme()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: 'room',
      title: '',
      description: '',
      price: undefined,
      bedrooms: 1,
      bathrooms: 1,
      furnished: false,
      address: '',
      keywordsInput: '',
    },
  })
  const selectedType = watch('type')
  const currentDescription = watch('description')

  // load Google Maps SDK
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: MAP_LIBRARIES,
  })
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onLoad = (ac: google.maps.places.Autocomplete) => {
    autoRef.current = ac
  }
  const onPlaceChanged = (onChange: (v: string) => void) => {
    const place = autoRef.current?.getPlace()
    if (place?.formatted_address) onChange(place.formatted_address)
  }

  // images state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((p) => [...p, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    setImageFiles((p) => [...p, ...Array.from(files)])
  }

  const removeImageAt = (i: number) => {
    setImageFiles((p) => p.filter((_, idx) => idx !== i))
    setImagePreviews((p) => p.filter((_, idx) => idx !== i))
  }

  // AI assistance state
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const [proofreading, setProofreading] = useState(false)

  const onGenerateTitle = async () => {
    if (!currentDescription.trim()) return
    setGeneratingTitle(true)
    try {
      const keywords = watch('keywordsInput')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
      const res = await fetch('/api/posts/generateTitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: currentDescription, keywords }),
      })
      if (!res.ok) throw new Error()
      const { title } = await res.json()
      reset({ ...watch(), title })
    } catch {
      alert('Title generation failed')
    } finally {
      setGeneratingTitle(false)
    }
  }

  const onProofreadDescription = async () => {
    if (!currentDescription.trim()) return
    setProofreading(true)
    try {
      const res = await fetch('/api/posts/proofreadDescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: currentDescription }),
      })
      if (!res.ok) throw new Error()
      const { polished } = await res.json()
      reset({ ...watch(), description: polished })
    } catch {
      alert('Proofreading failed')
    } finally {
      setProofreading(false)
    }
  }

  // form submit
  const onSubmit = async (data: FormValues) => {
    if (imageFiles.length === 0) {
      alert('Upload at least one image')
      return
    }
    const user = auth.currentUser
    if (!user) {
      alert('Log in first')
      return
    }

    setSubmitting(true)
    try {
      // upload images
      const urls = await Promise.all(imageFiles.map(uploadImage))

      const keywords = data.keywordsInput
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
      if (!keywords.length) {
        alert('Enter at least one keyword')
        setSubmitting(false)
        return
      }

      const payload: CreatePostPayload = {
        title: data.type === 'room' ? data.title.trim() : '',
        description: data.description.trim(),
        address: data.type === 'room' ? data.address.trim() : '',
        images: urls,
        userId: user.uid,
        type: data.type,
        price: data.type === 'room' ? data.price : undefined,
        bedrooms: data.type === 'room' ? data.bedrooms : 0,
        bathrooms: data.type === 'room' ? data.bathrooms : 0,
        furnished: data.type === 'room' ? data.furnished : false,
        keywords,
      }

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)

      // reset and redirect
      reset({
        type: 'room',
        title: '',
        description: '',
        price: undefined,
        bedrooms: 1,
        bathrooms: 1,
        furnished: false,
        address: '',
        keywordsInput: '',
      })
      setImageFiles([])
      setImagePreviews([])
      router.push(data.type === 'room' ? '/discover/rooms' : '/discover/roommates')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>
        Error loading Maps SDK
      </Typography>
    )
  }
  if (!isLoaded) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at top left, ${theme.palette.primary.light}33, ${theme.palette.primary.dark}11)`,
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 8 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          position: 'relative',
          p: { xs: 3, md: 5 },
          width: '100%',
          maxWidth: 600,
          borderRadius: 4,
          background: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: theme.palette.primary.dark,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: 1,
          }}
        >
          Create a {selectedType === 'room' ? 'Room' : 'Roommate'} Post
        </Typography>

        <Box
          sx={{
            position: 'absolute',
            top: -36,
            right: -36,
            bgcolor: alpha(theme.palette.primary.main, 0.3),
            width: 80,
            height: 80,
            borderRadius: '50%',
            transform: 'rotate(45deg)',
            zIndex: -1,
          }}
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Post Type */}
          <TextField
            select
            label="Post Type"
            fullWidth
            {...register('type')}
            value={selectedType}
            sx={{ mb: 4 }}
          >
            <MenuItem value="room">
              <HomeIcon sx={{ mr: 1 }} /> Room
            </MenuItem>
            <MenuItem value="roommate">
              <PersonIcon sx={{ mr: 1 }} /> Roommate
            </MenuItem>
          </TextField>

          {/* Title + AI */}
          {selectedType === 'room' && (
            <>
              <TextField
                label="Title"
                fullWidth
                {...register('title', { required: 'Required' })}
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={onGenerateTitle}
                disabled={generatingTitle || !currentDescription.trim()}
                startIcon={generatingTitle ? <CircularProgress size={16} /> : <LightbulbIcon />}
                sx={{ mb: 3 }}
              >
                {generatingTitle ? 'Generating…' : 'Generate Title'}
              </Button>
            </>
          )}

          {/* Description + AI */}
          <TextField
            label={
              selectedType === 'room'
                ? 'Description (e.g. 2BR furnished…)'
                : 'Describe the roommate you’re looking for'
            }
            fullWidth
            multiline
            rows={4}
            {...register('description', { required: 'Required' })}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            onClick={onProofreadDescription}
            disabled={proofreading || !currentDescription.trim()}
            startIcon={proofreading ? <CircularProgress size={16} /> : <SpellcheckIcon />}
            sx={{ mb: 4 }}
          >
            {proofreading ? 'Proofreading…' : 'Proofread'}
          </Button>

          {/* Keywords */}
          <TextField
            label="Keywords (comma-separated)"
            fullWidth
            {...register('keywordsInput', { required: 'Enter at least one keyword' })}
            error={!!errors.keywordsInput}
            helperText={errors.keywordsInput?.message}
            sx={{ mb: 4 }}
          />

          {/* Price */}
          {selectedType === 'room' && (
            <TextField
              label="Price (USD/mo)"
              type="number"
              fullWidth
              {...register('price', {
                required: 'Required',
                min: { value: 1, message: 'Must be > 0' },
                valueAsNumber: true,
              })}
              error={!!errors.price}
              helperText={errors.price?.message}
              sx={{ mb: 3 }}
            />
          )}

          {/* Bedrooms */}
          {selectedType === 'room' && (
            <TextField select label="Bedrooms" fullWidth {...register('bedrooms')} sx={{ mb: 3 }}>
              {[1, 2, 3, 4].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Bathrooms */}
          {selectedType === 'room' && (
            <TextField select label="Bathrooms" fullWidth {...register('bathrooms')} sx={{ mb: 3 }}>
              {[1, 2, 3].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Furnished */}
          {selectedType === 'room' && (
            <FormControlLabel
              control={<Checkbox {...register('furnished')} />}
              label="Furnished"
              sx={{ mb: 4 }}
            />
          )}

          {/* Address with Autocomplete */}
          {selectedType === 'room' && (
            <Controller
              name="address"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <Autocomplete onLoad={onLoad} onPlaceChanged={() => onPlaceChanged(onChange)}>
                  <TextField
                    label="Address"
                    fullWidth
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    sx={{ mb: 4 }}
                  />
                </Autocomplete>
              )}
            />
          )}

          {/* Image Upload */}
          <Button variant="outlined" component="label" fullWidth sx={{ mb: 4 }}>
            <PhotoCameraIcon sx={{ mr: 1 }} />
            {imagePreviews.length ? 'Add/Change Images' : 'Upload Images'}
            <input type="file" accept="image/*" hidden multiple onChange={handleFileChange} />
          </Button>
          {imagePreviews.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 4,
                overflowX: 'auto',
                py: 1,
                px: 1,
                backgroundColor: alpha('#ffffff', 0.1),
                borderRadius: 2,
              }}
            >
              {imagePreviews.map((src, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => removeImageAt(i)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <Box component="img" src={src} alt={`preview-${i}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          )}

          <Button type="submit" variant="contained" fullWidth disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit Post'}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
