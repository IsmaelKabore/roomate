// File: src/app/api/posts/update/route.ts
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getOpenAIEmbedding } from '@/lib/openai-embed'
import { extractKeywordsFromDescription } from '@/lib/enhancedMatching'

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

interface UpdatePostPayload {
  postId: string
  userId: string
  title: string
  description: string
  address: string
  price?: number
  images: string[]
  type: 'room' | 'roommate'
  keywords: string[]
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdatePostPayload

    if (!body.postId || !body.userId) {
      return NextResponse.json(
        { error: 'Missing postId or userId' },
        { status: 400 }
      )
    }

    const ref = db.collection('posts').doc(body.postId)
    const snap = await ref.get()
    if (!snap.exists || snap.data()?.userId !== body.userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const combined = [body.title, body.description, body.address].join('\n')
    const embedding = await getOpenAIEmbedding(combined)

    // Preserve previous structured values if not provided in the update payload
    const prevStructured = (snap.data()?.structured || {}) as Partial<{
      bedrooms: number | null;
      bathrooms: number | null;
      furnished: boolean | null;
    }>

    const finalKeywords = Array.isArray(body.keywords) && body.keywords.length > 0
      ? body.keywords
      : await extractKeywordsFromDescription(body.description || '')

    await ref.update({
      title: body.title.trim(),
      description: body.description.trim(),
      address: body.address.trim(),
      price: body.price ?? null,
      images: body.images,
      type: body.type,
      keywords: finalKeywords,
      structured: {
        bedrooms: body.bedrooms ?? prevStructured.bedrooms ?? null,
        bathrooms: body.bathrooms ?? prevStructured.bathrooms ?? null,
        furnished: typeof body.furnished === 'boolean' ? body.furnished : (prevStructured.furnished ?? null),
      },
      embedding,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[/api/posts/update] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
