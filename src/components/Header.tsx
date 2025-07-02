// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Logout failed.');
    }
  };

  const textColor = '#111827';         // dark text on white
  const hoverBg = 'rgba(0, 122, 255, 0.1)';
  const accentColor = '#007AFF';

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',    // white with light transparency
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(209, 213, 219, 0.3)', // light gray border
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',    // subtle shadow
        paddingY: 1,
        zIndex: 1000,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/" passHref>
          <Button
            sx={{
              textTransform: 'none',
              p: 0,
              '&:hover': { backgroundColor: 'transparent' },
            }}
          >
            <Image
              src="/topleft.jpeg"
              alt="ShareSpace Logo"
              width={60}
              height={60}
              style={{ borderRadius: '12px' }}
              priority
            />
          </Button>
        </Link>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Link href="/" passHref>
            <Button
              sx={{
                color: textColor,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderRadius: '10px',
                padding: '8px 14px',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: hoverBg,
                  color: accentColor,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${hoverBg}`,
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${hoverBg}, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover:before': {
                  left: '100%',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Home
            </Button>
          </Link>

          <Link href="/discover" passHref>
            <Button
              sx={{
                color: textColor,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderRadius: '10px',
                padding: '8px 14px',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: hoverBg,
                  color: accentColor,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${hoverBg}`,
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${hoverBg}, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover:before': {
                  left: '100%',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Discover
            </Button>
          </Link>

          {!hasMounted || isLoading ? (
            <Box sx={{ width: 200, height: 40 }} />
          ) : (
            <>
              {user ? (
                <>
                  <Link href="/my-posts" passHref>
                    <Button
                      sx={{
                        color: textColor,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': {
                          backgroundColor: hoverBg,
                          color: accentColor,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      My Posts
                    </Button>
                  </Link>

                  <Link href="/profile" passHref>
                    <Button
                      sx={{
                        color: textColor,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': {
                          backgroundColor: hoverBg,
                          color: accentColor,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Profile
                    </Button>
                  </Link>

                  <Link href="/messages" passHref>
                    <Button
                      sx={{
                        color: textColor,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': {
                          backgroundColor: hoverBg,
                          color: accentColor,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Inbox
                    </Button>
                  </Link>

                  <Button
                    onClick={handleLogout}
                    sx={{
                      color: '#DC2626', // red logout
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      padding: '8px 14px',
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
                  <Link href="/auth/login" passHref>
                    <Button
                      sx={{
                        color: textColor,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        padding: '8px 16px',
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
                  
                  <Link href="/auth/signup" passHref>
                    <Button
                      sx={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, #0056b3 100%)`,
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        boxShadow: `0 2px 8px rgba(0, 122, 255, 0.3)`,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                          boxShadow: `0 4px 12px rgba(0, 122, 255, 0.4)`,
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </Box>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
