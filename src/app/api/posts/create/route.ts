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
    const body = await req.json()
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
    } = body

    // coerce price to number
    const priceNum = type === 'room'
      ? Number(price)
      : null

    // validate
    if (
      !userId ||
      !Array.isArray(images) || images.length === 0 ||
      !Array.isArray(keywords) || keywords.length === 0 ||
      typeof description !== 'string' ||
      (type === 'room' && (
        !title?.trim() ||
        !address?.trim() ||
        typeof priceNum !== 'number' || isNaN(priceNum) ||
        typeof bedrooms !== 'number' ||
        typeof bathrooms !== 'number' ||
        typeof furnished !== 'boolean'
      ))
    ) {
      return NextResponse.json({ error: 'Missing or invalid required field' }, { status: 400 })
    }

    const docData: any = {
      title: type === 'room' ? title.trim() : '',
      description: description.trim(),
      address: type === 'room' ? address.trim() : '',
      images,
      userId,
      type,
      price: priceNum,            // ← always a Number or null
      keywords,
      structured: type === 'room'
        ? { bedrooms, bathrooms, furnished }
        : null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }

    const ref = await db.collection('posts').add(docData)
    return NextResponse.json({ id: ref.id })
  } catch (err: any) {
    console.error('[/api/posts/create] Error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
