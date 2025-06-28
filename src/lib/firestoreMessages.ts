// src/lib/firestoreMessages.ts

import { db } from './firebaseConfig'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore'

/**
 * Interface for the "room" document under "messages/{roomId}".
 */
interface RoomDoc {
  participants: string[]
  lastReads: Record<string, number>
  typing: Record<string, boolean>
  unreadCounts: Record<string, number>
  participantsMeta: Record<string, { name: string, avatarUrl?: string }>
  createdAt?: Timestamp
}

/**
 * Interface for each message under "messages/{roomId}/messages/{messageId}".
 */
export interface MessageDoc {
  senderId: string
  text: string
  timestamp: number
}

/**
 * Ensure the room exists and initialize read receipts & typing flags.
 */
export async function createRoom(
  roomId: string, 
  participants: string[], 
  participantsMeta?: Record<string, { name: string, avatarUrl?: string }>
) {
  const roomRef = doc(db, 'messages', roomId)
  const snap = await getDoc(roomRef)
  if (!snap.exists()) {
    // Provide default participantsMeta if not provided
    const defaultParticipantsMeta = participantsMeta || participants.reduce((meta, uid) => {
      meta[uid] = { name: 'User', avatarUrl: undefined }
      return meta
    }, {} as Record<string, { name: string, avatarUrl?: string }>)

    await setDoc(roomRef, {
      participants,
      lastReads: participants.reduce((m, uid) => ({ ...m, [uid]: 0 }), {}),
      typing: participants.reduce((m, uid) => ({ ...m, [uid]: false }), {}),
      unreadCounts: participants.reduce((m, uid) => ({ ...m, [uid]: 0 }), {}),
      participantsMeta: defaultParticipantsMeta,
      createdAt: Timestamp.now(),
    })
  }
}

/**
 * Update the "lastReads" timestamp for this user in a room.
 */
export async function updateReadTimestamp(roomId: string, userId: string) {
  const roomRef = doc(db, 'messages', roomId)
  await updateDoc(roomRef, {
    [`lastReads.${userId}`]: Date.now(),
    [`unreadCounts.${userId}`]: 0,
  })
}

/**
 * Listen in real-time to the room doc's typing flags.
 */
export function onTypingSnapshot(
  roomId: string,
  callback: (flags: Record<string, boolean>) => void
) {
  const roomRef = doc(db, 'messages', roomId)
  return onSnapshot(roomRef, (snap) => {
    const data = snap.data() as RoomDoc
    callback(data.typing ?? {})
  })
}

/**
 * Set this user's typing flag in the room doc.
 */
export async function setTyping(
  roomId: string,
  userId: string,
  isTyping: boolean
) {
  const roomRef = doc(db, 'messages', roomId)
  await updateDoc(roomRef, {
    [`typing.${userId}`]: isTyping,
  })
}

/**
 * Subscribe in real-time to paginated messages in a room.
 * Pass limitCount for how many messages to fetch, and startAfterTimestamp for pagination.
 */
export function onMessagesSnapshot(
  roomId: string,
  callback: (docs: MessageDoc[]) => void,
  limitCount: number = 30,
  startAfterTimestamp?: number
) {
  let messagesQuery = query(
    collection(db, 'messages', roomId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )
  if (startAfterTimestamp) {
    messagesQuery = query(
      collection(db, 'messages', roomId, 'messages'),
      orderBy('timestamp', 'desc'),
      startAfter(startAfterTimestamp),
      limit(limitCount)
    )
  }
  return onSnapshot(messagesQuery, (snap) => {
    const msgs: MessageDoc[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data() as MessageDoc
      return {
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp,
      }
    })
    callback(msgs)
  })
}

/**
 * Send a new message into a room.
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  text: string
) {
  const msgsRef = collection(db, 'messages', roomId, 'messages')
  const roomRef = doc(db, 'messages', roomId)
  // Add the message
  const msgDoc = await addDoc(msgsRef, {
    senderId,
    text,
    timestamp: Date.now(),
  } as MessageDoc)

  // Increment unreadCounts for all participants except sender
  const roomSnap = await getDoc(roomRef)
  if (roomSnap.exists()) {
    const data = roomSnap.data() as any
    const unreadCounts = { ...(data.unreadCounts || {}) }
    const participants = data.participants || []
    participants.forEach((uid: string) => {
      if (uid !== senderId) unreadCounts[uid] = (unreadCounts[uid] || 0) + 1
    })
    await updateDoc(roomRef, { unreadCounts })
  }

  return msgDoc
}

/**
 * Interface for listing all rooms a user participates in.
 */
interface RoomSummary {
  id: string
  participants: string[]
  unreadCount: number
  createdAt: number
}

/**
 * List paginated rooms you participate in, with unread‐message counts.
 * Pass limitCount for how many rooms to fetch, and startAfterCreatedAt for pagination.
 */
export async function getRooms(
  userId: string,
  limitCount: number = 20,
  startAfterCreatedAt?: number
): Promise<RoomSummary[]> {
  const roomsRef = collection(db, 'messages')
  
  try {
    // Try the optimized query first (requires composite index)
    let qBase = query(roomsRef, where('participants', 'array-contains', userId))
    let q
    if (startAfterCreatedAt) {
      q = query(qBase, orderBy('createdAt', 'desc'), startAfter(startAfterCreatedAt), limit(limitCount))
    } else {
      q = query(qBase, orderBy('createdAt', 'desc'), limit(limitCount))
    }
    const snap = await getDocs(q)
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data() as RoomDoc
      const roomId = d.id
      const unreadCount = data.unreadCounts?.[userId] ?? 0
      return {
        id: roomId,
        participants: data.participants,
        unreadCount,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
      }
    })
  } catch (error: any) {
    // Fallback: if composite index doesn't exist, fetch all user rooms and sort in memory
    console.warn('Composite index not found, using fallback query:', error.message)
    
    const qFallback = query(roomsRef, where('participants', 'array-contains', userId))
    const snap = await getDocs(qFallback)
    const rooms = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data() as RoomDoc
      const roomId = d.id
      const unreadCount = data.unreadCounts?.[userId] ?? 0
      return {
        id: roomId,
        participants: data.participants,
        unreadCount,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
      }
    })
    
    // Sort by createdAt in memory (less efficient but works without index)
    rooms.sort((a, b) => b.createdAt - a.createdAt)
    
    // Handle pagination manually
    if (startAfterCreatedAt) {
      const startIndex = rooms.findIndex(room => room.createdAt < startAfterCreatedAt)
      return rooms.slice(startIndex, startIndex + limitCount)
    } else {
      return rooms.slice(0, limitCount)
    }
  }
}

/**
 * Update all rooms for a user with new profile info (name, avatarUrl).
 */
export async function updateUserProfileInRooms(userId: string, name: string, avatarUrl?: string) {
  const roomsRef = collection(db, 'messages')
  const q = query(roomsRef, where('participants', 'array-contains', userId))
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    const data = d.data() as RoomDoc
    const participantsMeta = { ...(data.participantsMeta || {}) }
    participantsMeta[userId] = { name, avatarUrl }
    await updateDoc(doc(db, 'messages', d.id), { participantsMeta })
  }
}
