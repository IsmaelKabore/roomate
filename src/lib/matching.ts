// File: src/lib/matching.ts

import admin from "firebase-admin";
import { StructuredFilters, EnhancedMatch, PostWithMeta } from "./types";

// -- Firebase Admin init (one-time) --
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

// -- Helpers --

/** Safe cosine similarity, returns 0 on any error or mismatch */
function cosineSimilarity(a: number[], b: number[]): number {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length
  ) {
    return 0;
  }
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = Number(a[i]), bi = Number(b[i]);
    if (Number.isNaN(ai) || Number.isNaN(bi)) {
      return 0;
    }
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Haversine distance in kilometers */
function geoDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Fetch & rank posts by your minimal filters + semantic similarity.
 */
export async function fetchEnhancedMatches(
  userEmbedding: number[],
  filters: StructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  const snap = await db.collection("posts").get();
  const scored: EnhancedMatch[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    if (data.userId === excludeUserId || data.type !== filterType) continue;

    // Rehydrate a typed PostWithMeta
    const post: PostWithMeta = {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      address: data.address,
      price: data.price ?? null,
      images: data.images || [],
      type: data.type,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      structured: data.structured,
      embedding: Array.isArray(data.embedding) ? data.embedding : [],
    };

    let sScore = 1;

    // 1) Budget filter
    if (
      post.price == null ||
      post.price < filters.budgetMin ||
      post.price > filters.budgetMax
    ) {
      sScore = 0;
    }

    // 2) Geo‐radius filter & score
    if (sScore > 0) {
      const dist = geoDistanceKm(post.structured.location, filters.location);
      if (dist > filters.locationRadiusKm) {
        sScore = 0;
      } else {
        // closer = higher score
        sScore *= 1 - dist / filters.locationRadiusKm;
      }
    }

    // 3) Room‐specific tweaks
    if (sScore > 0 && filterType === "room") {
      if (post.structured.bedrooms !== filters.bedrooms) sScore *= 0.5;
      if (post.structured.bathrooms !== filters.bathrooms) sScore *= 0.5;
      if (post.structured.furnished !== filters.furnished) sScore *= 0.8;
    }

    // ---- semantic scoring ----
    const semScore = cosineSimilarity(userEmbedding, post.embedding);

    // ---- combine ----
    const combined = semScore * 0.7 + sScore * 0.3;

    scored.push({
      ...post,
      structuredScore: +sScore.toFixed(3),
      semanticScore: +semScore.toFixed(3),
      combinedScore: +combined.toFixed(3),
      explanation:
        semScore > 0.2
          ? "Your description matches their listing text closely."
          : "Filters matched but semantics were less similar.",
    });
  }

  // Sort by highest combinedScore and return topN
  return scored
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topN);
}
