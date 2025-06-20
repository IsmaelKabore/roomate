// File: src/app/api/posts/create/route.ts
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
        { error: 'Missing required field' },
        { status: 400 }
      )
    }

    const docData: any = {
      title: type === 'room' ? title.trim() : '',
      description: description.trim(),
      address: type === 'room' ? address.trim() : '',
      images,
      userId,
      type,
      price: type === 'room' ? price : null,
      keywords,
      structured: type === 'room'
        ? { bedrooms, bathrooms, furnished }
        : { bedrooms: null, bathrooms: null, furnished: null },
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }

    const ref = await db.collection('posts').add(docData)
    return NextResponse.json({ id: ref.id })
  } catch (err: any) {
    console.error('[/api/posts/create] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
