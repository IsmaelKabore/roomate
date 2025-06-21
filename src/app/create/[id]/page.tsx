// File: src/app/create/[id]/page.tsx
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
  MenuItem,
  FormControlLabel,
  Checkbox,
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
  price: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  address: string
  keywordsInput: string
}

interface PostData {
  id: string
  userId: string
  title: string
  description: string
  price?: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  address: string
  images: string[]
  type: 'room' | 'roommate'
  keywords: string[]
}

interface UpdatePostPayload {
  postId: string
  userId: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  address: string
  images: string[]
  type: 'room' | 'roommate'
  keywords: string[]
}

// truly static
const MAP_LIBRARIES: Array<'places'> = ['places']

export default function EditPostPage() {
  const { id } = useParams() as { id?: string }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [post, setPost] = useState<PostData | null>(null)

  // separate arrays for originals vs newly added
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      furnished: false,
      address: '',
      keywordsInput: '',
    },
  })

  const currentDescription = watch('description')

  // Google Maps SDK
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: MAP_LIBRARIES,
  })
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onLoadAutocomplete = (ac: google.maps.places.Autocomplete) => {
    autoRef.current = ac
  }
  const onPlaceChanged = (onChange: (v: string) => void) => {
    const place = autoRef.current?.getPlace()
    if (place?.formatted_address) onChange(place.formatted_address)
  }

  // load post on mount
  useEffect(() => {
    if (!id) {
      setError('No post ID provided')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const ref = doc(db, 'posts', id)
        const snap = await firebaseGetDoc(ref)
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
          // <- fix: price comes from top‐level field
          price: data.price ?? 0,
          bedrooms: data.structured?.bedrooms ?? 1,
          bathrooms: data.structured?.bathrooms ?? 1,
          furnished: data.structured?.furnished ?? false,
          address: data.address,
          images: data.images || [],
          type: data.type,
          keywords: data.keywords || [],
        }
        setPost(fetched)

        // reset form
        reset({
          title: fetched.title,
          description: fetched.description,
          price: fetched.price!,
          bedrooms: fetched.bedrooms,
          bathrooms: fetched.bathrooms,
          furnished: fetched.furnished,
          address: fetched.address,
          keywordsInput: fetched.keywords.join(', '),
        })

        // set image buckets
        setExistingImages(fetched.images)
        setNewFiles([])
        setNewPreviews([])
      } catch (e) {
        console.error(e)
        setError('Failed to load post.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, reset])

  // file handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    setNewFiles(prev => [...prev, ...Array.from(files)])
  }
  const removeImageAt = (i: number) => {
    if (i < existingImages.length) {
      setExistingImages(prev => prev.filter((_, idx) => idx !== i))
    } else {
      const ni = i - existingImages.length
      setNewFiles(prev => prev.filter((_, idx) => idx !== ni))
      setNewPreviews(prev => prev.filter((_, idx) => idx !== ni))
    }
  }

  // submit
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
      // upload only new files
      const newUrls = await Promise.all(newFiles.map(uploadImage))
      const finalImages = [...existingImages, ...newUrls]

      // keywords
      const keywords = data.keywordsInput
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k)
      if (keywords.length === 0) {
        alert('Enter at least one keyword')
        setLoading(false)
        return
      }

      const payload: UpdatePostPayload = {
        postId: post.id,
        userId: user.uid,
        title: data.title.trim(),
        description: data.description.trim(),
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        furnished: data.furnished,
        address: data.address.trim(),
        images: finalImages,
        type: post.type,
        keywords,
      }

      const res = await fetch('/api/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to update post')
      router.push(post.type === 'room' ? '/discover/rooms' : '/discover/roommates')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Update failed.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress size={48} />
      </Box>
    )
  }
  if (error) {
    return (
      <Box textAlign="center" mt={6}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

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
        <Typography variant="h4" sx={{ mb: 3 }}>
          Edit {post!.type === 'room' ? 'Room' : 'Roommate'} Post
        </Typography>

        {loadError && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error loading Maps SDK
          </Typography>
        )}
        {!isLoaded && !loadError && (
          <Box textAlign="center" mb={2}>
            <CircularProgress />
          </Box>
        )}

        {isLoaded && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Title */}
            {post!.type === 'room' && (
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ mb: 3 }}
                  />
                )}
              />
            )}

            {/* Description */}
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={
                    post!.type === 'room'
                      ? 'Description (e.g. 2BR furnished…)'
                      : 'Describe the roommate you’re looking for'
                  }
                  multiline
                  rows={4}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 3 }}
                />
              )}
            />

            {/* Price */}
            {post!.type === 'room' && (
              <Controller
                name="price"
                control={control}
                rules={{
                  required: 'Required',
                  min: { value: 1, message: 'Must be > 0' },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Price (USD/mo)"
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ mb: 3 }}
                  />
                )}
              />
            )}

            {/* Bedrooms */}
            {post!.type === 'room' && (
              <Controller
                name="bedrooms"
                control={control}
                render={({ field }) => (
                  <TextField select label="Bedrooms" fullWidth {...field} sx={{ mb: 3 }}>
                    {[1, 2, 3, 4].map(n => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}

            {/* Bathrooms */}
            {post!.type === 'room' && (
              <Controller
                name="bathrooms"
                control={control}
                render={({ field }) => (
                  <TextField select label="Bathrooms" fullWidth {...field} sx={{ mb: 3 }}>
                    {[1, 2, 3].map(n => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}

            {/* Furnished */}
            {post!.type === 'room' && (
              <Controller
                name="furnished"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Furnished"
                    sx={{ mb: 3 }}
                  />
                )}
              />
            )}

            {/* Address */}
            {post!.type === 'room' && (
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={() => onPlaceChanged(field.onChange)}
                  >
                    <TextField
                      {...field}
                      label="Address"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ mb: 3 }}
                    />
                  </Autocomplete>
                )}
              />
            )}

            {/* Keywords */}
            <Controller
              name="keywordsInput"
              control={control}
              rules={{ required: 'Enter at least one keyword' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Keywords (comma-separated)"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 3 }}
                />
              )}
            />

            {/* Images */}
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 3 }}>
              {existingImages.length + newPreviews.length > 0
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

            <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto' }}>
              {[...existingImages, ...newPreviews].map((src, idx) => (
                <Box key={idx} sx={{ position: 'relative', width: 100, height: 100 }}>
                  <IconButton
                    size="small"
                    onClick={() => removeImageAt(idx)}
                    sx={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Box
                    component="img"
                    src={src}
                    alt={`preview-${idx}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>

            <Button type="submit" variant="contained" fullWidth>
              Save Changes
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  )
}
