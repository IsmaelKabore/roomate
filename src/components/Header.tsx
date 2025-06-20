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

  useEffect(() => {
    // Faster auth check with timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Max 500ms wait

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
      clearTimeout(timer);
    });
    
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
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

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(15, 20, 25, 0.9)', // Dark navy with transparency
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(45, 55, 72, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
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
              src="/logo_sharespace.png"
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
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderRadius: '10px',
                padding: '8px 14px',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 122, 255, 0.15)',
                  color: '#007AFF',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)'
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.1), transparent)',
                  transition: 'left 0.5s ease'
                },
                '&:hover:before': {
                  left: '100%'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Home
            </Button>
          </Link>

          <Link href="/discover" passHref>
            <Button
              sx={{
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderRadius: '10px',
                padding: '8px 14px',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 122, 255, 0.15)',
                  color: '#007AFF',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)'
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.1), transparent)',
                  transition: 'left 0.5s ease'
                },
                '&:hover:before': {
                  left: '100%'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Discover
            </Button>
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link href="/my-posts" passHref>
                    <Button
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                          color: '#007AFF'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      My Posts
                    </Button>
                  </Link>

                  <Link href="/profile" passHref>
                    <Button
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                          color: '#007AFF'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Profile
                    </Button>
                  </Link>

                  <Link href="/messages" passHref>
                    <Button
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                          color: '#007AFF'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Inbox
                    </Button>
                  </Link>

                  <Button
                    onClick={handleLogout}
                    sx={{
                      color: '#ef4444',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent)',
                        transition: 'left 0.5s ease'
                      },
                      '&:hover': { 
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ff5555',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                      },
                      '&:hover:before': {
                        left: '100%'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🚪 Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" passHref>
                    <Button
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                          color: '#007AFF'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Login
                    </Button>
                  </Link>
                  
                  <Link href="/auth/signup" passHref>
                    <Button
                      sx={{
                        background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                          transition: 'left 0.5s ease'
                        },
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)'
                        },
                        '&:hover:before': {
                          left: '100%'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          transition: 'transform 0.1s ease'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✨ Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
