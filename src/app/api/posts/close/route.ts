import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Hardcoded Firebase Admin credentials for testing
const FIREBASE_CONFIG = {
  projectId: "roomate-64dcb",
  clientEmail: "firebase-adminsdk-fbsvc@roomate-64dcb.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD02yVqFYvt0adk\na8bpFlsuopEFH9XMCUfFHaX08giYq1YrZEXLo0rh4njslcAyd804Tsf+gkn19WDc\nSSmSP1B3iSyoUUCD/iC1Fl91EOEy5WEEmC3698x+FKFKyfRGFLS6G8tbBOcsBliw\nUJP7/nlcOYBSqTLrikLYJEVnsiMSs/K/fIh0Nt/1ykmON/lRJhYugPmkUkqd2rVC\nBChidfjdncUc4NCEgs72A4wuPhnu7nlthbLU/LjXkwgT/clrwzdMSC/mbBtyoUNc\nb1JApbSRsc/D+ooF7qqqpXgSgafbchIiZSR2fguNFYreLGn0mib56Zp6THjtVN2x\ntzZGnWYlAgMBAAECggEACQqekxBAnoODXt3r9mdw7oPqPvox9trQ36J8olLdpmWN\nRQTq3t4kwbqPJI1TD4oE9fNSxz8gZAivjvLUqiXUXtWd5Ik7jKQxqP4ugDAjYLG/\np1/HMuE7l9xDKHPUpVHWapjkJXRE5QdG9xvCmyeGa7Vj26mLy87LMRgFyBJ34RTZ\nf9JYlfoB9Vu1c6l8Wk9B6mEP0XfnYJS+SmNs6Af+tpulIJcYsVeUQnPMmnNw39v/\nvZhSm7j6uUnydeQidzWqny3Dj44Vo4h3ekeU8XLt9T0JH85G0K2z1qLgMJ8RePSz\n5o1ZXNGucPJ/gq44vwbbrlot7tfhH8iyir6EeLgxAQKBgQD+SvVo0/stXgRkBLWO\nihg3gev96wb3E2LNHXAYgSApnbbM5mDjpUNEYawDjBZuRHvxCy4WYxrlLZ6mWrL+\nVm46MCWTGvBoLB9AANP8zvDO6BQASVVskWmv/qeRPrURhG4UBTeQp435ARE6OYjy\ngb2+3iVKHMbkL+CMzmOtkcbh1QKBgQD2f/gPFtx/db7UQUPKbdARRyLtEcKP/6ph\nQL9MBg2V2a0G/3e/+Qfww7o5sPXPtO76dqVyjJVnGZe9j/kW5RR6RSOXk+C0X6xu\ni4VppVfec4+YzhEpaeLcl9EsRox4t69GIG5Tr02qLSJPP790Wsin3+hALYPkU3n+\nb0YTk8NLEQKBgQDNO3g3Y6a75b5LbtWNNfz3h58MbsxPStEZ1GFtFYH8tHIdiu21\nrOLOZLnsnvpXgmQ5lZlbrh69yoTZpCgER4Ns6QDaagqPONT71e9BgU8u3nWOCaGt\nHusahL9+5QpEGgqxk8hVsjVOO0NJJ7hUaMvYKPgViYYoEk/7tHMUWawXBQKBgHlD\nGtTRekd5tRbVxHOg8eqOBDB7vCr6quaM446Sq7w8CVKX+mEGMVHP95zJ4SL871Nn\napyfbB/8BxnJ6c/Jgflkac33gWM6bak0Gb2PCVr1nn6dYPPukxvR06TkT9ZTBnaJ\nHb0tUBeXfHlf8t9aibuL+sUXnvqD1k/EjcSzvC8BAoGAH22uqWMXKF1D9eO9Ruzc\nIx/CD8PZkTcmqfS5MtstWWEiCGdSBgZ1APKpVa3TP6ZZdB2WRZnwfT7jUc+HMdYd\ngvcVQlNjXggWE2okD3VA29HX5Pv9ZK6Ej0m2lf7yfJ3N8ABgV81DK68x3giMTjj0\nf/ribrpp4higS881I/zspSM=\n-----END PRIVATE KEY-----\n"
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(FIREBASE_CONFIG),
    })
    console.log('[/api/posts/close] Firebase Admin initialized successfully')
  } catch (error) {
    console.error('[/api/posts/close] Firebase Admin initialization failed:', error)
  }
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
  } catch (err: unknown) {
    console.error('[/api/posts/close] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
} 