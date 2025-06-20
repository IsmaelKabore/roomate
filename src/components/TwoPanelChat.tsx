'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Badge,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  InputBase,
  CircularProgress,
  Chip,
  alpha,
  useTheme,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/Send'

// Import auth from your firebaseConfig
import { auth } from '@/lib/firebaseConfig'

// Import all the Firestore messaging helpers
import {
  getRooms,
  createRoom,
  onMessagesSnapshot,
  sendMessage,
  updateReadTimestamp,
  onTypingSnapshot,
  setTyping,
} from '@/lib/firestoreMessages'

// Import last-message / profile lookup
import { fetchUserProfile } from '@/lib/firestoreProfile'

interface RoomSummary {
  id: string
  participants: string[]
  unreadCount: number
}

interface InboxItem {
  id: string
  otherId: string
  name: string
  avatarUrl?: string
  latestText: string
  latestTimestamp: number
  unreadCount: number
}

export interface MessageDoc {
  senderId: string
  text: string
  timestamp: number
}

interface TwoPanelChatProps {
  initialRoomId?: string
}

export default function TwoPanelChat({ initialRoomId }: TwoPanelChatProps) {
  const router = useRouter()
  const theme = useTheme()

  // Make sure auth is defined (user must be signed in)
  const currentUser = auth.currentUser

  // ─── Sidebar “inbox” state ──────────────────────────────────────
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)

  // ─── Which room is currently open ────────────────────────────────
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  // ─── Real-time messages + loading for the active room ───────────
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [msgLoading, setMsgLoading] = useState(false)

  // ─── New message input state ────────────────────────────────────
  const [newMsgText, setNewMsgText] = useState('')

  // ─── Scroll-to-bottom ref ────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null)

  // ─── Smart-Reply state ───────────────────────────────────────────
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([])
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)

  // Helper to fetch smart replies from our API
  async function fetchSmartReplies(latestIncoming: string) {
    console.log('→ [TwoPanelChat] fetchSmartReplies called with:', latestIncoming)
    setFetchingSuggestions(true)

    try {
      const res = await fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recentMessage: latestIncoming }),
      })

      console.log('→ [TwoPanelChat] /api/chat/suggestions response status:', res.status)

      if (!res.ok) {
        const text = await res.text()
        console.error('⚠️ [TwoPanelChat] Suggestion API failed, returned:', res.status, text)
        throw new Error('Suggestion API failed')
      }

      const json = await res.json()
      console.log('→ [TwoPanelChat] /api/chat/suggestions JSON:', json)

      // Expect json.suggestions to be string[]
      if (Array.isArray(json.suggestions)) {
        setSmartSuggestions(json.suggestions)
      } else {
        console.warn('⚠️ [TwoPanelChat] Unexpected suggestions format:', json.suggestions)
        setSmartSuggestions([])
      }
    } catch (e) {
      console.error('⚠️ [TwoPanelChat] Error fetching smart replies:', e)
      setSmartSuggestions([])
    } finally {
      setFetchingSuggestions(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 1) Load current user’s inbox (list of rooms) and set initial room
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth/login')
      return
    }

    async function loadInbox() {
      try {
        if (!currentUser) {
          console.error('User is not authenticated')
          return
        }
        const rooms: RoomSummary[] = await getRooms(currentUser.uid)
        const items: InboxItem[] = await Promise.all(
          rooms.map(async (room) => {
            const otherId =
              room.participants.find((uid) => uid !== currentUser.uid) || ''
            let name = 'Unknown User'
            let avatarUrl: string | undefined

            if (otherId) {
              const profile = await fetchUserProfile(otherId).catch(() => null)
              name = profile?.name || otherId
              avatarUrl = profile?.profilePicture
            }

            return {
              id: room.id,
              otherId,
              name,
              avatarUrl,
              latestText: '',
              latestTimestamp: 0,
              unreadCount: room.unreadCount,
            }
          })
        )

        console.log('→ [TwoPanelChat] loaded inbox items:', items)
        setInboxItems(items)
        setInboxLoading(false)

        if (initialRoomId) {
          setActiveRoomId(initialRoomId)
        } else if (items.length > 0) {
          setActiveRoomId(items[0].id)
        }
      } catch (err) {
        console.error('Error loading inbox:', err)
        setInboxLoading(false)
      }
    }

    loadInbox()
  }, [currentUser, initialRoomId, router])

  // ══════════════════════════════════════════════════════════════════
  // 2) When activeRoomId changes, subscribe to messages & typing flags
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!currentUser || !activeRoomId) {
      setMessages([])
      setMsgLoading(false)
      return
    }

    async function initRoomAndSubscribe() {
      // 2a) Ensure room exists (create/join)
      await createRoom(
        activeRoomId!,
        [
          currentUser?.uid || '',
          ...(activeRoomId && currentUser ? activeRoomId.split('_').filter((id) => id !== currentUser.uid) : []),
        ]
      )

      // 2b) Subscribe to real-time messages
      setMsgLoading(true)
      if (!activeRoomId) return;
      const unsubMessages = onMessagesSnapshot(activeRoomId, (docs) => {
        setMessages(docs)
        setMsgLoading(false)
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

        if (docs.length > 0) {
          const lastMsg = docs[docs.length - 1]
          console.log(
            '→ [TwoPanelChat] new message arrived:',
            lastMsg.text,
            'from',
            lastMsg.senderId
          )

          // Fetch suggestions whenever a new message arrives:
          // (### For testing, we’ll fetch even if I sent it)
          // if (lastMsg.senderId !== currentUser.uid) {
            fetchSmartReplies(lastMsg.text)
          // }
        }

        // 2c) Update read timestamp
        if (currentUser) {
          if (activeRoomId) {
            updateReadTimestamp(activeRoomId, currentUser.uid).catch(console.error)
          }
        }
      })

      // 2d) Subscribe to typing flags (not used for suggestions directly)
      const unsubTyping = onTypingSnapshot(activeRoomId!, (flags) => {
        // e.g. setTypingFlags(flags)
      })

      return () => {
        unsubMessages()
        unsubTyping()
      }
    }

    const cleanupPromise = initRoomAndSubscribe()
    return () => {
      cleanupPromise.then((fn) => {
        if (typeof fn === 'function') fn()
      })
    }
  }, [currentUser, activeRoomId])

  // ══════════════════════════════════════════════════════════════════
  // 3) Send a new message
  // ══════════════════════════════════════════════════════════════════
  const handleSend = async () => {
    if (!currentUser || !activeRoomId || newMsgText.trim() === '') return
    const trimmed = newMsgText.trim()
    setNewMsgText('')
    await sendMessage(activeRoomId, currentUser.uid, trimmed)
    await setTyping(activeRoomId, currentUser.uid, false)
    // Clear suggestions when sending
    setSmartSuggestions([])
  }

  // ══════════════════════════════════════════════════════════════════
  // 4) Typing indicator
  // ══════════════════════════════════════════════════════════════════
  const handleTypingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsgText(e.target.value)
    if (currentUser && activeRoomId) {
      await setTyping(activeRoomId, currentUser.uid, e.target.value.length > 0)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 5) Render the two-panel chat UI
  // ══════════════════════════════════════════════════════════════════
  if (!currentUser) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F3F4F6' }}>
      {/** ─────────────────────────────────────────────────────────────────
                 LEFT PANEL: Inbox Sidebar
      ───────────────────────────────────────────────────────────────── **/}
      <Paper
        elevation={3}
        sx={{
          width: 320,
          backgroundColor: theme.palette.primary.dark,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Search bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
          }}
        >
          <IconButton sx={{ color: '#FFFFFF' }}>
            <SearchIcon />
          </IconButton>
          <InputBase
            placeholder="Search..."
            sx={{
              ml: 1,
              flex: 1,
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              backgroundColor: alpha('#fff', 0.15),
              color: '#FFFFFF',
              '& input::placeholder': {
                color: alpha('#fff', 0.7),
              },
            }}
            inputProps={{ 'aria-label': 'search chats' }}
          />
        </Box>

        <Divider sx={{ borderColor: alpha('#fff', 0.2) }} />

        {inboxLoading ? (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress color="inherit" size={28} />
          </Box>
        ) : inboxItems.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color={alpha('#fff', 0.8)}>No conversations yet</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
            {inboxItems.map((it, idx) => {
              const isActive = it.id === activeRoomId
              return (
                <Box key={it.id}>
                  <ListItemButton
                    onClick={() => {
                      setActiveRoomId(it.id)
                      router.push(`/messages/${it.id}`, { scroll: false })
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: isActive ? alpha('#fff', 0.15) : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha('#fff', 0.10),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={it.unreadCount}
                        color="error"
                        invisible={it.unreadCount === 0}
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#FF5252',
                            color: '#fff',
                            fontSize: 10,
                            minWidth: 16,
                            height: 16,
                          },
                        }}
                      >
                        <Avatar
                          src={it.avatarUrl}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha('#ffffff', 0.2),
                            color: '#ffffff',
                            fontWeight: 600,
                          }}
                        >
                          {!it.avatarUrl && it.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 14,
                            color: '#FFFFFF',
                          }}
                          noWrap
                        >
                          {it.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: alpha('#ffffff', 0.75),
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 180,
                          }}
                        >
                          {it.latestText || 'No messages yet'}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: alpha('#ffffff', 0.6), fontSize: 10 }}
                    >
                      {it.latestTimestamp > 0
                        ? new Date(it.latestTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </Typography>
                  </ListItemButton>
                  {idx < inboxItems.length - 1 && (
                    <Divider sx={{ backgroundColor: alpha('#fff', 0.2) }} />
                  )}
                </Box>
              )
            })}
          </List>
        )}
      </Paper>

      {/** ─────────────────────────────────────────────────────────────────
                 RIGHT PANEL: Active Conversation
      ───────────────────────────────────────────────────────────────── **/}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${alpha('#000', 0.05)}`,
          backgroundColor: '#F9FAFB',
        }}
      >
        {!activeRoomId ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="h6">Select a conversation</Typography>
          </Box>
        ) : (
          <>
            {/** ─── Header ─── **/}
            <Paper
              elevation={2}
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 64,
                px: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                color: '#fff',
              }}
            >
              <IconButton
                onClick={() => {
                  setActiveRoomId(null)
                  router.push('/messages')
                }}
                sx={{ color: '#FFFFFF' }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>

              {(function () {
                const item = inboxItems.find((x) => x.id === activeRoomId)
                if (!item) return null
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <Avatar
                      src={item.avatarUrl}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                      }}
                    >
                      {!item.avatarUrl && item.name.charAt(0)}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, ml: 2, color: '#fff', fontSize: 16 }}
                    >
                      {item.name}
                    </Typography>
                  </Box>
                )
              })()}
            </Paper>

            {/** ─── Message List ─── **/}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                position: 'relative',
                backgroundColor: '#F3F4F6',
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.4),
                  borderRadius: 3,
                },
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {msgLoading ? (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Typography
                  sx={{ color: theme.palette.text.disabled, textAlign: 'center', mt: 2 }}
                >
                  No messages yet.
                </Typography>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === currentUser.uid
                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        mb: 0.5,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: isMe
                            ? theme.palette.primary.main
                            : '#E5E7EB',
                          color: isMe ? '#FFFFFF' : '#000000',
                          borderRadius: 2,
                          boxShadow: isMe ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                          borderTopLeftRadius: isMe ? 16 : 2,
                          borderTopRightRadius: isMe ? 2 : 16,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.4, wordBreak: 'break-word' }}
                        >
                          {m.text}
                        </Typography>
                      </Paper>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: 10,
                          mt: 0.3,
                          textAlign: isMe ? 'right' : 'left',
                        }}
                      >
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )
                })
              )}
              <div ref={bottomRef} />
            </Box>

            {/** ─── Smart-Reply Chips ─── **/}
            {smartSuggestions.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 1,
                  px: 2,
                  mt: 1,
                }}
              >
                {smartSuggestions.map((s, i) => (
                  <Chip
                    key={i}
                    label={s}
                    size="small"
                    clickable
                    color="primary"
                    onClick={() => {
                      console.log('→ [TwoPanelChat] user clicked suggestion:', s)
                      setNewMsgText(s)
                    }}
                  />
                ))}
                {fetchingSuggestions && <CircularProgress size={20} />}
              </Box>
            )}

            {/** ─── Input Bar ─── **/}
            <Paper
              elevation={4}
              sx={{
                m: 2,
                mt: 0,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}
            >
              <IconButton sx={{ color: theme.palette.primary.main }}>
                <AttachFileIcon />
              </IconButton>
              <InputBase
                placeholder="Type a message…"
                value={newMsgText}
                onChange={handleTypingChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                sx={{
                  flex: 1,
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  borderRadius: 1.5,
                  fontSize: 14,
                }}
                multiline
                maxRows={4}
              />
              <IconButton onClick={handleSend} sx={{ color: theme.palette.primary.main }}>
                <SendIcon />
              </IconButton>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}
