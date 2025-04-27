'use client'

import { useParams } from 'next/navigation'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'
import { useEffect, useState } from 'react'

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState<string[]>([])

  useEffect(() => {
    const rooms = JSON.parse(localStorage.getItem('chat_rooms') || '{}')
    const room = rooms[roomId as string]
    if (room) {
      setMessages(room.messages || [])
      setParticipants(room.participants || [])
    }
  }, [roomId])

  const handleSend = () => {
    if (!newMessage.trim()) return

    const rooms = JSON.parse(localStorage.getItem('chat_rooms') || '{}')
    const room = rooms[roomId as string]

    const updatedMessages = [
      ...messages,
      { sender: 'You', text: newMessage, timestamp: Date.now() }
    ]

    rooms[roomId as string] = {
      ...room,
      messages: updatedMessages
    }

    localStorage.setItem('chat_rooms', JSON.stringify(rooms))
    setMessages(updatedMessages)
    setNewMessage('')
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#1976d2' }}>
        Chat with: {participants.join(', ')}
      </Typography>

      <Box sx={{ maxHeight: '65vh', overflowY: 'auto', mb: 2 }}>
        {messages.map((msg, index) => (
          <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start' }}>
            <Paper sx={{ p: 1.5, background: msg.sender === 'You' ? '#1976d2' : '#eeeeee', color: msg.sender === 'You' ? '#fff' : '#000', borderRadius: 2, maxWidth: '70%' }}>
              <Typography variant="body2">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button variant="contained" onClick={handleSend} sx={{ backgroundColor: '#1976d2' }}>
          Send
        </Button>
      </Box>
    </Box>
  )
}
