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
export async function createRoom(roomId: string, participants: string[]) {
  const roomRef = doc(db, 'messages', roomId)
  const snap = await getDoc(roomRef)
  if (!snap.exists()) {
    await setDoc(roomRef, {
      participants,
      lastReads: participants.reduce((m, uid) => ({ ...m, [uid]: 0 }), {}),
      typing: participants.reduce((m, uid) => ({ ...m, [uid]: false }), {}),
    } as RoomDoc)
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
 * Subscribe in real-time to new messages in a room.
 */
export function onMessagesSnapshot(
  roomId: string,
  callback: (docs: MessageDoc[]) => void
) {
  const messagesQuery = query(
    collection(db, 'messages', roomId, 'messages'),
    orderBy('timestamp')
  )
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
  return await addDoc(msgsRef, {
    senderId,
    text,
    timestamp: Date.now(),
  } as MessageDoc)
}

/**
 * Interface for listing all rooms a user participates in.
 */
interface RoomSummary {
  id: string
  participants: string[]
  unreadCount: number
}

/**
 * List all rooms you participate in, with unread‐message counts.
 */
export async function getRooms(userId: string): Promise<RoomSummary[]> {
  const roomsRef = collection(db, 'messages')
  const q = query(roomsRef, where('participants', 'array-contains', userId))
  const snap = await getDocs(q)

  return Promise.all(
    snap.docs.map(async (d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data() as RoomDoc
      const roomId = d.id
      const lastRead = data.lastReads?.[userId] ?? 0

      const unreadQ = query(
        collection(db, 'messages', roomId, 'messages'),
        where('timestamp', '>', lastRead)
      )
      const unreadSnap = await getDocs(unreadQ)

      return {
        id: roomId,
        participants: data.participants,
        unreadCount: unreadSnap.size,
      }
    })
  )
}
