// File: src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { extractKeywordsFromDescription } from '@/lib/enhancedMatching'
import { getOpenAIEmbedding } from '@/lib/openai-embed'

// Load Firebase Admin credentials from environment
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin credentials. ' +
    'Require FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in env.'
  )
}

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  console.log('[/api/posts/create] Firebase Admin initialized')
}

const db = admin.firestore()

export async function POST(req: Request) {
  try {
    const {
      title,
      description,
      address,
      images,
      userId,
      type,
      price,
      keywords,
      bedrooms,
      bathrooms,
      furnished,
    } = await req.json()

    // Validate required fields
    if (
      !userId ||
      !Array.isArray(images) ||
      images.length === 0 ||
      !Array.isArray(keywords) ||
      keywords.length === 0 ||
      typeof description !== 'string' ||
      (type === 'room' && (typeof title !== 'string' || !title.trim())) ||
      (type === 'room' && (typeof address !== 'string' || !address.trim())) ||
      (type === 'room' && typeof price !== 'number') ||
      (type === 'room' && typeof bedrooms !== 'number') ||
      (type === 'room' && typeof bathrooms !== 'number') ||
      (type === 'room' && typeof furnished !== 'boolean')
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required field' },
        { status: 400 }
      )
    }

    // Determine final keywords
    const finalKeywords =
      Array.isArray(keywords) && keywords.length > 0
        ? keywords
        : await extractKeywordsFromDescription(description)

    // Prepare combined text for embedding
    const combinedText = [
      type === 'room' ? title.trim() : '',
      description.trim(),
      type === 'room' ? address.trim() : '',
    ].join('\n').trim()

    // Generate embedding
    const embedding = await getOpenAIEmbedding(combinedText)

    // Assemble Firestore document
    const docData = {
      title: type === 'room' ? title.trim() : '',
      description: description.trim(),
      address: type === 'room' ? address.trim() : '',
      images,
      userId,
      type,
      price: type === 'room' ? price : null,
      keywords: finalKeywords,
      embedding,
      structured: type === 'room'
        ? { bedrooms, bathrooms, furnished }
        : { bedrooms: null, bathrooms: null, furnished: null },
      closed: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }

    console.log(
      `[/api/posts/create] Creating ${type} post with embedding length ${embedding.length}`
    )

    const ref = await db.collection('posts').add(docData)

    console.log(`[/api/posts/create] Successfully created post ${ref.id}`)
    return NextResponse.json({ id: ref.id })
  } catch (err: unknown) {
    console.error('[/api/posts/create] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
