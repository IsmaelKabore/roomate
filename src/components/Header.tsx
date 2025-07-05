// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const accent = '#007AFF';

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Scroll detector
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    handleMenuClose();
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Drawer links for mobile
  const drawerLinks = [
    { href: '/', label: 'Home' },
    { href: '/discover', label: 'Discover' },
    ...(user
      ? [
          { href: '/my-posts', label: 'My Posts' },
          { href: '/messages', label: 'Inbox' },
        ]
      : []),
  ];

  return (
    <>
      <AppBar
        elevation={scrolled ? 4 : 0}
        sx={{
          position: 'fixed',
          top: scrolled ? theme.spacing(2) : 0,
          left: scrolled ? '50%' : 0,
          transform: scrolled ? 'translateX(-50%)' : 'none',
          width: scrolled ? '90%' : '100%',
          maxWidth: scrolled ? 800 : '100%',
          borderRadius: scrolled ? 4 : 0,
          bgcolor: scrolled ? 'rgba(107,114,128,0.6)' : '#ffffff',
          backdropFilter: 'blur(20px)',
          py: scrolled ? 0.5 : 1,
          transition: 'all 0.3s ease',
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: scrolled ? 48 : 64,
            justifyContent: 'space-between',
            transition: 'min-height 0.3s ease',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                transform: scrolled ? 'scale(0.7)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <Image
                src="/logo-transparent.png"
                alt="Logo"
                width={80}
                height={80}
                style={{ borderRadius: 8 }}
                priority
              />
            </Box>
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {/* Home */}
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button
                  startIcon={!scrolled ? <HomeIcon /> : undefined}
                  size="medium"
                  variant={scrolled ? 'contained' : 'text'}
                  sx={{
                    backgroundColor: scrolled ? '#000' : 'transparent',
                    color: scrolled ? '#fff' : '#000',
                    textTransform: 'none',
                    fontSize: scrolled ? '1.25rem' : '1rem',
                    px: scrolled ? 3 : 2,
                    py: scrolled ? 1.5 : 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: scrolled
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,122,255,0.1)',
                      color: scrolled ? '#fff' : accent,
                    },
                  }}
                >
                  Home
                </Button>
              </Link>

              {/* Discover */}
              <Link href="/discover" style={{ textDecoration: 'none' }}>
                <Button
                  startIcon={!scrolled ? <TravelExploreIcon /> : undefined}
                  size="medium"
                  variant={scrolled ? 'contained' : 'text'}
                  sx={{
                    backgroundColor: scrolled ? '#000' : 'transparent',
                    color: scrolled ? '#fff' : '#000',
                    textTransform: 'none',
                    fontSize: scrolled ? '1.25rem' : '1rem',
                    px: scrolled ? 3 : 2,
                    py: scrolled ? 1.5 : 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: scrolled
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,122,255,0.1)',
                      color: scrolled ? '#fff' : accent,
                    },
                  }}
                >
                  Discover
                </Button>
              </Link>

              {/* If not signed in, “Sign In” button */}
              {!user && (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <Button
                    size="medium"
                    variant="contained"
                    sx={{
                      backgroundColor: scrolled ? '#fff' : accent,
                      color: scrolled ? '#000' : '#fff',
                      textTransform: 'none',
                      fontSize: scrolled ? '1.25rem' : '1rem',
                      px: scrolled ? 3 : 2,
                      py: scrolled ? 1.5 : 1,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: scrolled ? '#f0f0f0' : accent,
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
              )}

              {/* If signed in, account dropdown trigger */}
              {user && (
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      color: scrolled ? '#fff' : '#000',
                      fontSize: scrolled ? '2rem' : '1.5rem',
                    }}
                  >
                    <AccountCircle fontSize="inherit" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem component={Link} href="/my-posts" onClick={handleMenuClose}>
                      My Posts
                    </MenuItem>
                    <MenuItem component={Link} href="/messages" onClick={handleMenuClose}>
                      Inbox
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}

          {/* Mobile: only Sign In + hamburger */}
          {isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: accent,
                    color: '#fff',
                    textTransform: 'none',
                    fontSize: '1rem',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon sx={{ fontSize: 32, color: '#000' }} />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile nav */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 240, pt: 2 }}>
          <List>
            {drawerLinks.map(({ href, label }) => (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
            {user && (
              <>
                <ListItemButton component={Link} href="/my-posts" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="My Posts" />
                </ListItemButton>
                <ListItemButton component={Link} href="/messages" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Inbox" />
                </ListItemButton>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Spacer so content sits below header */}
      <Box sx={{ height: scrolled ? 48 : 64 }} />
    </>
  );
}
