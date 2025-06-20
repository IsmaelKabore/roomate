'use client'

import { useRouter } from 'next/navigation'
import { Fab, Tooltip } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'

export default function FloatingMessageButton() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/messages')
  }

  return (
    <Tooltip title="Open Messages" placement="left" arrow>
      <Fab
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #007AFF 0%, #0056b3 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 25px rgba(0, 122, 255, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
            transform: 'scale(1.1) translateY(-4px)',
            boxShadow: '0 12px 35px rgba(0, 122, 255, 0.5)',
            border: '2px solid rgba(0, 122, 255, 0.4)',
          },
          '&:active': {
            transform: 'scale(1.05) translateY(-2px)',
            transition: 'all 0.1s ease',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.75rem',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          }
        }}
      >
        <ChatIcon />
      </Fab>
    </Tooltip>
  )
}
