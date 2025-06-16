'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { auth, db } from '@/lib/firebaseConfig'
import { uploadImage } from '@/lib/uploadImage'
import DeleteIcon from '@mui/icons-material/Delete'
import { doc, getDoc as firebaseGetDoc } from 'firebase/firestore'

type FormValues = {
  title: string
  description: string
  price?: number
  address: string
  keywordsInput: string
}

interface PostData {
  id: string
  userId: string
  title: string
  description: string
  price?: number
  address: string
  images: string[]
  type: 'room' | 'roommate'
  keywords: string[]
  embedding: number[]
}

interface UpdatePostPayload {
  postId: string
  userId: string
  title: string
  description: string
  address: string
  price?: number
  images: string[]
  type: 'room' | 'roommate'
  keywords: string[]
}

const LIBRARIES = ['places'] as const

export default function EditPostPage() {
  const { id } = useParams() as { id?: string }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<PostData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      price: undefined,
      address: '',
      keywordsInput: '',
    },
  })

  // Google Maps Autocomplete
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: [...LIBRARIES],
  })
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onLoadAutocomplete = (ac: google.maps.places.Autocomplete) => {
    autoRef.current = ac
  }
  const onPlaceChanged = (onChange: (value: string) => void) => {
    const place = autoRef.current?.getPlace()
    if (place?.formatted_address) {
      onChange(place.formatted_address)
    }
  }

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
      setImageFiles((prev) => [...prev, file])
    })
  }

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // 1) Fetch the post once on mount
  useEffect(() => {
    if (!id) {
      setError('No post ID provided')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const postRef = doc(db, 'posts', id)
        const snap = await firebaseGetDoc(postRef)
        if (!snap.exists()) {
          setError('Post not found')
          return
        }
        const data = snap.data() as any
        if (auth.currentUser?.uid !== data.userId) {
          setError('You do not have permission to edit this post.')
          return
        }
        const fetched: PostData = {
          id: snap.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          price: data.price,
          address: data.address,
          images: data.images || [],
          type: data.type,
          keywords: data.keywords || [],
          embedding: data.embedding || [],
        }
        setPost(fetched)
        reset({
          title: fetched.title,
          description: fetched.description,
          price: fetched.price,
          address: fetched.address,
          keywordsInput: fetched.keywords.join(', '),
        })
        setImagePreviews(fetched.images)
      } catch (e) {
        console.error('Error loading post:', e)
        setError('Failed to load post.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, reset])

  // 2) Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!post) return
    setLoading(true)
    const user = auth.currentUser
    if (!user) {
      alert('Log in first')
      setLoading(false)
      return
    }

    try {
      // 2a) Upload new images
      const newUrls = await Promise.all(
        imageFiles.map((file) => uploadImage(file))
      )
      // 2b) Combine with existing previews
      const finalImages = [...post.images, ...newUrls]
      // 2c) Parse keywordsInput → string[]
      const keywordsArray = data.keywordsInput
        .split(',')
        .map((kw) => kw.trim().toLowerCase())
        .filter((kw) => kw.length > 0)
      if (keywordsArray.length === 0) {
        alert('Enter at least one keyword (comma-separated)')
        setLoading(false)
        return
      }

      // 2d) Build payload for update
      const payload: UpdatePostPayload = {
        postId: post.id,
        userId: user.uid,
        title: data.title.trim(),
        description: data.description.trim(),
        address: data.address.trim(),
        price: data.price,
        images: finalImages,
        type: post.type,
        keywords: keywordsArray,
      }

      const res = await fetch('/api/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update post')
      }

      // redirect back to discovery
      router.push(
        post.type === 'room' ? '/discover/rooms' : '/discover/roommates'
      )
    } catch (e: any) {
      console.error('Error updating post:', e)
      alert(e.message || 'Failed to update post.')
      setLoading(false)
    }
  }

  // Loading / error states
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  // 4) Render form
  return (
    <Box
      sx={{
        p: 2,
        background: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 600, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 3, color: '#1976d2' }}>
          Edit {post!.type === 'room' ? 'Room' : 'Roommate'} Post
        </Typography>

        {loadError && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error loading Maps SDK
          </Typography>
        )}
        {!isLoaded && !loadError && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {isLoaded && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Title (if room) */}
            {post!.type === 'room' && (
              <TextField
                label="Title"
                fullWidth
                {...register('title', { required: 'Required' })}
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 3 }}
              />
            )}

            {/* Description */}
            <TextField
              label={
                post!.type === 'room'
                  ? 'Description (e.g. 2BR furnished apartment…)'
                  : 'Describe the roommate you’re looking for'
              }
              fullWidth
              multiline
              rows={4}
              {...register('description', { required: 'Required' })}
              error={!!errors.description}
              helperText={errors.description?.message}
              sx={{ mb: 3 }}
            />

            {/* Keywords */}
            <TextField
              label="Keywords (comma-separated)"
              fullWidth
              {...register('keywordsInput', {
                required: 'Enter at least one keyword',
              })}
              error={!!errors.keywordsInput}
              helperText={
                errors.keywordsInput?.message ||
                'e.g. furnished, 2BR, near campus'
              }
              sx={{ mb: 3 }}
            />

            {/* Price */}
            {post!.type === 'room' && (
              <TextField
                label="Price (USD/mo)"
                type="number"
                fullWidth
                {...register('price', {
                  required: 'Required',
                  min: { value: 1, message: '> 0' },
                })}
                error={!!errors.price}
                helperText={errors.price?.message}
                sx={{ mb: 3 }}
              />
            )}

            {/* Address */}
            {post!.type === 'room' && (
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={() => onPlaceChanged(onChange)}
                  >
                    <TextField
                      label="Address"
                      fullWidth
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                      sx={{ mb: 3 }}
                    />
                  </Autocomplete>
                )}
              />
            )}

            {/* Existing Image Previews */}
            {imagePreviews.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 3,
                  overflowX: 'auto',
                  p: 1,
                  background: '#fafafa',
                  borderRadius: 1,
                }}
              >
                {imagePreviews.map((src, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'relative',
                      minWidth: 100,
                      minHeight: 100,
                      borderRadius: 1,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => removeImageAt(idx)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
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
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Upload New Images */}
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 3 }}
            >
              {imagePreviews.length > 0
                ? 'Add/Change Images'
                : 'Upload Images'}
              <input
                type="file"
                accept="image/*"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                background: '#1976d2',
                '&:hover': { background: '#1565c0' },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  )
}
