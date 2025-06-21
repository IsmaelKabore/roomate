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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
        <Link href="/" passHref>
          <Button
            sx={{
              textTransform: 'none',
              p: 0,
              '&:hover': { backgroundColor: 'transparent' },
            }}
          >
            <Image
              src="/logo.png"
              alt="Sharespace Logo"
              width={80}
              height={80}
              style={{ borderRadius: '8px' }}
              priority
            />
          </Button>
        </Link>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Link href="/" passHref>
            <Button
              sx={{
                color: '#2563eb',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': { backgroundColor: '#e0f2fe' },
              }}
            >
              Home
            </Button>
          </Link>

          <Link href="/discover" passHref>
            <Button
              sx={{
                color: '#2563eb',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': { backgroundColor: '#e0f2fe' },
              }}
            >
              Discover
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/my-posts" passHref>
                <Button
                  sx={{
                    color: '#2563eb',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#e0f2fe' },
                  }}
                >
                  My Posts
                </Button>
              </Link>

              <Link href="/profile" passHref>
                <Button
                  sx={{
                    color: '#2563eb',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#e0f2fe' },
                  }}
                >
                  Profile
                </Button>
              </Link>

              <Link href="/messages" passHref>
                <Button
                  sx={{
                    color: '#2563eb',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#e0f2fe' },
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
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#fee2e2' },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth/login" passHref>
              <Button
                sx={{
                  color: '#2563eb',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#e0f2fe' },
                }}
              >
                Login
              </Button>
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
