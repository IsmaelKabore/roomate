'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Box, MenuItem, Select, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const discoverOptions = [
  { label: 'Rooms Available', value: '/discover/rooms' },
  { label: 'People Looking for Roommates', value: '/discover/roommates' }
]

export default function DiscoverSelector({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: any) => {
    router.push(e.target.value)
  }

  // Prevent SSR mismatch on first render
  if (!mounted) return null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
        color: '#e0e0e0',
        px: 4,
        py: 6
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#9be7ff' }}>
        Discover
      </Typography>

      <Select
        value={pathname}
        onChange={handleChange}
        variant="outlined"
        sx={{
          mb: 4,
          backgroundColor: '#2a2a40',
          color: '#9be7ff',
          borderRadius: 2,
          '.MuiOutlinedInput-notchedOutline': { borderColor: '#81d4fa' },
          '& .MuiSvgIcon-root': { color: '#9be7ff' }
        }}
      >
        {discoverOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      {children}
    </Box>
  )
}
