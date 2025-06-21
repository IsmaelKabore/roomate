// File: src/lib/firestorePosts.ts

import { db } from './firebaseConfig'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
 * Fields specific to a "room" post in Firestore.
 * Note: price may be stored as null, so we coerce later.
 */
interface RoomPostData extends BasePostData {
  price?: number | null
  address?: string
  structured?: {
    bedrooms?: number | null
    bathrooms?: number | null
    furnished?: boolean | null
  }
}

/**
 * Fields specific to a "roommate" post in Firestore.
 */
interface RoommatePostData extends BasePostData {}

/**
 * What the UI consumer sees for a room post.
 * All Firestore-nullable fields become optional/undefined here.
 */
export interface RoomPost {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  keywords: string[]
  embedding: number[]
  createdAt: Timestamp
  price?: number
  address: string
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
}

/**
 * What the UI consumer sees for a roommate post.
 */
export interface RoommatePost {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  keywords: string[]
  embedding: number[]
  createdAt: Timestamp
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
 * Create a new post document (and generate its embedding).
 * Returns the new document ID.
 */
export async function createPost(postData: CreatePostData): Promise<string> {
  const postsRef = collection(db, 'posts')

  // 1) Build combined text for embedding:
  const combinedText = [
    postData.title.trim(),
    postData.description.trim(),
    (postData.address || '').trim(),
  ].join('\n')

  // 2) Request embedding:
  const embedding = await getDeepSeekEmbedding(combinedText)

  // 3) Write to Firestore:
  const docRef = await addDoc(postsRef, {
    userId: postData.userId,
    title: postData.title.trim(),
    description: postData.description.trim(),
    images: postData.images,
    type: postData.type,
    price: postData.price ?? null,
    address: postData.address ?? '',
    keywords: postData.keywords,
    embedding,
    createdAt: Timestamp.now(),
    // No structured fields on initial create
  })

  return docRef.id
}

/**
 * Fetch a single post by its ID.
 * Returns null if not found.
 */
export async function getPostById(postId: string): Promise<RoomPost | RoommatePost | null> {
  const postRef = doc(db, 'posts', postId)
  const snap = await getDoc(postRef)
  if (!snap.exists()) return null

  const data = snap.data() as DocumentData
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
    const rd = (data.structured || {}) as Record<string, any>
    return {
      id: snap.id,
      ...base,
      price: typeof data.price === 'number' ? data.price : undefined,
      address: data.address ?? '',
      bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : undefined,
      bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : undefined,
      furnished: typeof rd.furnished === 'boolean' ? rd.furnished : undefined,
    }
  } else {
    return {
      id: snap.id,
      ...base,
    }
  }
}

/**
 * Update an existing post (recomputes embedding if relevant).
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
    bedrooms?: number
    bathrooms?: number
    furnished?: boolean
  }
): Promise<void> {
  const postRef = doc(db, 'posts', postId)

  // 1) Recompute embedding:
  const combinedText = [
    postData.title.trim(),
    postData.description.trim(),
    (postData.address || '').trim(),
  ].join('\n')
  const embedding = await getDeepSeekEmbedding(combinedText)

  // 2) Update Firestore doc:
  await updateDoc(postRef, {
    title: postData.title.trim(),
    description: postData.description.trim(),
    price: postData.price ?? null,
    address: postData.address ?? '',
    images: postData.images,
    type: postData.type,
    keywords: postData.keywords,
    embedding,
    structured:
      postData.type === 'room'
        ? {
            bedrooms: postData.bedrooms ?? null,
            bathrooms: postData.bathrooms ?? null,
            furnished: postData.furnished ?? null,
          }
        : null,
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
export async function getPostsByUser(userId: string): Promise<(RoomPost | RoommatePost)[]> {
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
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
      const rd = (data.structured || {}) as Record<string, any>
      return {
        id: docSnap.id,
        ...base,
        price: typeof data.price === 'number' ? data.price : undefined,
        address: data.address ?? '',
        bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : undefined,
        bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : undefined,
        furnished: typeof rd.furnished === 'boolean' ? rd.furnished : undefined,
      }
    } else {
      return {
        id: docSnap.id,
        ...base,
      }
    }
  })
}

/**
 * List all “room” posts.
 */
export async function getRoomPosts(): Promise<RoomPost[]> {
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, where('type', '==', 'room'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    const rd = (data.structured || {}) as Record<string, any>
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      keywords: data.keywords || [],
      embedding: data.embedding || [],
      createdAt: data.createdAt,
      price: typeof data.price === 'number' ? data.price : undefined,
      address: data.address ?? '',
      bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : undefined,
      bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : undefined,
      furnished: typeof rd.furnished === 'boolean' ? rd.furnished : undefined,
    }
  })
}

/**
 * List all “roommate” posts.
 */
export async function getRoommatePosts(): Promise<RoommatePost[]> {
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, where('type', '==', 'roommate'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      images: data.images || [],
      keywords: data.keywords || [],
      embedding: data.embedding || [],
      createdAt: data.createdAt,
    }
  })
}
