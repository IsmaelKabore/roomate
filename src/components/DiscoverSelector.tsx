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
    const value = e.target.value
    if (value !== '') router.push(value)
  }

  // Prevent SSR mismatch on first render
  if (!mounted) return null

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
        px: 4,
        py: 6
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 2, 
          fontWeight: 700, 
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Discover
      </Typography>

      <Select
        value={pathname && pathname.startsWith('/discover') ? pathname : ''}
        onChange={handleChange}
        variant="outlined"
        displayEmpty
        className="dark-card"
        sx={{
          mb: 4,
          backgroundColor: 'var(--background-card)',
          color: 'var(--foreground)',
          borderRadius: '12px',
          minWidth: 280,
          '.MuiOutlinedInput-notchedOutline': { 
            borderColor: 'var(--border)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { 
            borderColor: 'var(--primary)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary)',
          },
          '& .MuiSvgIcon-root': { 
            color: 'var(--primary)',
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: 'var(--background-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-dark)',
            }
          }
        }}
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: 'var(--foreground-secondary)' }}>Select...</span>
          }
          const selectedOption = discoverOptions.find(opt => opt.value === selected)
          return selectedOption?.label || 'Select...'
        }}
      >
        {/* Empty option so "Select..." shows up initially */}
        <MenuItem 
          value=""
          sx={{
            color: 'var(--foreground-secondary)',
            '&:hover': {
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
            }
          }}
        >
          <em>Select...</em>
        </MenuItem>

        {discoverOptions.map((opt) => (
          <MenuItem 
            key={opt.value} 
            value={opt.value} 
            sx={{ 
              color: 'var(--foreground)',
              '&:hover': {
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
              }
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
