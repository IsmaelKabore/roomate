'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Chip,
  IconButton,
  Stack,
  useTheme,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import BedIcon from '@mui/icons-material/Bed'
import BathtubIcon from '@mui/icons-material/Bathtub'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { onAuthStateChanged } from 'firebase/auth'
import Link from 'next/link'
import RequireAuth from '@/components/RequireAuth'
import { auth, db } from '@/lib/firebaseConfig'
import { getPostsByUser } from '@/lib/firestorePosts'
import type { Timestamp } from 'firebase/firestore'
import { doc, deleteDoc } from 'firebase/firestore'

// Glass-morphic card
const FuturisticCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${theme.palette.primary.light}33`,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
  },
}))

type UserPost = {
  id: string
  userId: string
  title: string
  description: string
  price?: number
  address?: string
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  images: string[]
  type: 'room' | 'roommate'
  createdAt: Timestamp
}

export default function MyPostsPage() {
  const theme = useTheme()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // hex + alpha helper
  const alpha = (hex: string, a: number) =>
    hex + Math.round(a * 255).toString(16).padStart(2, '0')

  // Load user’s posts once authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const raw = await getPostsByUser(user.uid)
        const formatted: UserPost[] = raw.map((p) => {
          const common = {
            id: p.id,
            userId: p.userId,
            title: p.title,
            description: p.description,
            images: p.images,
            type: (p as any).type as 'room' | 'roommate',
            createdAt: p.createdAt,
          }
          if ((p as any).type === 'room') {
            return {
              ...common,
              price: (p as any).price,
              address: (p as any).address,
              bedrooms: (p as any).bedrooms,
              bathrooms: (p as any).bathrooms,
              furnished: (p as any).furnished,
            }
          } else {
            return common
          }
        })
        setPosts(formatted)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleDeleteClick = (id: string) => {
    setToDelete(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteDoc(doc(db, 'posts', toDelete))
      setPosts((ps) => ps.filter((x) => x.id !== toDelete))
    } catch (e) {
      console.error(e)
      alert('Could not delete post.')
    } finally {
      setConfirmOpen(false)
      setToDelete(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress size={48} color="primary" />
      </Box>
    )
  }

  return (
    <RequireAuth>
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(160deg, ${alpha(
            theme.palette.primary.light,
            0.2
          )}, ${alpha(theme.palette.primary.main, 0.1)})`,
          py: { xs: 4, md: 8 },
          px: { xs: 2, md: 8 },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.dark,
              mb: 1,
              letterSpacing: 1,
            }}
          >
            My Posts
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, mb: 2, maxWidth: 600, mx: 'auto' }}
          >
            View, edit or delete any of your room or roommate listings.
          </Typography>
          <Link href="/create" passHref>
            <Button
              startIcon={<AddCircleOutlineIcon />}
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                color: '#fff',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                },
              }}
            >
              Create New Post
            </Button>
          </Link>
        </Box>

        {posts.length === 0 ? (
          <Typography variant="h6" color="text.secondary" align="center">
            You haven’t posted anything yet.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            }}
          >
            {posts.map((post) => {
              const daysAgo = Math.floor((Date.now() - post.createdAt.toMillis()) / 86400000)
              return (
                <FuturisticCard key={post.id}>
                  {/* Image */}
                  <Box
                    sx={{
                      height: 180,
                      width: '100%',
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {post.images.length ? (
                      <CardMedia
                        component="img"
                        image={post.images[0]}
                        alt={post.title}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          height: '120%',
                          width: 'auto',
                          transform: 'translate(-50%,-50%)',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <HomeIcon
                        sx={{ fontSize: 64, color: theme.palette.primary.main, mt: 6 }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ px: 3, py: 2, flexGrow: 1 }}>
                    {/* Badge and age */}
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Chip
                        icon={post.type === 'room' ? <HomeIcon /> : <PersonIcon />}
                        label={post.type === 'room' ? 'Room' : 'Roommate'}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.light, 0.2),
                          color: theme.palette.primary.dark,
                          fontWeight: 600,
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        color: theme.palette.primary.dark,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        height: '2.4em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        color: theme.palette.text.secondary,
                        lineHeight: 1.4,
                        height: '3.6em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {post.description}
                    </Typography>

                    {/* Price */}
                    {post.type === 'room' && post.price != null && (
                      <Typography
                        variant="subtitle1"
                        sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}
                      >
                        ${post.price.toLocaleString()}/mo
                      </Typography>
                    )}

                    {/* Structured details */}
                    {post.type === 'room' && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                        {post.bedrooms != null && (
                          <Chip
                            icon={<BedIcon />}
                            label={`${post.bedrooms} bed`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {post.bathrooms != null && (
                          <Chip
                            icon={<BathtubIcon />}
                            label={`${post.bathrooms} bath`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {post.furnished && (
                          <Chip
                            icon={<CheckBoxIcon />}
                            label="Furnished"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <Link href={`/create/${post.id}`} passHref>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{
                          color: theme.palette.primary.dark,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.light, 0.3),
                          },
                        }}
                      >
                        Edit
                      </Button>
                    </Link>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(post.id)}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </FuturisticCard>
              )
            })}
          </Box>
        )}

        {/* Delete confirmation */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Delete this post?</DialogTitle>
          <DialogContent>
            <Typography>This cannot be undone. Continue?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </RequireAuth>
  )
}
