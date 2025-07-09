// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Button
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
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const accent = '#007AFF';

  // Listen auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Detect scroll
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
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar
        elevation={scrolled ? 2 : 0}
        sx={{
          position: 'fixed',
          top: scrolled ? theme.spacing(1) : 0,
          left: scrolled ? '50%' : 0,
          transform: scrolled ? 'translateX(-50%)' : 'none',
          width: scrolled ? '95%' : '100%',
          maxWidth: scrolled ? 600 : '100%',
          borderRadius: scrolled ? 2 : 0,
          bgcolor: scrolled ? 'rgba(107,114,128,0.6)' : '#ffffff',
          backdropFilter: 'blur(20px)',
          py: scrolled ? 0.5 : 0.75,
          transition: 'all 0.3s ease',
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: scrolled ? 48 : 56,
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
                transform: scrolled ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <Image
                src="/logo-transparent.png"
                alt="ShareSpace.ai"
                width={64}
                height={64}
                style={{ borderRadius: 6 }}
                priority
              />
            </Box>
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Home */}
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button
                  startIcon={!scrolled ? <HomeIcon /> : undefined}
                  variant={scrolled ? 'contained' : 'text'}
                  sx={{
                    textTransform: 'none',
                    color: scrolled ? '#ffffff' : '#000000',
                    backgroundImage: scrolled
                      ? 'linear-gradient(to right, #2563EB, #3B82F6)'
                      : 'none',
                    px: 2,
                    py: 1,
                  }}
                >
                  Home
                </Button>
              </Link>

              {/* Discover */}
              <Link href="/discover" style={{ textDecoration: 'none' }}>
                <Button
                  startIcon={!scrolled ? <TravelExploreIcon /> : undefined}
                  variant={scrolled ? 'contained' : 'text'}
                  sx={{
                    textTransform: 'none',
                    color: scrolled ? '#ffffff' : '#000000',
                    backgroundImage: scrolled
                      ? 'linear-gradient(to right, #2563EB, #3B82F6)'
                      : 'none',
                    px: 2,
                    py: 1,
                  }}
                >
                  Discover
                </Button>
              </Link>

              {/* Sign In / Account */}
              {!user ? (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      backgroundImage: 'linear-gradient(to right, #2563EB, #3B82F6)',
                      color: '#fff',
                      px: 2,
                      py: 1,
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
              ) : (
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{ color: '#000000', fontSize: '1.4rem' }}
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

          {/* Mobile nav */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Home & Discover icons */}
              <IconButton component={Link} href="/" sx={{ color: '#000000' }}>
                <HomeIcon />
              </IconButton>
              <IconButton component={Link} href="/discover" sx={{ color: '#000000' }}>
                <TravelExploreIcon />
              </IconButton>

              {/* If not signed-in, show Sign In button */}
              {!user && (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      backgroundColor: accent,
                      color: '#fff',
                      fontSize: '0.9rem',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
              )}

              {/* If signed-in, show hamburger for remainder */}
              {user && (
                <IconButton onClick={() => setDrawerOpen(true)}>
                  <MenuIcon sx={{ color: '#000000' }} />
                </IconButton>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240, pt: 2 }}>
          <List>
            <ListItemButton component={Link} href="/my-posts" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="My Posts" />
            </ListItemButton>
            <ListItemButton component={Link} href="/messages" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Inbox" />
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Spacer so content sits below header */}
      <Box sx={{ height: scrolled ? 48 : 56 }} />
    </>
  );
}
