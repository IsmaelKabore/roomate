'use client'

import { useRouter } from 'next/navigation'
import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import { useEffect, useState } from 'react'

export default function MessagesPage() {
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const rooms = JSON.parse(localStorage.getItem('chat_rooms') || '{}')
    setChatRooms(Object.entries(rooms))
  }, [])

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#1976d2' }}>
        Messages
      </Typography>

      {chatRooms.length === 0 ? (
        <Typography>No conversations yet.</Typography>
      ) : (
        chatRooms.map(([roomId, roomData]: any) => (
          <Card
            key={roomId}
            sx={{ mb: 3, background: '#f5f5f5', cursor: 'pointer' }}
            onClick={() => router.push(`/messages/${roomId}`)}
          >
            <CardContent>
              <Typography variant="h6">
                Chat with: {roomData.participants.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {roomData.messages.length > 0
                  ? roomData.messages[roomData.messages.length - 1].text
                  : 'No messages yet.'}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}
