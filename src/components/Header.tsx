// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import HomeIcon from '@mui/icons-material/Home';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Logout failed.');
    }
  };

  const textColor = '#111827';
  const hoverBg = 'rgba(0, 122, 255, 0.1)';
  const accentColor = '#007AFF';

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(209, 213, 219, 0.3)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        paddingY: scrolled ? 0.5 : 1,
        zIndex: 1000,
        transition: 'padding 0.2s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          minHeight: scrolled ? 48 : 64,
          transition: 'min-height 0.2s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.2s',
              transform: scrolled ? 'scale(0.67)' : 'scale(1)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/logo-transparent.png"
              alt="ShareSpace Logo"
              width={60}
              height={60}
              style={{ borderRadius: '12px' }}
              priority
            />
          </Box>
        </Link>
        {/* Home & Discover */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: textColor,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: scrolled ? '0.8rem' : '0.95rem',
                borderRadius: '10px',
                padding: scrolled ? '4px 8px' : '8px 14px',
                minWidth: 0,
                '&:hover': {
                  backgroundColor: hoverBg,
                  color: accentColor,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${hoverBg}`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              <HomeIcon fontSize={scrolled ? 'small' : 'medium'} />
              {!scrolled && <Box component="span" sx={{ ml: 1 }}>Home</Box>}
            </Button>
          </Link>
          <Link href="/discover" style={{ textDecoration: 'none' }}>
            <Button
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: textColor,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: scrolled ? '0.8rem' : '0.95rem',
                borderRadius: '10px',
                padding: scrolled ? '4px 8px' : '8px 14px',
                minWidth: 0,
                '&:hover': {
                  backgroundColor: hoverBg,
                  color: accentColor,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${hoverBg}`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              <TravelExploreIcon fontSize={scrolled ? 'small' : 'medium'} />
              {!scrolled && <Box component="span" sx={{ ml: 1 }}>Discover</Box>}
            </Button>
          </Link>
        </Box>
        {!hasMounted || isLoading ? (
          <Box sx={{ width: 200, height: 40 }} />
        ) : (
          <>
            {user ? (
              <>
                <Link href="/my-posts" style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: textColor,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: scrolled ? '0.8rem' : '1rem',
                      borderRadius: '12px',
                      padding: scrolled ? '4px 10px' : '8px 16px',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: hoverBg,
                        color: accentColor,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    My Posts
                  </Button>
                </Link>
                <Link href="/profile" style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: textColor,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: scrolled ? '0.8rem' : '1rem',
                      borderRadius: '12px',
                      padding: scrolled ? '4px 10px' : '8px 16px',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: hoverBg,
                        color: accentColor,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Profile
                  </Button>
                </Link>
                <Link href="/messages" style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: textColor,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: scrolled ? '0.8rem' : '1rem',
                      borderRadius: '12px',
                      padding: scrolled ? '4px 10px' : '8px 16px',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: hoverBg,
                        color: accentColor,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Inbox
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  sx={{
                    color: '#DC2626',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: scrolled ? '0.75rem' : '0.95rem',
                    borderRadius: '10px',
                    padding: scrolled ? '4px 10px' : '8px 14px',
                    minWidth: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      color: '#B91C1C',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent)',
                      transition: 'left 0.5s ease',
                    },
                    '&:hover:before': {
                      left: '100%',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  🚪 Logout
                </Button>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  borderRadius: '14px',
                  padding: '4px',
                }}
              >
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: textColor,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: scrolled ? '0.8rem' : '0.95rem',
                      borderRadius: '10px',
                      padding: scrolled ? '4px 10px' : '8px 16px',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: hoverBg,
                        color: accentColor,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, #0056b3 100%)`,
                      color: '#ffffff',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: scrolled ? '0.8rem' : '0.95rem',
                      borderRadius: '10px',
                      padding: scrolled ? '4px 10px' : '8px 16px',
                      minWidth: 0,
                      boxShadow: `0 2px 8px rgba(0, 122, 255, 0.3)`,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                        boxShadow: `0 4px 12px rgba(0, 122, 255, 0.4)`,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    SignUp
                  </Button>
                </Link>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
