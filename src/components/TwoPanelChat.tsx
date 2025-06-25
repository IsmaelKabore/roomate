'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'

import {
  Box,
  Paper,
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
  Button,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/Send'
import ChatIcon from '@mui/icons-material/Chat'

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
  createdAt: number
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

  // Make sure auth is defined (user must be signed in)
  const currentUser = auth.currentUser

  // ─── Sidebar "inbox" state ──────────────────────────────────────
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [hasMoreRooms, setHasMoreRooms] = useState(true)
  const [loadingMoreRooms, setLoadingMoreRooms] = useState(false)
  const ROOMS_PAGE_SIZE = 20
  const lastRoomCreatedAtRef = useRef<number | null>(null)

  // ─── Which room is currently open ────────────────────────────────
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  // ─── Real-time messages + loading for the active room ───────────
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const MESSAGES_PAGE_SIZE = 30
  const unsubRef = useRef<null | (() => void)>(null)

  // ─── New message input state ────────────────────────────────────
  const [newMsgText, setNewMsgText] = useState('')

  // ─── Scroll-to-bottom ref ────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null)

  // ─── Smart-Reply state ───────────────────────────────────────────
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([])
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)

  const smartReplyTimeout = useRef<NodeJS.Timeout | null>(null)

  const inboxListRef = useRef<HTMLUListElement>(null)

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

  // Debounced smart reply fetch
  const debouncedFetchSmartReplies = useCallback((latestIncoming: string) => {
    if (smartReplyTimeout.current) clearTimeout(smartReplyTimeout.current)
    smartReplyTimeout.current = setTimeout(() => {
      fetchSmartReplies(latestIncoming)
    }, 1000)
  }, [])

  // Helper to load messages (paginated)
  const loadMessages = useCallback((roomId: string, append = false, startAfterTimestamp?: number) => {
    setMsgLoading(!append)
    setLoadingMore(append)
    if (unsubRef.current) unsubRef.current()
    unsubRef.current = onMessagesSnapshot(
      roomId,
      (msgs) => {
        // Firestore returns newest first, so reverse for display
        const newMsgs = [...msgs].reverse()
        setMessages((prev) => {
          if (append) {
            // Append older messages at the start
            return [...newMsgs, ...prev]
          } else {
            return newMsgs
          }
        })
        setHasMoreMessages(newMsgs.length === MESSAGES_PAGE_SIZE)
        setMsgLoading(false)
        setLoadingMore(false)
      },
      MESSAGES_PAGE_SIZE,
      startAfterTimestamp
    )
  }, [])

  // Helper to load rooms (paginated)
  const loadRooms = useCallback(async (append = false) => {
    if (append) setLoadingMoreRooms(true)
    else setInboxLoading(true)
    const lastCreatedAt = append && lastRoomCreatedAtRef.current ? lastRoomCreatedAtRef.current : undefined
    const rooms: RoomSummary[] = await getRooms(currentUser.uid, ROOMS_PAGE_SIZE, lastCreatedAt)
    setInboxItems((prev) => append ? [...prev, ...rooms] : rooms)
    setHasMoreRooms(rooms.length === ROOMS_PAGE_SIZE)
    if (rooms.length > 0) lastRoomCreatedAtRef.current = rooms[rooms.length - 1].createdAt
    if (append) setLoadingMoreRooms(false)
    else setInboxLoading(false)
  }, [currentUser])

  // Helper to render a single message row for react-window
  const MessageRow = ({ index, style }: ListChildComponentProps) => {
    const m = messages[index]
    const isMe = m.senderId === currentUser.uid
    return (
      <div style={style}>
        <Box
          sx={{
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            maxWidth: '75%',
            mb: 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: isMe
                ? 'var(--gradient-primary)'
                : 'var(--background-card)',
              color: isMe ? 'white' : 'var(--foreground)',
              borderRadius: '18px',
              borderTopLeftRadius: isMe ? '18px' : '6px',
              borderTopRightRadius: isMe ? '6px' : '18px',
              border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isMe ? '0 4px 12px rgba(0, 122, 255, 0.3)' : 'none',
            }}
          >
            <Typography
              variant="body1"
              sx={{ 
                lineHeight: 1.5, 
                wordBreak: 'break-word',
                fontSize: '0.95rem',
              }}
            >
              {m.text}
            </Typography>
          </Paper>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--foreground-secondary)',
              fontSize: '0.75rem',
              mt: 0.5,
              display: 'block',
              textAlign: isMe ? 'right' : 'left',
              px: 1,
            }}
          >
            {new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </div>
    )
  }

  // Infinite scroll handler for inbox
  const handleInboxScroll = () => {
    const el = inboxListRef.current
    if (!el || loadingMoreRooms || !hasMoreRooms) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      handleLoadMoreRooms()
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 1) Load current user's inbox (list of rooms) and set initial room
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth/login')
      return
    }

    loadRooms()

    async function initRoomAndSubscribe() {
      try {
        // Subscribe to real-time messages
        const unsubMessages = onMessagesSnapshot(activeRoomId!, (msgs) => {
          console.log('→ [TwoPanelChat] received messages:', msgs.length)
          setMessages(msgs)
          setMsgLoading(false)

          // Auto-scroll to bottom when new messages arrive
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)

          // If there's a new incoming message (not from current user), fetch smart replies
          if (msgs.length > 0 && currentUser) {
            const latestMsg = msgs[msgs.length - 1]
            if (latestMsg.senderId !== currentUser.uid && latestMsg.text) {
              debouncedFetchSmartReplies(latestMsg.text)
            }
          }
        })

        // Mark messages as read
        if (currentUser) {
          updateReadTimestamp(activeRoomId!, currentUser.uid)
        }

        return () => {
          if (unsubRef.current) unsubRef.current()
          if (smartReplyTimeout.current) clearTimeout(smartReplyTimeout.current)
          unsubMessages()
        }
      } catch (err) {
        console.error('Error initializing room:', err)
        setMsgLoading(false)
      }
    }

    initRoomAndSubscribe()
  }, [currentUser, initialRoomId, router, loadRooms])

  // ══════════════════════════════════════════════════════════════════
  // 2) Handle sending a message
  // ══════════════════════════════════════════════════════════════════
  const handleSend = async () => {
    if (!newMsgText.trim() || !activeRoomId || !currentUser) return
    try {
      await sendMessage(activeRoomId, currentUser.uid, newMsgText.trim())
      setNewMsgText('')
      setSmartSuggestions([]) // Clear suggestions after sending
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 4) Handle typing indicator
  // ══════════════════════════════════════════════════════════════════
  const handleTypingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsgText(e.target.value)
    if (!activeRoomId || !currentUser) return
    try {
      await setTyping(activeRoomId, currentUser.uid, e.target.value.length > 0)
    } catch (err) {
      console.error('Error setting typing status:', err)
    }
  }

  // Handler for loading more messages
  const handleLoadMore = () => {
    if (messages.length > 0) {
      const oldest = messages[0]
      loadMessages(activeRoomId!, true, oldest.timestamp)
    }
  }

  // Handler for loading more rooms
  const handleLoadMoreRooms = () => {
    loadRooms(true)
  }

  // Show loading if we don't have current user
  if (!currentUser) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--gradient-background)',
        }}
      >
        <CircularProgress sx={{ color: 'var(--primary)' }} />
      </Box>
    )
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        background: 'var(--gradient-background)',
        color: 'var(--foreground)',
      }}
    >
      {/** ─────────────────────────────────────────────────────────────────
                 LEFT PANEL: Inbox Sidebar
      ───────────────────────────────────────────────────────────────── **/}
      <Paper
        elevation={0}
        className="dark-card"
        sx={{
          width: 380,
          background: 'var(--background-card)',
          color: 'var(--foreground)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header with title */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            background: 'var(--gradient-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <ChatIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Messages
          </Typography>
        </Box>

        {/* Search bar */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--background-secondary)',
              borderRadius: '12px',
              px: 2,
              py: 1,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <SearchIcon sx={{ color: 'var(--foreground-secondary)', fontSize: 20, mr: 1 }} />
            <InputBase
              placeholder="Search conversations..."
              sx={{
                flex: 1,
                color: 'var(--foreground)',
                fontSize: '0.95rem',
                '& input::placeholder': {
                  color: 'var(--foreground-secondary)',
                  opacity: 1,
                },
              }}
              inputProps={{ 'aria-label': 'search chats' }}
            />
          </Box>
        </Box>

        {inboxLoading ? (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress sx={{ color: 'var(--primary)' }} size={28} />
          </Box>
        ) : inboxItems.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', px: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--background-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <ChatIcon sx={{ fontSize: 40, color: 'var(--foreground-secondary)' }} />
            </Box>
            <Typography sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1, textAlign: 'center' }}>
              No conversations yet
            </Typography>
            <Typography sx={{ color: 'var(--foreground-secondary)', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.5 }}>
              Start chatting with roommates to see your conversations here
            </Typography>
          </Box>
        ) : (
          <>
            <List
              disablePadding
              sx={{ overflowY: 'auto', flex: 1 }}
              ref={inboxListRef}
              onScroll={handleInboxScroll}
            >
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
                        py: 2,
                        px: 3,
                        background: isActive ? 'var(--primary)' : 'transparent',
                        '&:hover': {
                          background: isActive ? 'var(--primary-hover)' : 'rgba(255, 255, 255, 0.05)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={it.unreadCount}
                          color="error"
                          invisible={it.unreadCount === 0}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#ff4757',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              minWidth: 18,
                              height: 18,
                            },
                          }}
                        >
                          <Avatar
                            src={it.avatarUrl}
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'var(--gradient-primary)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '1.1rem',
                            }}
                          >
                            {!it.avatarUrl && it.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontWeight: isActive ? 600 : 500,
                              fontSize: '1rem',
                              color: isActive ? 'white' : 'var(--foreground)',
                              mb: 0.5,
                            }}
                            noWrap
                          >
                            {it.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              color: isActive ? 'rgba(255, 255, 255, 0.8)' : 'var(--foreground-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                            }}
                          >
                            {it.latestText || 'No messages yet'}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{ 
                            color: isActive ? 'rgba(255, 255, 255, 0.7)' : 'var(--foreground-secondary)', 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                        >
                          {it.latestTimestamp > 0
                            ? new Date(it.latestTimestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </Typography>
                      </Box>
                    </ListItemButton>
                    {idx < inboxItems.length - 1 && (
                      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mx: 3 }} />
                    )}
                  </Box>
                )
              })}
            </List>
          </>
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
          background: 'var(--background-secondary)',
        }}
      >
        {!activeRoomId ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--foreground-secondary)',
              px: 4,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'var(--background-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
              }}
            >
              <ChatIcon sx={{ fontSize: 60, color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h5" sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 2 }}>
              Select a conversation
            </Typography>
            <Typography sx={{ color: 'var(--foreground-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
              Choose a conversation from the sidebar to start chatting with your roommates
            </Typography>
          </Box>
        ) : (
          <>
            {/** ─── Header ─── **/}
            <Paper
              elevation={0}
              className="dark-card"
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 80,
                px: 3,
                background: 'var(--background-card)',
                color: 'var(--foreground)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
              }}
            >
              <IconButton
                onClick={() => {
                  setActiveRoomId(null)
                  router.push('/messages')
                }}
                sx={{ 
                  color: 'var(--primary)',
                  mr: 2,
                  '&:hover': {
                    background: 'rgba(0, 122, 255, 0.1)',
                  }
                }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>

              {(function () {
                const item = inboxItems.find((x) => x.id === activeRoomId)
                if (!item) return null
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Avatar
                      src={item.avatarUrl}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'var(--gradient-primary)',
                        color: 'white',
                        fontWeight: 600,
                        mr: 3,
                      }}
                    >
                      {!item.avatarUrl && item.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '1.1rem', mb: 0.5 }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        sx={{ color: 'var(--foreground-secondary)', fontSize: '0.85rem' }}
                      >
                        Active now
                      </Typography>
                    </Box>
                  </Box>
                )
              })()}
            </Paper>

            {/** ─── Message List ─── **/}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflowY: 'auto',
                position: 'relative',
                background: 'var(--background-secondary)',
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 122, 255, 0.4)',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {hasMoreMessages && messages.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button onClick={handleLoadMore} disabled={loadingMore} size="small" variant="outlined">
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </Box>
              )}
              {msgLoading ? (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: 'var(--primary)' }} size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'var(--background-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 40, color: 'var(--primary)' }} />
                  </Box>
                  <Typography
                    sx={{ color: 'var(--foreground)', fontWeight: 600, mb: 1, textAlign: 'center' }}
                  >
                    Start the conversation
                  </Typography>
                  <Typography
                    sx={{ color: 'var(--foreground-secondary)', textAlign: 'center', fontSize: '0.9rem' }}
                  >
                    Send a message to get the conversation started
                  </Typography>
                </Box>
              ) : (
                <List
                  height={500}
                  itemCount={messages.length}
                  itemSize={80}
                  width={'100%'}
                  style={{ flex: 1 }}
                >
                  {MessageRow}
                </List>
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
                  mb: 2,
                  px: 3,
                }}
              >
                {smartSuggestions.map((s, i) => (
                  <Chip
                    key={i}
                    label={s}
                    size="small"
                    clickable
                    onClick={() => {
                      console.log('→ [TwoPanelChat] user clicked suggestion:', s)
                      setNewMsgText(s)
                    }}
                    sx={{
                      background: 'var(--background-card)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(0, 122, 255, 0.3)',
                      '&:hover': {
                        background: 'var(--primary)',
                        color: 'white',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
                {fetchingSuggestions && <CircularProgress sx={{ color: 'var(--primary)' }} size={20} />}
              </Box>
            )}

            {/** ─── Input Bar ─── **/}
            <Paper
              elevation={0}
              className="dark-card"
              sx={{
                m: 3,
                mt: 0,
                p: 2,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                borderRadius: '20px',
                background: 'var(--background-card)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <IconButton 
                sx={{ 
                  color: 'var(--primary)',
                  '&:hover': {
                    background: 'rgba(0, 122, 255, 0.1)',
                  }
                }}
              >
                <AttachFileIcon />
              </IconButton>
              <InputBase
                placeholder="Type your message..."
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
                  px: 2,
                  py: 1,
                  background: 'var(--background-secondary)',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  color: 'var(--foreground)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& input::placeholder': {
                    color: 'var(--foreground-secondary)',
                    opacity: 1,
                  },
                }}
                multiline
                maxRows={4}
              />
              <IconButton 
                onClick={handleSend} 
                disabled={!newMsgText.trim()}
                sx={{ 
                  background: newMsgText.trim() ? 'var(--gradient-primary)' : 'var(--background-secondary)',
                  color: newMsgText.trim() ? 'white' : 'var(--foreground-secondary)',
                  '&:hover': {
                    background: newMsgText.trim() ? 'var(--primary-hover)' : 'var(--background-secondary)',
                  },
                  '&:disabled': {
                    color: 'var(--foreground-secondary)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <SendIcon />
              </IconButton>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}
