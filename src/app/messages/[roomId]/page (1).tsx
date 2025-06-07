'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper
} from '@mui/material'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  onSnapshot,
  collection,
  query,
  orderBy
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebaseConfig'
import { createRoom, sendMessage } from '@/lib/firestoreMessages'

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()

  // Track signed-in user
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/login')
      else setUser(u)
    })
    return () => unsubAuth()
  }, [router])

  // Messages list
  const [messages, setMessages] = useState<{ senderId: string; text: string; timestamp: number }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real‐time listener
  useEffect(() => {
    if (!user || !roomId) return

    // Ensure room doc exists before listening
    createRoom(roomId, [user.uid, ...roomId.split('_').filter(id => id !== user.uid)])

    const messagesQuery = query(
      collection(db, 'messages', roomId, 'messages'),
      orderBy('timestamp')
    )
    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as any)
      setMessages(msgs)
      // scroll to bottom on new message
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }, (error) => {
      console.error('Message listener error:', error)
    })

    return () => unsub()
  }, [user, roomId])

  // Sending
  const [newMessage, setNewMessage] = useState('')
  const handleSend = async () => {
    if (!user || !newMessage.trim() || !roomId) return
    await sendMessage(roomId, user.uid, newMessage.trim())
    setNewMessage('')
  }
  // Send on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#1976d2' }}>
        Chat
      </Typography>

      <Box
        sx={{ 
          maxHeight: '60vh', 
          overflowY: 'auto', 
          mb: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1 
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: msg.senderId === user?.uid ? 'flex-end' : 'flex-start',
              maxWidth: '75%'
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                background: msg.senderId === user?.uid ? '#1976d2' : '#eee',
                color: msg.senderId === user?.uid ? '#fff' : '#000'
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        {/* Dummy div to scroll into view */}
        <div ref={scrollRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          sx={{ backgroundColor: '#1976d2', color: '#fff' }}
        >
          Send
        </Button>
      </Box>
    </Box>
  )
}
