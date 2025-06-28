import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
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
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 })
    }

    const ref = db.collection('posts').doc(postId)
    const snap = await ref.get()
    if (!snap.exists || snap.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await ref.update({
      closed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/posts/close] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
} 