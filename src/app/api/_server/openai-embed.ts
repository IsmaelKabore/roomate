// File: src/lib/openai-embed.ts

import admin from "firebase-admin";
import OpenAI from "openai";

// Get credentials from environment variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

// Validate required Firebase Admin SDK credentials
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Missing Firebase Admin SDK credentials in environment variables');
  console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Initialize Firebase Admin
let firebaseInitialized = false;
if (!admin.apps.length && FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
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
} else if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.warn("Firebase Admin not initialized due to missing environment variables");
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
