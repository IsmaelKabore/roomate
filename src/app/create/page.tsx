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
  Chip,
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
import AddIcon from '@mui/icons-material/Add'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { GOOGLE_MAPS_API_KEY, MAP_LIBRARIES } from '@/lib/mapsConfig'

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

export default function CreatePostPage() {
  const router = useRouter()

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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
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

  // Handle "Proofread Description" (optional server route)
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
      const text = await res.text()
      let body
      try {
        body = JSON.parse(text)
      } catch (e) {
        console.error('Non-JSON response:', text)
        throw new Error('Server error: invalid response format')
      }
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--gradient-background)',
        }}
      >
        <Typography sx={{ color: '#ef4444', fontSize: '1.1rem', textAlign: 'center' }}>
          Error loading Maps SDK
        </Typography>
      </Box>
    )
  }
  if (!isLoaded) {
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Paper
        elevation={0}
        className="dark-card"
        sx={{
          position: 'relative',
          p: { xs: 3, md: 5 },
          width: '100%',
          maxWidth: 700,
          borderRadius: '24px',
          background: 'var(--background-card)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
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
            {selectedType === 'room' ? (
              <HomeIcon sx={{ fontSize: 40, color: 'white' }} />
            ) : (
              <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
            )}
          </Box>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Create Your {selectedType === 'room' ? 'Room' : 'Roommate'} Listing
          </Typography>
          <Typography
            sx={{
              color: 'var(--foreground-secondary)',
              fontSize: '1.1rem',
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            {selectedType === 'room' 
              ? 'Share your space with the perfect roommate' 
              : 'Find your ideal living companion'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Post Type Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
              What are you looking for?
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="button"
                onClick={() => reset({ ...watch(), type: 'room' })}
                variant={selectedType === 'room' ? 'contained' : 'outlined'}
                startIcon={<HomeIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  ...(selectedType === 'room' ? {
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    '&:hover': {
                      background: 'var(--primary-hover)',
                    }
                  } : {
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--foreground-secondary)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--primary)',
                    }
                  })
                }}
              >
                List a Room
              </Button>
              <Button
                type="button"
                onClick={() => reset({ ...watch(), type: 'roommate' })}
                variant={selectedType === 'roommate' ? 'contained' : 'outlined'}
                startIcon={<PersonIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  ...(selectedType === 'roommate' ? {
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    '&:hover': {
                      background: 'var(--primary-hover)',
                    }
                  } : {
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--foreground-secondary)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--primary)',
                    }
                  })
                }}
              >
                Find a Roommate
              </Button>
            </Box>
          </Box>

          {/* Title (only if room) */}
          {selectedType === 'room' && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                Room Title
              </Typography>
              <TextField
                placeholder="e.g., Spacious bedroom in downtown apartment"
                fullWidth
                {...register('title', { required: 'Title is required' })}
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--foreground)',
                    '&:hover': {
                      border: '1px solid var(--primary)',
                    },
                    '&.Mui-focused': {
                      border: '1px solid var(--primary)',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& input::placeholder': {
                    color: 'var(--foreground-secondary)',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          )}

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
              Description
            </Typography>
            <TextField
              placeholder={
                selectedType === 'room'
                  ? 'Describe your room, amenities, and what you\'re looking for in a roommate...'
                  : 'Describe yourself and what you\'re looking for in a roommate and living situation...'
              }
              fullWidth
              multiline
              rows={4}
              {...register('description', { required: 'Description is required' })}
              error={!!errors.description}
              helperText={errors.description?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'var(--background-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--foreground)',
                  '&:hover': {
                    border: '1px solid var(--primary)',
                  },
                  '&.Mui-focused': {
                    border: '1px solid var(--primary)',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '& textarea::placeholder': {
                  color: 'var(--foreground-secondary)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* AI Enhancement Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            {selectedType === 'room' && (
              <Button
                type="button"
                variant="outlined"
                onClick={onGenerateTitle}
                disabled={generatingTitle || currentDescription.trim().length === 0}
                startIcon={
                  generatingTitle ? <CircularProgress size={16} color="inherit" /> : <LightbulbIcon />
                }
                sx={{
                  flex: { xs: '1 1 100%', sm: 1 },
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--primary)',
                  textTransform: 'none',
                  py: 1,
                  borderRadius: '12px',
                  fontWeight: 500,
                  '&:hover': {
                    background: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid var(--primary)',
                  },
                  '&:disabled': {
                    color: 'var(--foreground-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Generate Title
              </Button>
            )}

            <Button
              type="button"
              variant="outlined"
              onClick={onProofreadDescription}
              disabled={proofreading || currentDescription.trim().length === 0}
              startIcon={
                proofreading ? <CircularProgress size={16} color="inherit" /> : <SpellcheckIcon />
              }
              sx={{
                flex: { xs: '1 1 100%', sm: 1 },
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--primary)',
                textTransform: 'none',
                py: 1,
                borderRadius: '12px',
                fontWeight: 500,
                '&:hover': {
                  background: 'rgba(0, 122, 255, 0.1)',
                  border: '1px solid var(--primary)',
                },
                '&:disabled': {
                  color: 'var(--foreground-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Proofread Description
            </Button>
          </Box>

          {/* Keywords */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
              Keywords
            </Typography>
            <TextField
              placeholder="e.g., furnished, quiet, near campus, pet-friendly"
              fullWidth
              {...register('keywordsInput', { required: 'Enter at least one keyword' })}
              error={!!errors.keywordsInput}
              helperText={errors.keywordsInput?.message || 'Separate keywords with commas to help others find your listing'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'var(--background-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--foreground)',
                  '&:hover': {
                    border: '1px solid var(--primary)',
                  },
                  '&.Mui-focused': {
                    border: '1px solid var(--primary)',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '& input::placeholder': {
                  color: 'var(--foreground-secondary)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Price (only if room) */}
          {selectedType === 'room' && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                Monthly Rent
              </Typography>
              <TextField
                placeholder="1200"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <AttachMoneyIcon sx={{ color: 'var(--primary)', mr: 1 }} />,
                }}
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 1, message: 'Price must be greater than 0' },
                })}
                error={!!errors.price}
                helperText={errors.price?.message || 'Enter the monthly rent amount in USD'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--foreground)',
                    '&:hover': {
                      border: '1px solid var(--primary)',
                    },
                    '&.Mui-focused': {
                      border: '1px solid var(--primary)',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& input::placeholder': {
                    color: 'var(--foreground-secondary)',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          )}

          {/* Address (only if room) */}
          {selectedType === 'room' && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                Address
              </Typography>
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Address is required' }}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete onLoad={onLoad} onPlaceChanged={() => onPlaceChanged(onChange)}>
                    <TextField
                      placeholder="Start typing your address..."
                      fullWidth
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      error={!!errors.address}
                      helperText={errors.address?.message || 'We\'ll use this to help roommates find you'}
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ color: 'var(--primary)', mr: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'var(--background-secondary)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--foreground)',
                          '&:hover': {
                            border: '1px solid var(--primary)',
                          },
                          '&.Mui-focused': {
                            border: '1px solid var(--primary)',
                          },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& input::placeholder': {
                          color: 'var(--foreground-secondary)',
                          opacity: 1,
                        },
                      }}
                    />
                  </Autocomplete>
                )}
              />
            </Box>
          )}

          {/* Image Upload */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
              Photos
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<PhotoCameraIcon />}
              sx={{
                py: 2,
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                color: 'var(--foreground-secondary)',
                textTransform: 'none',
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '1rem',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px dashed var(--primary)',
                  color: 'var(--primary)',
                },
              }}
            >
              {imagePreviews.length > 0 ? `${imagePreviews.length} photo(s) selected - Add more` : 'Upload Photos'}
              <input type="file" accept="image/*" hidden multiple onChange={handleFileChange} />
            </Button>
            <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem', mt: 1 }}>
              Upload high-quality photos to attract more interest. First photo will be the main image.
            </Typography>
          </Box>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2, fontSize: '1rem' }}>
                Photo Preview
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2,
                  p: 3,
                  background: 'var(--background-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {imagePreviews.map((src, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {idx === 0 && (
                      <Chip
                        label="Main"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          zIndex: 2,
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeImageAt(idx)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        zIndex: 2,
                        '&:hover': {
                          background: 'rgba(0, 0, 0, 0.9)',
                        },
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
            </Box>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '16px',
              textTransform: 'none',
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
              },
              transition: 'all 0.3s ease',
            }}
          >
            {submitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} color="inherit" />
                Creating your listing...
              </Box>
            ) : (
              <>
                <AddIcon sx={{ mr: 1 }} />
                Publish Your Listing
              </>
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
