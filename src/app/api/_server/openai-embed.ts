// File: src/app/api/_server/openai-embed.ts

import admin from "firebase-admin";
import { openai } from "./openai-client";

// Grab and validate environment variables
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  OPENAI_API_KEY,
} = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    "Missing one of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
  );
}
if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

// Initialize Firebase Admin (one-time)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// Cache TTL: 7 days
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

/**
 * Get or generate an OpenAI embedding for a given text.
 * Caches results in Firestore to avoid repeated calls.
 */
export async function getOpenAIEmbedding(text: string): Promise<number[]> {
  const key = hash(text);
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

  // 2) Request new embedding with retry
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      const embedding = response.data[0].embedding;
      await ref.set({
        embedding,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return embedding;
    } catch {
      // exponential backoff
      await new Promise((res) => setTimeout(res, 2 ** attempt * 500));
    }
  }

  // 3) All retries failed → return zero vector
  return Array(1536).fill(0);
}

/**
 * Simple non-cryptographic hash for cache keys
 */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
  }
  return h.toString();
}
