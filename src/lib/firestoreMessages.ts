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
    // Only include the fields allowed by security rules
    await setDoc(roomRef, {
      participants,
      lastReads: participants.reduce((m, uid) => ({ ...m, [uid]: 0 }), {}),
      typing: participants.reduce((m, uid) => ({ ...m, [uid]: false }), {}),
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
  // Add the message (no room document updates since they're restricted by security rules)
  const msgDoc = await addDoc(msgsRef, {
    senderId,
    text,
    timestamp: Date.now(),
  } as MessageDoc)

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
      return {
        id: roomId,
        participants: data.participants,
        unreadCount: 0, // Always 0 since we can't track unread counts with current security rules
        createdAt: Date.now(), // Use current time as fallback
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
      return {
        id: roomId,
        participants: data.participants,
        unreadCount: 0, // Always 0 since we can't track unread counts with current security rules
        createdAt: Date.now(), // Use current time as fallback
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
  // This function is disabled due to security rule constraints
  // Current rules don't allow updating participantsMeta field
  console.warn('updateUserProfileInRooms is disabled due to Firestore security rules')
}
