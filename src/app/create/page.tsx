'use client'

import { useForm } from 'react-hook-form'
import {
  Box, Button, TextField, Typography, MenuItem, Paper
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FormValues = {
  type: 'room' | 'roommate'
  title: string
  description: string
  price: string
  address: string
  image: string
}

export default function CreatePostPage() {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      type: 'room',
      title: '',
      description: '',
      price: '',
      address: '',
      image: ''
    }
  });

  const [imageFile, setImageFile] = useState<File | null>(null)
  const router = useRouter()

  const onSubmit = (data: FormValues) => {
    const imageURL = imageFile ? URL.createObjectURL(imageFile) : ''

    const newPost = {
      ...data,
      image: imageURL
    }

    const key = data.type === 'room' ? 'room_posts' : 'roommate_posts'
    const existingPosts = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([...existingPosts, newPost]))

    reset()
    router.push(data.type === 'room' ? '/discover/rooms' : '/discover/roommates')
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',  // 🌟 Bright clean background for the WHOLE page
      p: 2
    }}>
      <Paper elevation={6} sx={{ 
        p: 4, 
        width: '100%', 
        maxWidth: 600, 
        borderRadius: 4,
        background: '#ffffff',  // 🌟 White paper (not dark anymore)
        color: '#333',          // 🌟 Dark text (easy to read)
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)' // 🌟 Softer nice shadow
      }}>
        <Typography variant="h4" sx={{ mb: 4, color: '#1976d2', fontWeight: 600 }}>
          Create a New Post
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            select
            label="Type"
            fullWidth
            defaultValue="room"
            {...register('type', { required: true })}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: '#1976d2' } }}
          >
            <MenuItem value="room">Room</MenuItem>
            <MenuItem value="roommate">Roommate</MenuItem>
          </TextField>

          <TextField
            label="Title"
            fullWidth
            {...register('title', { required: true })}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: '#1976d2' } }}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            {...register('description', { required: true })}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: '#1976d2' } }}
          />

          <TextField
            label="Price"
            type="number"
            fullWidth
            {...register('price', { required: true })}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: '#1976d2' } }}
          />

          <TextField
            label="Address"
            fullWidth
            {...register('address', { required: true })}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: '#1976d2' } }}
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ 
              mb: 3, 
              color: '#1976d2', 
              borderColor: '#1976d2',
              fontWeight: 600
            }}
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0])
                }
              }}
            />
          </Button>

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ 
              background: '#1976d2',
              fontWeight: 600,
              '&:hover': { background: '#1565c0' }
            }}
          >
            Submit Post
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
