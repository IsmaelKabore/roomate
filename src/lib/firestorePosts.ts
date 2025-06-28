// src/lib/firestorePosts.ts

import { db } from './firebaseConfig'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getDeepSeekEmbedding } from '@/lib/deepseek-server'

/**
 * Common fields for every post in Firestore.
 */
interface BasePostData {
  userId: string
  title: string
  description: string
  images: string[]
  type: 'room' | 'roommate'
  createdAt: Timestamp
  keywords: string[]
  embedding: number[]
}

/**
 * Fields specific to a "room" post.
 */
interface RoomPostData extends BasePostData {
  price?: number
  address?: string
}

/**
 * Fields specific to a "roommate" post.
 */
interface RoommatePostData extends BasePostData {}

export interface RoomPost {
  id: string
  userId: string
  title: string
  description: string
  price?: number
  address?: string
  images: string[]
  keywords: string[]
  createdAt: Timestamp
  embedding: number[]
}

/**
 * Exported interface for roommate posts.
 */
export interface RoommatePost {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  keywords: string[]
  createdAt: Timestamp
  embedding: number[]
}

/**
 * Payload for creating a new post.
 */
export interface CreatePostData {
  title: string
  description: string
  price?: number
  address?: string
  images: string[]
  userId: string
  type: 'room' | 'roommate'
  keywords: string[]
}

/**
 * Create a new post document (uploads embedding & keywords).
 * Returns the new document ID.
 */
export async function createPost(postData: CreatePostData): Promise<string> {
  const postsRef = collection(db, 'posts')

  // 1) Build combined text for embedding:
  const combinedText = `${postData.title.trim()}\n${postData.description.trim()}\n${(postData.address || '').trim()}`

  // 2) Request embedding from DeepSeek:
  const embedding = await getDeepSeekEmbedding(combinedText)

  // 3) Write to Firestore, including embedding & keywords:
  const docRef = await addDoc(postsRef, {
    userId: postData.userId,
    title: postData.title.trim(),
    description: postData.description.trim(),
    images: postData.images,
    type: postData.type,
    price: postData.price ?? null,
    address: postData.address ?? '',
    keywords: postData.keywords,
    embedding,            // 1536-element float array
    createdAt: Timestamp.now(),
  })

  return docRef.id
}

/**
 * Fetch a single post by its ID.
 */
export async function getPostById(
  postId: string
): Promise<
  | {
      id: string
      userId: string
      title: string
      description: string
      price?: number
      address?: string
      images: string[]
      keywords: string[]
      type: 'room' | 'roommate'
      createdAt: Timestamp
      embedding: number[]
    }
  | null
> {
  const postRef = doc(db, 'posts', postId)
  const snap = await getDoc(postRef)
  if (!snap.exists()) return null

  const data = snap.data() as DocumentData

  // Base fields:
  const base: BasePostData = {
    userId: data.userId,
    title: data.title,
    description: data.description,
    images: data.images || [],
    type: data.type,
    createdAt: data.createdAt,
    keywords: data.keywords || [],
    embedding: data.embedding || [],
  }

  if (base.type === 'room') {
    const roomData: RoomPostData = {
      ...base,
      price: data.price,
      address: data.address,
    }
    return {
      id: snap.id,
      userId: roomData.userId,
      title: roomData.title,
      description: roomData.description,
      price: roomData.price,
      address: roomData.address,
      images: roomData.images,
      keywords: roomData.keywords,
      type: roomData.type,
      createdAt: roomData.createdAt,
      embedding: roomData.embedding,
    }
  } else {
    const mateData: RoommatePostData = { ...base }
    return {
      id: snap.id,
      userId: mateData.userId,
      title: mateData.title,
      description: mateData.description,
      images: mateData.images,
      keywords: mateData.keywords,
      type: mateData.type,
      createdAt: mateData.createdAt,
      embedding: mateData.embedding,
    }
  }
}

/**
 * Update an existing post (recomputes embedding if title/description/address changed).
 */
export async function updatePost(
  postId: string,
  postData: {
    title: string
    description: string
    price?: number
    address?: string
    images: string[]
    type: 'room' | 'roommate'
    keywords: string[]
  }
): Promise<void> {
  const postRef = doc(db, 'posts', postId)

  // 1) If title/description/address changed, recompute embedding:
  const combinedText = `${postData.title.trim()}\n${postData.description.trim()}\n${(postData.address || '').trim()}`
  const newEmbedding = await getDeepSeekEmbedding(combinedText)

  // 2) Update Firestore doc:
  await updateDoc(postRef, {
    title: postData.title.trim(),
    description: postData.description.trim(),
    price: postData.price ?? null,
    address: postData.address ?? '',
    images: postData.images,
    type: postData.type,
    keywords: postData.keywords,
    embedding: newEmbedding,
  })
}

/**
 * Delete a post document.
 */
export async function deletePost(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId)
  await deleteDoc(postRef)
}

/**
 * List all posts by a specific user.
 */
export async function getPostsByUser(userId: string): Promise<
  {
    id: string
    userId: string
    title: string
    description: string
    price?: number
    address?: string
    images: string[]
    keywords: string[]
    type: 'room' | 'roommate'
    createdAt: Timestamp
    embedding: number[]
  }[]
