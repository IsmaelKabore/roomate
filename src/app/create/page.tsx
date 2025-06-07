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
  keywords: string[]
}

// Static array for Google Maps libraries
const MAP_LIBRARIES: ('places')[] = ['places']

export default function CreatePostPage() {
  const router = useRouter()
  const theme = useTheme()

  // react-hook-form setup
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
      address: '',
      keywordsInput: '',
    },
  })
  const selectedType = watch('type')
  const currentDescription = watch('description')

  // Google Maps Autocomplete
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

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // AI Buttons state (currently just placeholders)
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const [proofreading, setProofreading] = useState(false)

  const onGenerateTitle = () => {
    console.log('Generate Title clicked – implement if needed')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      newFiles.push(files[i])
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(files[i])
    }
    setImageFiles((prev) => [...prev, ...newFiles])
  }

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle “Proofread Description” (optional server route)
  async function onProofreadDescription(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> {
    if (currentDescription.trim().length === 0) {
      alert('Description is empty. Please provide a description to proofread.')
      return
    }

    setProofreading(true)
    try {
      const response = await fetch('/api/posts/proofreadDescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: currentDescription }),
      })
      if (!response.ok) {
        throw new Error('Failed to proofread the description.')
      }
      const { polished } = await response.json()
      reset(
        {
          ...watch(),
          description: polished,
        },
        { keepErrors: true, keepDirty: true, keepTouched: true }
      )
      alert('Description has been proofread and updated.')
    } catch (error: any) {
      console.error('Error proofreading description:', error)
      alert(error.message || 'Unknown error while proofreading.')
    } finally {
      setProofreading(false)
    }
  }

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

    // 1) Upload all images
    const uploadPromises = imageFiles.map((file) => uploadImage(file))
    const imageUrls = await Promise.all(uploadPromises)

    // 2) Build keyword array
    const keywordsArray = data.keywordsInput
      .split(',')
      .map((kw) => kw.trim().toLowerCase())
      .filter((kw) => kw.length > 0)

    if (keywordsArray.length === 0) {
      alert('Enter at least one keyword (comma-separated)')
      setSubmitting(false)
      return
    }

    // 3) Build payload
    const payload: CreatePostPayload = {
      title: selectedType === 'room' ? data.title : '',
      description: data.description,
      address: selectedType === 'room' ? data.address : '',
      images: imageUrls,
      userId: user.uid,
      type: selectedType,
      keywords: keywordsArray,
    }
    if (selectedType === 'room' && data.price !== undefined) {
      payload.price = data.price
    }

    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || 'Failed to create post')
      }
      // Optionally use body.id
      reset({
        type: 'room',
        title: '',
        description: '',
        price: undefined,
        address: '',
        keywordsInput: '',
      })
      setImageFiles([])
      setImagePreviews([])
      router.push(selectedType === 'room' ? '/discover/rooms' : '/discover/roommates')
    } catch (err: any) {
      console.error('Error creating post:', err)
      alert(err.message || 'An unknown error occurred')
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
            sx={{
              mb: 4,
              '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: theme.palette.primary.dark,
                },
              '& .MuiInputBase-input': { color: theme.palette.primary.dark },
            }}
          >
            <MenuItem value="room">
              <HomeIcon sx={{ mr: 1, color: theme.palette.primary.main }} /> Room
            </MenuItem>
            <MenuItem value="roommate">
              <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} /> Roommate
            </MenuItem>
          </TextField>

          {/* Title (only if room) */}
          {selectedType === 'room' && (
            <TextField
              label="Title"
              fullWidth
              {...register('title', { required: 'Required' })}
              error={!!errors.title}
              helperText={errors.title?.message}
              sx={{
                mb: 4,
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                  {
                    borderColor: theme.palette.primary.dark,
                  },
                '& .MuiInputBase-input': { color: theme.palette.primary.dark },
              }}
            />
          )}

          {/* Description */}
          <TextField
            label={
              selectedType === 'room'
                ? 'Description (e.g. 2BR furnished apartment…)'
                : 'Describe the roommate you’re looking for'
            }
            fullWidth
            multiline
            rows={4}
            {...register('description', { required: 'Required' })}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: theme.palette.primary.dark,
                },
              '& .MuiInputBase-input': { color: theme.palette.primary.dark },
            }}
          />

          {/* AI Buttons (optional) */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {selectedType === 'room' && (
              <Button
                variant="outlined"
                onClick={onGenerateTitle}
                disabled={generatingTitle || currentDescription.trim().length === 0}
                startIcon={
                  generatingTitle ? <CircularProgress size={16} color="inherit" /> : <LightbulbIcon />
                }
                sx={{
                  flex: 1,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.light, 0.2),
                    borderColor: theme.palette.primary.dark,
                  },
                }}
              >
                Generate Catchy Title
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={onProofreadDescription}
              disabled={proofreading || currentDescription.trim().length === 0}
              startIcon={
                proofreading ? <CircularProgress size={16} color="inherit" /> : <SpellcheckIcon />
              }
              sx={{
                flex: 1,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                textTransform: 'none',
                px: 2,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.light, 0.2),
                  borderColor: theme.palette.primary.dark,
                },
              }}
            >
              Proofread Description
            </Button>
          </Box>

          {/* Keywords (comma-separated) */}
          <TextField
            label="Keywords (comma-separated)"
            fullWidth
            {...register('keywordsInput', { required: 'Enter at least one keyword' })}
            error={!!errors.keywordsInput}
            helperText={errors.keywordsInput?.message || 'e.g. furnished, 2BR, near campus'}
            sx={{
              mb: 4,
              '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.dark,
              },
              '& .MuiInputBase-input': { color: theme.palette.primary.dark },
            }}
          />

          {/* Price (only if room) */}
          {selectedType === 'room' && (
            <TextField
              label="Price (USD/mo)"
              type="number"
              fullWidth
              {...register('price', {
                required: 'Required',
                min: { value: 1, message: 'Must be > 0' },
              })}
              error={!!errors.price}
              helperText={errors.price?.message}
              sx={{
                mb: 4,
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.dark,
                },
                '& .MuiInputBase-input': { color: theme.palette.primary.dark },
              }}
            />
          )}

          {/* Address (only if room) */}
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
                    sx={{
                      mb: 4,
                      '& .MuiInputLabel-root': { color: theme.palette.primary.main },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.dark,
                      },
                      '& .MuiInputBase-input': { color: theme.palette.primary.dark },
                    }}
                  />
                </Autocomplete>
              )}
            />
          )}

          {/* MULTIPLE Image Upload */}
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              mb: 4,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              textTransform: 'none',
              px: 2,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.light, 0.2),
                borderColor: theme.palette.primary.dark,
              },
            }}
          >
            <PhotoCameraIcon sx={{ mr: 1 }} />
            {imagePreviews.length > 0 ? 'Add/Change Images' : 'Upload Images'}
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
              {imagePreviews.map((src, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: 'relative',
                    minWidth: 100,
                    minHeight: 100,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => removeImageAt(idx)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: alpha('#FFFFFF', 0.8),
                      '&:hover': { backgroundColor: '#FFFFFF' },
                      zIndex: 10,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <Box
                    component="img"
                    src={src}
                    alt={`preview-${idx}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              '&:hover': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Post'}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
