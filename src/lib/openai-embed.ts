// File: src/lib/openai-embed.ts

import admin from "firebase-admin";
import OpenAI from "openai";

// Grab your env vars
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  OPENAI_API_KEY,
} = process.env;

// 1) Validate required env
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    "Missing one of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
  );
}
if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

// 2) Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // The literal "\n" in your .env needs replaced with actual newlines:
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// 3) Instantiate OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Cache TTL of 7 days
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export async function getOpenAIEmbedding(text: string): Promise<number[]> {
  // Simple deterministic hash of the input text for caching
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
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
  }
  return h.toString();
}
