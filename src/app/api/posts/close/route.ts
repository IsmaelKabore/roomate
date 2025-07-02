// File: src/app/api/posts/close/route.ts
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Validate that all required env vars are present
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin credentials in environment. ' +
    'Require FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
  )
}

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Replace literal "\n" with actual newlines
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  console.log('[/api/posts/close] Firebase Admin initialized')
}

const db = admin.firestore()

interface ClosePostPayload {
  postId: string
  userId: string
}

export async function POST(request: Request) {
  try {
    const { postId, userId } = (await request.json()) as ClosePostPayload

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing postId or userId' },
        { status: 400 }
      )
    }

    const ref = db.collection('posts').doc(postId)
    const snap = await ref.get()
    if (!snap.exists || snap.data()?.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    await ref.update({
      closed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[/api/posts/close] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