> {
  const postsRef = collection(db, 'posts')
  
  let snapshot
  try {
    // Try with closed filter first
    const q = query(
      postsRef,
      where('userId', '==', userId),
      where('closed', '==', false),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(q)
  } catch (error: any) {
    console.warn('Composite index not available, falling back to basic query:', error.message)
    // Fallback query without closed filter
    const fallbackQ = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(fallbackQ)
  }

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    
    // Filter out closed posts manually if we used fallback query
    if (data.closed === true) {
      return null
    }
    
    const base: BasePostData = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      type: data.type,
      createdAt: data.createdAt,
      keywords: data.keywords || [],
      embedding: data.embedding || [],
    }
    if (base.type === 'room') {
      const roomData: RoomPostData = {
        ...base,
        price: data.price,
        address: data.address,
      }
      return {
        id: docSnap.id,
        userId: roomData.userId,
        title: roomData.title,
        description: roomData.description,
        price: roomData.price,
        address: roomData.address,
        images: roomData.images,
        keywords: roomData.keywords,
        type: roomData.type,
        createdAt: roomData.createdAt,
        embedding: roomData.embedding,
      }
    } else {
      const mateData: RoommatePostData = { ...base }
      return {
        id: docSnap.id,
        userId: mateData.userId,
        title: mateData.title,
        description: mateData.description,
        images: mateData.images,
        keywords: mateData.keywords,
        type: mateData.type,
        createdAt: mateData.createdAt,
        embedding: mateData.embedding,
      }
    }
  }).filter(Boolean) as {
    id: string
    userId: string
    title: string
    description: string
    price?: number
    address?: string
    images: string[]
    keywords: string[]
    type: 'room' | 'roommate'
    createdAt: Timestamp
    embedding: number[]
  }[]
}

/**
 * List all "room" posts (array only).
 * Returns an array of RoomPost.
 */
export async function getRoomPosts(): Promise<RoomPost[]> {
  const postsRef = collection(db, 'posts')
  
  let snapshot
  try {
    // Try with closed filter first
    const q = query(
      postsRef,
      where('type', '==', 'room'),
      where('closed', '==', false),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(q)
  } catch (error: any) {
    console.warn('Composite index not available, falling back to basic query:', error.message)
    // Fallback query without closed filter
    const fallbackQ = query(
      postsRef,
      where('type', '==', 'room'),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(fallbackQ)
  }

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    
    // Filter out closed posts manually if we used fallback query
    if (data.closed === true) {
      return null
    }
    
    const roomData: RoomPostData = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      type: data.type,
      createdAt: data.createdAt,
      price: data.price,
      address: data.address,
      keywords: data.keywords || [],
      embedding: data.embedding || [],
    }
    return {
      id: docSnap.id,
      userId: roomData.userId,
      title: roomData.title,
      description: roomData.description,
      price: roomData.price,
      address: roomData.address,
      images: roomData.images,
      keywords: roomData.keywords,
      createdAt: roomData.createdAt,
      embedding: roomData.embedding,
    }
  }).filter(Boolean) as RoomPost[]
}

/**
 * Get featured room posts with limit for better performance.
 * Returns an array of RoomPost limited to the specified count.
 */
export async function getFeaturedRoomPosts(maxCount: number = 3): Promise<RoomPost[]> {
  const postsRef = collection(db, 'posts')
  
  let snapshot
  try {
    // Try with closed filter first
    const q = query(
      postsRef,
      where('type', '==', 'room'),
      where('closed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    )
    snapshot = await getDocs(q)
  } catch (error: any) {
    console.warn('Composite index not available, falling back to basic query:', error.message)
    // Fallback query without closed filter but with higher limit to account for filtering
    const fallbackQ = query(
      postsRef,
      where('type', '==', 'room'),
      orderBy('createdAt', 'desc'),
      limit(maxCount * 2) // Get more to account for manual filtering
    )
    snapshot = await getDocs(fallbackQ)
  }

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    
    // Filter out closed posts manually if we used fallback query
    if (data.closed === true) {
      return null
    }
    
    const roomData: RoomPostData = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      type: data.type,
      createdAt: data.createdAt,
      price: data.price,
      address: data.address,
      keywords: data.keywords || [],
      embedding: data.embedding || [],
    }
    return {
      id: docSnap.id,
      userId: roomData.userId,
      title: roomData.title,
      description: roomData.description,
      price: roomData.price,
      address: roomData.address,
      images: roomData.images,
      keywords: roomData.keywords,
      createdAt: roomData.createdAt,
      embedding: roomData.embedding,
    }
  }).filter(Boolean).slice(0, maxCount) as RoomPost[]
}

/**
 * List all "roommate" posts (array only).
 * Returns an array of RoommatePost.
 */
export async function getRoommatePosts(): Promise<RoommatePost[]> {
  const postsRef = collection(db, 'posts')
  
  let snapshot
  try {
    // Try with closed filter first
    const q = query(
      postsRef,
      where('type', '==', 'roommate'),
      where('closed', '==', false),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(q)
  } catch (error: any) {
    console.warn('Composite index not available, falling back to basic query:', error.message)
    // Fallback query without closed filter
    const fallbackQ = query(
      postsRef,
      where('type', '==', 'roommate'),
      orderBy('createdAt', 'desc')
    )
    snapshot = await getDocs(fallbackQ)
  }

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    
    // Filter out closed posts manually if we used fallback query
    if (data.closed === true) {
      return null
    }
    
    const mateData: RoommatePostData = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      type: data.type,
      createdAt: data.createdAt,
      keywords: data.keywords || [],
      embedding: data.embedding || [],
    }
    return {
      id: docSnap.id,
      userId: mateData.userId,
      title: mateData.title,
      description: mateData.description,
      images: mateData.images,
      keywords: mateData.keywords,
      createdAt: mateData.createdAt,
      embedding: mateData.embedding,
    }
  }).filter(Boolean) as RoommatePost[]
}
