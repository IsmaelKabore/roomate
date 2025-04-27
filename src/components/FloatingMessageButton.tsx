'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'

export default function FloatingMessageButton() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/messages')
  }

  return (
    <Button
      variant="contained"
      onClick={handleClick}
      startIcon={<ChatIcon />}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        backgroundColor: '#1976d2',
        color: 'white',
        borderRadius: '30px',
        paddingX: 3,
        paddingY: 1.5,
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        '&:hover': {
          backgroundColor: '#1565c0',
        },
      }}
    >
      Messages
    </Button>
  )
}
