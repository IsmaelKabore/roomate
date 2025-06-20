import admin from "firebase-admin";
import { StructuredFilters, EnhancedMatch, PostWithMeta } from "./types";
import { getOpenAIEmbedding } from "./openai-embed";

// Initialize Firebase Admin if not already done
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

// Enhanced similarity calculation with multiple factors
function calculateEnhancedSimilarity(
  userEmbedding: number[],
  postEmbedding: number[],
  userKeywords: string[],
  postKeywords: string[]
): { semantic: number; keyword: number; combined: number } {
  // 1. Cosine similarity for semantic understanding
  const semantic = cosineSimilarity(userEmbedding, postEmbedding);
  
  // 2. Keyword overlap score
  const userKeywordSet = new Set(userKeywords.map(k => k.toLowerCase()));
  const postKeywordSet = new Set(postKeywords.map(k => k.toLowerCase()));
  const intersection = new Set([...userKeywordSet].filter(k => postKeywordSet.has(k)));
  const union = new Set([...userKeywordSet, ...postKeywordSet]);
  const keyword = union.size > 0 ? intersection.size / union.size : 0;
  
  // 3. Combined score (weighted)
  const combined = semantic * 0.8 + keyword * 0.2;
  
  return { semantic, keyword, combined };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return 0;
  }
  
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = Number(a[i]), bi = Number(b[i]);
    if (Number.isNaN(ai) || Number.isNaN(bi)) return 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function geoDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  
  const h = Math.sin(dLat / 2) ** 2 + 
           Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Enhanced scoring with multiple factors
function calculateStructuredScore(
  post: PostWithMeta,
  filters: StructuredFilters,
  filterType: "room" | "roommate"
): { score: number; factors: Record<string, number>; explanation: string[] } {
  const factors: Record<string, number> = {};
  const explanations: string[] = [];
  let score = 1;

  // 1. Budget scoring (more nuanced than binary)
  if (post.price != null) {
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      factors.budget = 0;
      score = 0;
      explanations.push(`Price $${post.price} is outside your budget range`);
    } else {
      // Score based on how close to ideal budget (middle of range)
      const idealPrice = (filters.budgetMin + filters.budgetMax) / 2;
      const priceRange = filters.budgetMax - filters.budgetMin;
      const deviation = Math.abs(post.price - idealPrice) / priceRange;
      factors.budget = Math.max(0.5, 1 - deviation); // Minimum 0.5 if in range
      explanations.push(`Price $${post.price} fits your budget well`);
    }
  } else {
    factors.budget = 0.7; // Neutral score for posts without price
  }

  // 2. Location scoring with distance bands
  if (score > 0) {
    const distance = geoDistanceKm(post.structured.location, filters.location);
    if (distance > filters.locationRadiusKm) {
      factors.location = 0;
      score = 0;
      explanations.push(`Location is ${distance.toFixed(1)}km away (too far)`);
    } else {
      // Tiered scoring: <2km = 1.0, 2-5km = 0.8, 5-10km = 0.6
      if (distance < 2) {
        factors.location = 1.0;
        explanations.push(`Very close location (${distance.toFixed(1)}km away)`);
      } else if (distance < 5) {
        factors.location = 0.8;
        explanations.push(`Good location (${distance.toFixed(1)}km away)`);
      } else {
        factors.location = 0.6;
        explanations.push(`Acceptable location (${distance.toFixed(1)}km away)`);
      }
    }
  }

  // 3. Room-specific scoring (only for room searches)
  if (score > 0 && filterType === "room") {
    // Bedrooms - exact match preferred, but flexible
    if (post.structured.bedrooms === filters.bedrooms) {
      factors.bedrooms = 1.0;
      explanations.push(`Perfect bedroom count (${filters.bedrooms})`);
    } else if (Math.abs(post.structured.bedrooms - filters.bedrooms) === 1) {
      factors.bedrooms = 0.7;
      explanations.push(`Close bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
    } else {
      factors.bedrooms = 0.4;
      explanations.push(`Different bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
    }

    // Bathrooms - similar logic
    if (post.structured.bathrooms === filters.bathrooms) {
      factors.bathrooms = 1.0;
    } else if (Math.abs(post.structured.bathrooms - filters.bathrooms) <= 0.5) {
      factors.bathrooms = 0.8;
    } else {
      factors.bathrooms = 0.6;
    }

    // Furnished preference
    if (post.structured.furnished === filters.furnished) {
      factors.furnished = 1.0;
      explanations.push(`Furnished preference matches`);
    } else {
      factors.furnished = 0.8;
      explanations.push(`Furnished preference differs`);
    }
  }

  // Calculate final structured score
  const factorValues = Object.values(factors);
  if (factorValues.length > 0) {
    score = factorValues.reduce((acc, val) => acc * val, 1);
  }

  return { score, factors, explanation: explanations };
}

// Enhanced matching with better explanations
export async function fetchEnhancedMatchesV2(
  userDescription: string,
  userKeywords: string[],
  filters: StructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  // Generate embedding for user description
  const userEmbedding = await getOpenAIEmbedding(userDescription);
  
  const snap = await db.collection("posts").get();
  const scored: EnhancedMatch[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    if (data.userId === excludeUserId || data.type !== filterType) continue;

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

    // Enhanced structured scoring
    const structuredResult = calculateStructuredScore(post, filters, filterType);
    if (structuredResult.score === 0) continue; // Hard filters failed

    // Enhanced semantic scoring
    const postKeywords = data.keywords || [];
    const similarityResult = calculateEnhancedSimilarity(
      userEmbedding,
      post.embedding,
      userKeywords,
      postKeywords
    );

    // Multi-factor combined scoring
    const combinedScore = 
      similarityResult.combined * 0.6 +  // Semantic + keyword similarity
      structuredResult.score * 0.4;      // Structured filters

    // Generate detailed explanation
    const explanationParts = [
      ...structuredResult.explanation,
      `Semantic similarity: ${Math.round(similarityResult.semantic * 100)}%`,
      `Keyword overlap: ${Math.round(similarityResult.keyword * 100)}%`
    ];

    scored.push({
      ...post,
      structuredScore: +structuredResult.score.toFixed(3),
      semanticScore: +similarityResult.combined.toFixed(3),
      combinedScore: +combinedScore.toFixed(3),
      explanation: explanationParts.join('. '),
    });
  }

  return scored
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topN);
}

// Utility for extracting keywords from natural language
export async function extractKeywordsFromDescription(description: string): Promise<string[]> {
  // Simple keyword extraction - could be enhanced with NLP
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'looking', 'need', 'want', 'seeking']);
  
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
} 