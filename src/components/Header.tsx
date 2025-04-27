'use client'

import Link from 'next/link'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import Image from 'next/image'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Discover', href: '/discover' },
  { label: 'My Posts', href: '/my-posts' },
  { label: 'Profile', href: '/profile' },
  { label: 'Inbox', href: '/messages' },
]

export default function Header() {
  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        paddingY: 1,
        zIndex: 1000,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Eazy Logo"
            width={70}
            height={70}
            priority
            style={{ borderRadius: '8px' }}
          />
         
        </Link>

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {navItems.map(({ label, href }) => (
            <Link key={href} href={href}>
              <Button
                sx={{
                  color: '#2563eb',
                  fontWeight: '600',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: '#e0f2fe',
                  },
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
