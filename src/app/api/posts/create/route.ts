// File: src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { extractKeywordsFromDescription } from '@/lib/enhancedMatching'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "roomate-64dcb",
      clientEmail: "firebase-adminsdk-fbsvc@roomate-64dcb.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD02yVqFYvt0adk\na8bpFlsuopEFH9XMCUfFHaX08giYq1YrZEXLo0rh4njslcAyd804Tsf+gkn19WDc\nSSmSP1B3iSyoUUCD/iC1Fl91EOEy5WEEmC3698x+FKFKyfRGFLS6G8tbBOcsBliw\nUJP7/nlcOYBSqTLrikLYJEVnsiMSs/K/fIh0Nt/1ykmON/lRJhYugPmkUkqd2rVC\nBChidfjdncUc4NCEgs72A4wuPhnu7nlthbLU/LjXkwgT/clrwzdMSC/mbBtyoUNc\nb1JApbSRsc/D+ooF7qqqpXgSgafbchIiZSR2fguNFYreLGn0mib56Zp6THjtVN2x\ntzZGnWYlAgMBAAECggEACQqekxBAnoODXt3r9mdw7oPqPvox9trQ36J8olLdpmWN\nRQTq3t4kwbqPJI1TD4oE9fNSxz8gZAivjvLUqiXUXtWd5Ik7jKQxqP4ugDAjYLG/\np1/HMuE7l9xDKHPUpVHWapjkJXRE5QdG9xvCmyeGa7Vj26mLy87LMRgFyBJ34RTZ\nf9JYlfoB9Vu1c6l8Wk9B6mEP0XfnYJS+SmNs6Af+tpulIJcYsVeUQnPMmnNw39v/\nvZhSm7j6uUnydeQidzWqny3Dj44Vo4h3ekeU8XLt9T0JH85G0K2z1qLgMJ8RePSz\n5o1ZXNGucPJ/gq44vwbbrlot7tfhH8iyir6EeLgxAQKBgQD+SvVo0/stXgRkBLWO\nihg3gev96wb3E2LNHXAYgSApnbbM5mDjpUNEYawDjBZuRHvxCy4WYxrlLZ6mWrL+\nVm46MCWTGvBoLB9AANP8zvDO6BQASVVskWmv/qeRPrURhG4UBTeQp435ARE6OYjy\ngb2+3iVKHMbkL+CMzmOtkcbh1QKBgQD2f/gPFtx/db7UQUPKbdARRyLtEcKP/6ph\nQL9MBg2V2a0G/3e/+Qfww7o5sPXPtO76dqVyjJVnGZe9j/kW5RR6RSOXk+C0X6xu\ni4VppVfec4+YzhEpaeLcl9EsRox4t69GIG5Tr02qLSJPP790Wsin3+hALYPkU3n+\nb0YTk8NLEQKBgQDNO3g3Y6a75b5LbtWNNfz3h58MbsxPStEZ1GFtFYH8tHIdiu21\nrOLOZLnsnvpXgmQ5lZlbrh69yoTZpCgER4Ns6QDaagqPONT71e9BgU8u3nWOCaGt\nHusahL9+5QpEGgqxk8hVsjVOO0NJJ7hUaMvYKPgViYYoEk/7tHMUWawXBQKBgHlD\nGtTRekd5tRbVxHOg8eqOBDB7vCr6quaM446Sq7w8CVKX+mEGMVHP95zJ4SL871Nn\napyfbB/8BxnJ6c/Jgflkac33gWM6bak0Gb2PCVr1nn6dYPPukxvR06TkT9ZTBnaJ\nHb0tUBeXfHlf8t9aibuL+sUXnvqD1k/EjcSzvC8BAoGAH22uqWMXKF1D9eO9Ruzc\nIx/CD8PZkTcmqfS5MtstWWEiCGdSBgZ1APKpVa3TP6ZZdB2WRZnwfT7jUc+HMdYd\ngvcVQlNjXggWE2okD3VA29HX5Pv9ZK6Ej0m2lf7yfJ3N8ABgV81DK68x3giMTjj0\nf/ribrpp4higS881I/zspSM=\n-----END PRIVATE KEY-----\n"
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

    // Extract keywords if not provided or empty
    let finalKeywords = Array.isArray(keywords) && keywords.length > 0 ? keywords : await extractKeywordsFromDescription(description || '')

    const docData: any = {
      title: type === 'room' ? title.trim() : '',
      description: description.trim(),
      address: type === 'room' ? address.trim() : '',
      images,
      userId,
      type,
      price: type === 'room' ? price : null,
      keywords: finalKeywords,
      structured: type === 'room'
        ? { bedrooms, bathrooms, furnished }
        : { bedrooms: null, bathrooms: null, furnished: null },
      closed: false,
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
