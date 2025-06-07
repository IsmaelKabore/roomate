// File: src/app/discover/DiscoverSelector.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Box,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
} from '@mui/material'
import { useEffect, useState } from 'react'

const discoverOptions = [
  { label: 'Rooms Available', value: '/discover/rooms' },
  { label: 'People Looking for Roommates', value: '/discover/roommates' },
]

export default function DiscoverSelector({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value
    if (value !== '') router.push(value)
  }

  // Prevent SSR mismatch on first render
  if (!mounted) return null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #ffffff, #EFF6FF)',
        color: '#1e293b',
        px: 4,
        py: 6,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: '#1E40AF',
          textAlign: 'center',
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
        }}
      >
        Discover
      </Typography>

      <Select
        value={
          pathname === '/discover'
            ? ''
            : pathname?.startsWith('/discover')
            ? pathname
            : ''
        }
        onChange={handleChange}
        variant="outlined"
        displayEmpty
        sx={{
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: 3,
          minWidth: 300,
          px: 1,
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          '&:hover': {
            border: '1px solid #3B82F6',
            boxShadow: '0 6px 24px rgba(59, 130, 246, 0.2)',
          },
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B82F6',
          },
          '& .MuiSvgIcon-root': {
            color: '#3B82F6',
            filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.6))',
          },
          '& .MuiSelect-select': {
            color: '#1e293b',
            fontWeight: 500,
            py: 1.5,
          },
        }}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: '#94a3b8' }}>Select option...</span>
          }
          const selectedOption = discoverOptions.find((opt) => opt.value === selected)
          return selectedOption?.label || 'Select option...'
        }}
      >
        {/* Empty default so “Select option…” shows initially */}
        <MenuItem value="">
          <em style={{ color: '#94a3b8' }}>Select option...</em>
        </MenuItem>
        {discoverOptions.map((opt) => (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{
              color: '#1e293b',
              fontWeight: 500,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#1E40AF',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#1E40AF',
              },
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      {children}
    </Box>
  )
}
