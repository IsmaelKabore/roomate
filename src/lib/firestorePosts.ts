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
  serverTimestamp,
} from 'firebase/firestore'
import { getDeepSeekEmbedding } from '@/lib/deepseek-server'

/** Common fields for every post in Firestore. */
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

/** What the UI consumer sees for a room post. */
export interface RoomPost {
  id: string
  userId: string
  title: string
  description: string
  images: string[]
  keywords: string[]
  embedding: number[]
  createdAt: Timestamp
  price: number
  address: string
  bedrooms: number
  bathrooms: number
  furnished: boolean
}

/** What the UI consumer sees for a roommate post. */
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

/** Payload for creating a new post. */
export interface CreatePostData {
  title: string
  description: string
  price?: number
  address?: string
  images: string[]
  userId: string
  type: 'room' | 'roommate'
  keywords: string[]
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
}

/** Create a new post document (and generate its embedding). */
export async function createPost(postData: CreatePostData): Promise<string> {
  const postsRef = collection(db, 'posts')

  // force price to a number
  const priceNum = postData.type === 'room'
    ? Number(postData.price ?? 0)
    : null

  const combinedText = [
    postData.title.trim(),
    postData.description.trim(),
    (postData.address || '').trim(),
  ].join('\n')

  const embedding = await getDeepSeekEmbedding(combinedText)

  const docRef = await addDoc(postsRef, {
    userId: postData.userId,
    title: postData.title.trim(),
    description: postData.description.trim(),
    images: postData.images,
    type: postData.type,
    price: priceNum,                     // ← always a number (or null)
    address: postData.type === 'room'
      ? postData.address?.trim() ?? ''
      : '',
    keywords: postData.keywords,
    embedding,
    createdAt: Timestamp.now(),
    structured:
      postData.type === 'room'
        ? {
            bedrooms: postData.bedrooms ?? 0,
            bathrooms: postData.bathrooms ?? 0,
            furnished: postData.furnished ?? false,
          }
        : null,
  })

  return docRef.id
}

/** Fetch a single post by its ID. */
export async function getPostById(
  postId: string
): Promise<RoomPost | RoommatePost | null> {
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
      price: Number(data.price ?? 0),      // ← coerce again to be safe
      address: data.address ?? '',
      bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : 0,
      bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : 0,
      furnished: typeof rd.furnished === 'boolean' ? rd.furnished : false,
    }
  } else {
    return {
      id: snap.id,
      ...base,
    }
  }
}

/** Update an existing post (recomputes embedding). */
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

  const combinedText = [
    postData.title.trim(),
    postData.description.trim(),
    (postData.address || '').trim(),
  ].join('\n')
  const embedding = await getDeepSeekEmbedding(combinedText)

  await updateDoc(postRef, {
    title: postData.title.trim(),
    description: postData.description.trim(),
    price: postData.type === 'room'
      ? Number(postData.price ?? 0)
      : null,                              // ← always number|null
    address: postData.type === 'room'
      ? postData.address?.trim() ?? ''
      : '',
    images: postData.images,
    type: postData.type,
    keywords: postData.keywords,
    embedding,
    structured:
      postData.type === 'room'
        ? {
            bedrooms: postData.bedrooms ?? 0,
            bathrooms: postData.bathrooms ?? 0,
            furnished: postData.furnished ?? false,
          }
        : null,
    updatedAt: serverTimestamp(),
  })
}

/** Delete a post document. */
export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId))
}

/** List all “room” posts. */
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
      price: Number(data.price ?? 0),      // ← coerce here too
      address: data.address ?? '',
      bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : 0,
      bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : 0,
      furnished: typeof rd.furnished === 'boolean' ? rd.furnished : false,
    }
  })
}

/** List all “roommate” posts. */
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

/** List all posts (room & roommate) by a specific user. */
export async function getPostsByUser(
  userId: string
): Promise<(RoomPost | RoommatePost)[]> {
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
        price: Number(data.price ?? 0),  // ← safe fallback
        address: data.address ?? '',
        bedrooms: typeof rd.bedrooms === 'number' ? rd.bedrooms : 0,
        bathrooms: typeof rd.bathrooms === 'number' ? rd.bathrooms : 0,
        furnished: typeof rd.furnished === 'boolean' ? rd.furnished : false,
      }
    } else {
      return {
        id: docSnap.id,
        ...base,
      }
    }
  })
}
