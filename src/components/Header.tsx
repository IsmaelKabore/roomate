'use client'

import Link from 'next/link'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import Image from 'next/image'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Discover', href: '/discover' },
  { label: 'My Posts', href: '/my-posts' },
  { label: 'Profile', href: '/profile' }
]

export default function Header() {
  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(to right, #0f172a, #1e293b)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Homigo Logo"
            width={40}
            height={40}
            priority
            style={{ borderRadius: '8px' }}
          />
          <span className="text-white font-semibold text-lg hidden sm:inline">Homigo</span>
        </Link>

        {/* Right: Navigation */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {navItems.map(({ label, href }) => (
            <Link key={href} href={href}>
              <Button
                color="inherit"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  letterSpacing: 1.2,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {label}
              </Button>
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
