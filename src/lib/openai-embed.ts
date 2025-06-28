// File: src/lib/openai-embed.ts

import admin from "firebase-admin";
import OpenAI from "openai";

// ⚠️ WARNING: SECURITY RISK! ⚠️
// These credentials are hardcoded and will be visible in your source code.
// This is NOT recommended for production use.
// Consider using environment variables instead.

// Get credentials from environment variables with fallbacks
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "roomate-64dcb";
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@roomate-64dcb.iam.gserviceaccount.com";
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD02yVqFYvt0adk\na8bpFlsuopEFH9XMCUfFHaX08giYq1YrZEXLo0rh4njslcAyd804Tsf+gkn19WDc\nSSmSP1B3iSyoUUCD/iC1Fl91EOEy5WEEmC3698x+FKFKyfRGFLS6G8tbBOcsBliw\nUJP7/nlcOYBSqTLrikLYJEVnsiMSs/K/fIh0Nt/1ykmON/lRJhYugPmkUkqd2rVC\nBChidfjdncUc4NCEgs72A4wuPhnu7nlthbLU/LjXkwgT/clrwzdMSC/mbBtyoUNc\nb1JApbSRsc/D+ooF7qqqpXgSgafbchIiZSR2fguNFYreLGn0mib56Zp6THjtVN2x\ntzZGnWYlAgMBAAECggEACQqekxBAnoODXt3r9mdw7oPqPvox9trQ36J8olLdpmWN\nRQTq3t4kwbqPJI1TD4oE9fNSxz8gZAivjvLUqiXUXtWd5Ik7jKQxqP4ugDAjYLG/\np1/HMuE7l9xDKHPUpVHWapjkJXRE5QdG9xvCmyeGa7Vj26mLy87LMRgFyBJ34RTZ\nf9JYlfoB9Vu1c6l8Wk9B6mEP0XfnYJS+SmNs6Af+tpulIJcYsVeUQnPMmnNw39v/\nvZhSm7j6uUnydeQidzWqny3Dj44Vo4h3ekeU8XLt9T0JH85G0K2z1qLgMJ8RePSz\n5o1ZXNGucPJ/gq44vwbbrlot7tfhH8iyir6EeLgxAQKBgQD+SvVo0/stXgRkBLWO\nihg3gev96wb3E2LNHXAYgSApnbbM5mDjpUNEYawDjBZuRHvxCy4WYxrlLZ6mWrL+\nVm46MCWTGvBoLB9AANP8zvDO6BQASVVskWmv/qeRPrURhG4UBTeQp435ARE6OYjy\ngb2+3iVKHMbkL+CMzmOtkcbh1QKBgQD2f/gPFtx/db7UQUPKbdARRyLtEcKP/6ph\nQL9MBg2V2a0G/3e/+Qfww7o5sPXPtO76dqVyjJVnGZe9j/kW5RR6RSOXk+C0X6xu\ni4VppVfec4+YzhEpaeLcl9EsRox4t69GIG5Tr02qLSJPP790Wsin3+hALYPkU3n+\nb0YTk8NLEQKBgQDNO3g3Y6a75b5LbtWNNfz3h58MbsxPStEZ1GFtFYH8tHIdiu21\nrOLOZLnsnvpXgmQ5lZlbrh69yoTZpCgER4Ns6QDaagqPONT71e9BgU8u3nWOCaGt\nHusahL9+5QpEGgqxk8hVsjVOO0NJJ7hUaMvYKPgViYYoEk/7tHMUWawXBQKBgHlD\nGtTRekd5tRbVxHOg8eqOBDB7vCr6quaM446Sq7w8CVKX+mEGMVHP95zJ4SL871Nn\napyfbB/8BxnJ6c/Jgflkac33gWM6bak0Gb2PCVr1nn6dYPPukxvR06TkT9ZTBnaJ\nHb0tUBeXfHlf8t9aibuL+sUXnvqD1k/EjcSzvC8BAoGAH22uqWMXKF1D9eO9Ruzc\nIx/CD8PZkTcmqfS5MtstWWEiCGdSBgZ1APKpVa3TP6ZZdB2WRZnwfT7jUc+HMdYd\ngvcVQlNjXggWE2okD3VA29HX5Pv9ZK6Ej0m2lf7yfJ3N8ABgV81DK68x3giMTjj0\nf/ribrpp4higS881I/zspSM=\n-----END PRIVATE KEY-----";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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";

// Initialize Firebase Admin
let firebaseInitialized = false;
if (!admin.apps.length) {
  try {
    // Clean and format the private key properly to fix ASN.1 parsing error
    const cleanPrivateKey = FIREBASE_PRIVATE_KEY
      .replace(/\\n/g, "\n") // Replace literal \n with actual newlines
      .trim(); // Remove any extra whitespace
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: cleanPrivateKey,
      }),
    });
    firebaseInitialized = true;
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // Continue with degraded functionality instead of crashing
  }
}

// Instantiate OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Cache TTL of 7 days
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export async function getOpenAIEmbedding(text: string): Promise<number[]> {
  // Check if services are available
  if (!firebaseInitialized) {
    console.warn("Firebase not initialized. Returning zero vector.");
    return Array(1536).fill(0);
  }

  // Simple deterministic hash of the input text for caching
  const key = hash(text);

  try {
    const ref = admin.firestore().collection("embeddings").doc(key);

    // 1) Try cache
    const snap = await ref.get();
    if (snap.exists) {
      const data = snap.data()!;
      const { embedding, updatedAt } = data;
      if (
        Array.isArray(embedding) &&
        updatedAt.toMillis() + CACHE_TTL_MS > Date.now()
      ) {
        return embedding;
      }
    }

    // 2) Call OpenAI with retry
    let attempts = 0;
    while (attempts < 3) {
      try {
        const resp = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text,
        });
        const embedding = resp.data[0].embedding;
        // store to cache
        await ref.set({
          embedding,
          updatedAt: admin.firestore.Timestamp.now(),
        });
        return embedding;
      } catch (e) {
        attempts++;
        // exponential backoff
        await new Promise((res) => setTimeout(res, 2 ** attempts * 500));
      }
    }

    // 3) If all retries fail, return zeroed vector
    return Array(1536).fill(0);
  } catch (error) {
    console.error("Error in getOpenAIEmbedding:", error);
    return Array(1536).fill(0);
  }
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
  }
  return h.toString();
}
