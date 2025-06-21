import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getOpenAIEmbedding } from '@/lib/openai-embed'

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

export async function POST(req: Request) {
  try {
    const {
      postId,
      userId,
      title,
      description,
      address,
      price,
      images,
      type,
      keywords,
      bedrooms,
      bathrooms,
      furnished,
    } = await req.json()

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 })
    }

    const ref = db.collection('posts').doc(postId)
    const snap = await ref.get()
    if (!snap.exists || snap.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // regenerate embedding on update
    const combined = [title, description, address].join('\n')
    const embedding = await getOpenAIEmbedding(combined)

    await ref.update({
      title:       title.trim(),
      description: description.trim(),
      address:     address.trim(),
      price:       price ?? null,
      images,
      type,
      keywords,
      structured: { bedrooms, bathrooms, furnished },
      embedding,
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/posts/update] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
