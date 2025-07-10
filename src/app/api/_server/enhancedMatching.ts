// File: src/app/api/_server/enhancedMatching.ts

import admin from "firebase-admin";
import {
  StructuredFilters,
  EnhancedMatch,
  PostWithMeta,
  EnhancedStructuredFilters
} from "@/lib/types";
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
  const intersection = new Set(
    [...userKeywordSet].filter(k => postKeywordSet.has(k))
  );
  const union = new Set([...userKeywordSet, ...postKeywordSet]);
  const keyword = union.size > 0 ? intersection.size / union.size : 0;
  
  // 3. Combined score (weighted)
  const combined = semantic * 0.8 + keyword * 0.2;
  
  return { semantic, keyword, combined };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length !== b.length ||
    a.length === 0
  ) {
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

/**  
 * Haversine distance in kilometers.  
 * Returns Infinity if either point is missing or invalid,  
 * so downstream filtering just excludes it instead of throwing.  
 */
function geoDistanceKm(
  a?: { lat: number; lng: number },
  b?: { lat: number; lng: number }
): number {
  if (
    !a ||
    !b ||
    typeof a.lat !== "number" ||
    typeof a.lng !== "number" ||
    typeof b.lat !== "number" ||
    typeof b.lng !== "number"
  ) {
    return Infinity;
  }
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Enhanced scoring with multiple factors - only applies explicitly set filters
function calculateStructuredScore(
  post: PostWithMeta,
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate"
): { score: number; factors: Record<string, number>; explanation: string[] } {
  const factors: Record<string, number> = {};
  const explanations: string[] = [];
  let score = 1;
  const explicitFilters = filters._explicitFilters || {};

  console.log(`🔍 Filter Analysis for Post ${post.id}:`);

  // 1. Budget scoring - only if budget is explicitly set
  if (post.price != null && (explicitFilters.budgetMin || explicitFilters.budgetMax)) {
    console.log(
      `💰 Budget Check: Post=$${post.price}, Range=$${filters.budgetMin}-$${filters.budgetMax}`
    );
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      factors.budget = 0.3;
      explanations.push(
        `Price $${post.price} is outside your specified budget range`
      );
      console.log(`❌ Outside budget range - Score: 30%`);
    } else {
      const idealPrice = (filters.budgetMin + filters.budgetMax) / 2;
      const priceRange = filters.budgetMax - filters.budgetMin;
      const deviation = Math.abs(post.price - idealPrice) / priceRange;
      factors.budget = Math.max(0.7, 1 - deviation);
      explanations.push(`Price $${post.price} fits your budget well`);
      console.log(
        `✅ Within budget - Ideal: $${idealPrice}, Deviation: ${(deviation *
          100).toFixed(1)}%, Score: ${(factors.budget * 100).toFixed(1)}%`
      );
    }
  } else if (post.price != null) {
    console.log(
      `💰 Budget: Post=$${post.price} (Budget filter not explicitly set - ignored)`
    );
  } else {
    console.log(`💰 Budget: Post price not specified`);
  }

  // 2. Location scoring - only if location preferences are explicitly set
  if (explicitFilters.location || explicitFilters.locationRadiusKm) {
    const distance = geoDistanceKm(post.structured.location, filters.location);
    console.log(
      `📍 Location Check: Distance=${distance.toFixed(1)}km, Max=${filters.locationRadiusKm}km`
    );
    if (distance > filters.locationRadiusKm) {
      factors.location = 0.2;
      explanations.push(
        `Location is ${distance.toFixed(
          1
        )}km away (outside your preferred area)`
      );
      console.log(`❌ Outside preferred radius - Score: 20%`);
    } else {
      if (distance < 2) {
        factors.location = 1.0;
        explanations.push(`Excellent location (${distance.toFixed(1)}km away)`);
        console.log(`✅ Excellent proximity - Score: 100%`);
      } else if (distance < 5) {
        factors.location = 0.9;
        explanations.push(`Great location (${distance.toFixed(1)}km away)`);
        console.log(`✅ Great proximity - Score: 90%`);
      } else {
        factors.location = 0.8;
        explanations.push(`Good location (${distance.toFixed(1)}km away)`);
        console.log(`✅ Good proximity - Score: 80%`);
      }
    }
  } else {
    console.log(
      `📍 Location: Distance not evaluated (Location filter not explicitly set)`
    );
  }

  // 3. Room-specific scoring (only for room searches and only if explicitly set)
  if (filterType === "room") {
    console.log(`🏠 Room-specific filters (for ${filterType} search):`);

    if (explicitFilters.bedrooms) {
      console.log(
        `🛏️  Bedrooms: Post=${post.structured.bedrooms}, Desired=${filters.bedrooms}`
      );
      if (post.structured.bedrooms === filters.bedrooms) {
        factors.bedrooms = 1.0;
        explanations.push(`Perfect bedroom count (${filters.bedrooms})`);
        console.log(`✅ Perfect match - Score: 100%`);
      } else if (
        Math.abs(post.structured.bedrooms - filters.bedrooms) === 1
      ) {
        factors.bedrooms = 0.8;
        explanations.push(
          `Close bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`
        );
        console.log(`⚠️  Close match (±1) - Score: 80%`);
      } else {
        factors.bedrooms = 0.5;
        explanations.push(
          `Different bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`
        );
        console.log(`❌ Different count - Score: 50%`);
      }
    } else {
      console.log(
        `🛏️  Bedrooms: Post=${post.structured.bedrooms} (Filter not set - ignored)`
      );
    }

    if (explicitFilters.bathrooms) {
      console.log(
        `🚿 Bathrooms: Post=${post.structured.bathrooms}, Desired=${filters.bathrooms}`
      );
      if (post.structured.bathrooms === filters.bathrooms) {
        factors.bathrooms = 1.0;
        explanations.push(`Perfect bathroom count (${filters.bathrooms})`);
        console.log(`✅ Perfect match - Score: 100%`);
      } else if (
        Math.abs(post.structured.bathrooms - filters.bathrooms) <= 0.5
      ) {
        factors.bathrooms = 0.8;
        explanations.push(`Close bathroom count`);
        console.log(`⚠️  Close match (±0.5) - Score: 80%`);
      } else {
        factors.bathrooms = 0.6;
        explanations.push(`Different bathroom count`);
        console.log(`❌ Different count - Score: 60%`);
      }
    } else {
      console.log(
        `🚿 Bathrooms: Post=${post.structured.bathrooms} (Filter not set - ignored)`
      );
    }

    if (explicitFilters.furnished) {
      console.log(
        `🪑 Furnished: Post=${post.structured.furnished ? "Yes" : "No"}, Desired=${
          filters.furnished ? "Yes" : "No"
        }`
      );
      if (post.structured.furnished === filters.furnished) {
        factors.furnished = 1.0;
        explanations.push(`Furnished preference matches perfectly`);
        console.log(`✅ Perfect match - Score: 100%`);
      } else {
        factors.furnished = 0.7;
        explanations.push(
          `Furnished preference differs from your preference`
        );
        console.log(`❌ Preference mismatch - Score: 70%`);
      }
    } else {
      console.log(
        `🪑 Furnished: Post=${
          post.structured.furnished ? "Yes" : "No"
        } (Filter not set - ignored)`
      );
    }
  } else {
    console.log(
      `🏠 Room-specific filters: Skipped (searching for ${filterType})`
    );
  }

  const factorValues = Object.values(factors);
  console.log(`📊 Structured Score Calculation:`);

  if (factorValues.length > 0) {
    score =
      factorValues.reduce((sum, val) => sum + val, 0) /
      factorValues.length;
    console.log(
      `Applied Factors: [${Object.keys(factors).join(", ")}]`
    );
    console.log(
      `Individual Scores: [${factorValues
        .map(v => (v * 100).toFixed(1) + "%")
        .join(", ")}]`
    );
    console.log(
      `Average Score: ${(score * 100).toFixed(1)}%`
    );
  } else {
    console.log(`No explicit filters applied - using neutral score`);
  }

  if (factorValues.length === 0) {
    explanations.push(
      "No specific filters applied - ranked by semantic similarity"
    );
  }
  console.log(`✅ Final Structured Score: ${(score * 100).toFixed(1)}%`);

  return { score, factors, explanation: explanations };
}

// Use OpenAI to intelligently rank filtered posts based on user description
async function rankPostsWithOpenAI(
  userDescription: string,
  candidates: EnhancedMatch[],
  filterType: "room" | "roommate",
  topN: number
): Promise<EnhancedMatch[]> {
  try {
    console.log("🤖 Preparing AI ranking prompt...");
    const postDescriptions = candidates
      .map((post, index) => {
        const details: string[] = [];
        details.push(`ID: ${post.id}`);
        details.push(`Title: ${post.title}`);
        details.push(`Description: ${post.description}`);
        if (filterType === "room") {
          if (post.price) details.push(`Price: $${post.price}/month`);
          if (post.address) details.push(`Address: ${post.address}`);
          if (post.structured.bedrooms)
            details.push(`Bedrooms: ${post.structured.bedrooms}`);
          if (post.structured.bathrooms)
            details.push(`Bathrooms: ${post.structured.bathrooms}`);
          details.push(
            `Furnished: ${post.structured.furnished ? "Yes" : "No"}`
          );
        }
        return `${index + 1}. ${details.join(" | ")}`;
      })
      .join("\n\n");

    const prompt = `You are an intelligent matching system for ${
      filterType === "room" ? "room rentals" : "roommate matching"
    }. 

USER'S REQUEST:
"${userDescription}"

FILTERED CANDIDATES:
${postDescriptions}

TASK:
Rank these ${candidates.length} candidates from BEST to WORST match based on how well they satisfy the user's request. Consider:
- Content relevance and match quality
- Specific preferences mentioned in the user's description
- Overall suitability for the user's needs

INSTRUCTIONS:
1. Return ONLY the top ${Math.min(topN, candidates.length)} rankings
2. For each ranking, provide the Post ID and a brief explanation (1-2 sentences) of why it's a good match
3. Use this exact format:

RANKING:
1. ID: [POST_ID] - [Brief explanation]
2. ID: [POST_ID] - [Brief explanation]
[Continue for top ${Math.min(topN, candidates.length)} only]

Be concise but specific.`;

    console.log("🤖 Sending ranking request to OpenAI...");
    const response = await getOpenAICompletion(prompt);
    console.log("🤖 Received response from OpenAI");

    const rankedPosts = parseOpenAIRanking(response, candidates);
    return rankedPosts.slice(0, topN);
  } catch (error) {
    console.error("🤖 AI ranking failed:", error);
    return candidates
      .sort((a, b) => b.structuredScore - a.structuredScore)
      .slice(0, topN)
      .map((post, index) => ({
        ...post,
        combinedScore: post.structuredScore,
        semanticScore: 0,
        explanation: `Ranked ${index + 1} by filter score. ${post.explanation}`,
      }));
  }
}

// Get completion from OpenAI using the chat API
async function getOpenAICompletion(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at matching people with rooms and roommates.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// Parse OpenAI ranking response and match with original posts
function parseOpenAIRanking(
  response: string,
  candidates: EnhancedMatch[]
): EnhancedMatch[] {
  const rankedResults: EnhancedMatch[] = [];
  const candidateMap = new Map(
    candidates.map(c => [c.id, c])
  );

  const lines = response.split("\n");
  let rankingStarted = false;
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes("RANKING:")) {
      rankingStarted = true;
      continue;
    }
    if (!rankingStarted || !trimmedLine) continue;
    const match = trimmedLine.match(
      /^\d+\.\s*ID:\s*([^\s-]+)\s*-\s*(.+)$/
    );
    if (match) {
      const [, postId, explanation] = match;
      const candidate = candidateMap.get(postId);
      if (candidate) {
        const rank = rankedResults.length + 1;
        const aiScore = Math.max(0.1, 1.0 - (rank - 1) * 0.15);
        rankedResults.push({
          ...candidate,
          combinedScore: aiScore,
          semanticScore: aiScore,
          explanation: explanation.trim(),
        });
      }
    }
  }
  if (rankedResults.length === 0) {
    return candidates.map((post, index) => ({
      ...post,
      combinedScore: Math.max(0.1, 1.0 - index * 0.1),
      semanticScore: Math.max(0.1, 1.0 - index * 0.1),
      explanation: `AI ranking unavailable. Ranked by filter score.`,
    }));
  }
  return rankedResults;
}

// Enhanced matching with better explanations and semantic-first approach
export async function fetchEnhancedMatchesV2(
  userDescription: string,
  userKeywords: string[],
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  console.log("🔍 === ENHANCED MATCHING DEBUG INFO ===");
  console.log(`🎯 Search Type: ${filterType}`);
  console.log(`📝 User Description: "${userDescription}"`);
  console.log(`🔑 User Keywords: [${userKeywords.join(", ")}]`);

  const explicitFilters = filters._explicitFilters || {};
  const activeFilters = Object.entries(explicitFilters).filter(
    ([, isSet]) => isSet
  );
  console.log(
    `⚙️  Explicit Filters: ${
      activeFilters.length
        ? activeFilters.map(([k]) => k).join(", ")
        : "NONE"
    }`
  );

  try {
    const snap = await db.collection("posts").get();
    console.log(`📋 Found ${snap.docs.length} posts`);
    const scored: EnhancedMatch[] = [];
    let processedCount = 0,
      skippedCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (
        data.userId === excludeUserId ||
        data.type !== filterType ||
        data.closed === true
      ) {
        skippedCount++;
        continue;
      }
      processedCount++;
      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || "",
        description: data.description || "",
        address: data.address || "",
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured:
          data.structured || {
            budgetMin: 0,
            budgetMax: 5000,
            location: { lat: 0, lng: 0 },
            locationRadiusKm: 10,
            bedrooms: 1,
            bathrooms: 1,
            furnished: false,
          },
        embedding: Array.isArray(data.embedding) ? data.embedding : [],
      };

      console.log(`\n📝 [${processedCount}] Post ${post.id}`);
      const postKeywords = data.keywords || [];
      console.log(`Keywords: [${postKeywords.join(", ")}]`);

      const structuredResult = calculateStructuredScore(
        post,
        filters,
        filterType
      );
      console.log(
        `Structured Score: ${(structuredResult.score * 100).toFixed(1)}%`
      );

      if (structuredResult.score >= 0.1) {
        scored.push({
          ...post,
          structuredScore: +structuredResult.score.toFixed(3),
          semanticScore: 0,
          combinedScore: 0,
          explanation: structuredResult.explanation.join(". "),
        });
      }
    }

    console.log(
      `\nProcessed: ${processedCount}, Skipped: ${skippedCount}, Candidates: ${scored.length}`
    );
    if (scored.length === 0) {
      console.log("❌ No candidates found. Returning empty.");
      return [];
    }

    console.log("\n🤖 === AI RANKING PHASE ===");
    const aiRankedResults = await rankPostsWithOpenAI(
      userDescription,
      scored,
      filterType,
      topN
    );

    console.log("\n🏆 FINAL AI RANKING:");
    aiRankedResults.forEach((m, i) =>
      console.log(
        `${i + 1}. ${m.id} - Score: ${(m.combinedScore * 100).toFixed(1)}%`
      )
    );
    return aiRankedResults;
  } catch (error) {
    console.error("Enhanced matching failed:", error);
    throw error;
  }
}

// Fallback matching when enhanced matching fails
export async function fetchMatchesWithFallback(
  userDescription: string,
  userKeywords: string[],
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  console.log("Using fallback matching strategy");
  try {
    console.log("Generating user embedding...");
    const userEmbedding = await getOpenAIEmbedding(userDescription);

    console.log("Fetching posts...");
    const snap = await db.collection("posts").get();
    console.log(`Found ${snap.docs.length} posts`);

    const scored: EnhancedMatch[] = [];
    let processedCount = 0,
      skippedCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (
        data.userId === excludeUserId ||
        data.type !== filterType ||
        data.closed === true
      ) {
        skippedCount++;
        continue;
      }
      processedCount++;
      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || "",
        description: data.description || "",
        address: data.address || "",
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured:
          data.structured || {
            budgetMin: 0,
            budgetMax: 5000,
            location: { lat: 0, lng: 0 },
            locationRadiusKm: 10,
            bedrooms: 1,
            bathrooms: 1,
            furnished: false,
          },
        embedding: Array.isArray(data.embedding) ? data.embedding : [],
      };

      const structuredResult = calculateBasicStructuredScore(
        post,
        filters,
        filterType
      );

      let semanticScore = 0;
      if (post.embedding.length > 0) {
        semanticScore = cosineSimilarity(
          userEmbedding,
          post.embedding
        );
      } else {
        try {
          const postText = `${post.title} ${post.description}`;
          const postEmbedding = await getOpenAIEmbedding(postText);
          semanticScore = cosineSimilarity(
            userEmbedding,
            postEmbedding
          );
        } catch {
          console.warn(
            `Failed to embed post ${post.id}, falling back to keywords`
          );
          semanticScore = calculateKeywordSimilarity(
            userKeywords,
            data.keywords || []
          );
        }
      }

      const keywordScore = calculateKeywordSimilarity(
        userKeywords,
        data.keywords || []
      );

      const combinedSemantic = semanticScore * 0.8 + keywordScore * 0.2;
      const hasExp =
        filters._explicitFilters &&
        Object.values(filters._explicitFilters).some(Boolean);

      const combinedScore = hasExp
        ? combinedSemantic * 0.9 + structuredResult.score * 0.1
        : combinedSemantic;

      scored.push({
        ...post,
        structuredScore: +structuredResult.score.toFixed(3),
        semanticScore: +combinedSemantic.toFixed(3),
        combinedScore: +combinedScore.toFixed(3),
        explanation: `${structuredResult.explanation.join(
          ". "
        )}. Semantic: ${Math.round(semanticScore * 100)}%. Keywords: ${Math.round(
          keywordScore * 100
        )}%`,
      });
    }

    console.log(
      `Processed ${processedCount}, Skipped ${skippedCount}, Matches ${scored.length}`
    );
    return scored
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topN);
  } catch (error) {
    console.error("Fallback failed:", error);
    return [];
  }
}

// Simple keyword similarity calculation
function calculateKeywordSimilarity(
  userKeywords: string[],
  postKeywords: string[]
): number {
  const u = new Set(userKeywords.map(k => k.toLowerCase()));
  const p = new Set(postKeywords.map(k => k.toLowerCase()));
  const inter = new Set([...u].filter(x => p.has(x)));
  const uni = new Set([...u, ...p]);
  return uni.size > 0 ? inter.size / uni.size : 0;
}

// Last resort: basic keyword matching
async function fetchBasicKeywordMatches(
  userDescription: string,
  userKeywords: string[],
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  console.log("Basic keyword matching fallback");
  try {
    const snap = await db.collection("posts").get();
    const scored: EnhancedMatch[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (
        data.userId === excludeUserId ||
        data.type !== filterType ||
        data.closed === true
      ) continue;

      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || "",
        description: data.description || "",
        address: data.address || "",
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured:
          data.structured || {
            budgetMin: 0,
            budgetMax: 5000,
            location: { lat: 0, lng: 0 },
            locationRadiusKm: 10,
            bedrooms: 1,
            bathrooms: 1,
            furnished: false,
          },
        embedding: [],
      };

      const basicStructured = calculateBasicStructuredScore(
        post,
        filters,
        filterType
      );
      const ks = calculateKeywordSimilarity(
        userKeywords,
        data.keywords || []
      );
      const hasExp =
        filters._explicitFilters &&
        Object.values(filters._explicitFilters).some(Boolean);

      const combined = hasExp ? ks * 0.9 + basicStructured.score * 0.1 : ks;
      if (combined > 0) {
        scored.push({
          ...post,
          structuredScore: +basicStructured.score.toFixed(3),
          semanticScore: +ks.toFixed(3),
          combinedScore: +combined.toFixed(3),
          explanation: `${basicStructured.explanation.join(
            ". "
          )}. Keywords: ${Math.round(ks * 100)}%`,
        });
      }
    }
    return scored
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topN);
  } catch (error) {
    console.error("Basic keyword matching failed:", error);
    return [];
  }
}

// Basic structured scoring without complex location calculations
function calculateBasicStructuredScore(
  post: PostWithMeta,
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate"
): { score: number; explanation: string[] } {
  const explanations: string[] = [];
  const scores: number[] = [];
  const explicitFilters = filters._explicitFilters || {};

  if (
    post.price != null &&
    (explicitFilters.budgetMin || explicitFilters.budgetMax)
  ) {
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      scores.push(0.3);
      explanations.push(
        `Price $${post.price} is outside your specified budget`
      );
    } else {
      scores.push(1.0);
      explanations.push(`Price $${post.price} fits your budget`);
    }
  }

  if (filterType === "room" && explicitFilters.bedrooms) {
    if (post.structured.bedrooms === filters.bedrooms) {
      scores.push(1.0);
      explanations.push(`Perfect bedrooms (${filters.bedrooms})`);
    } else if (
      Math.abs(post.structured.bedrooms - filters.bedrooms) === 1
    ) {
      scores.push(0.8);
      explanations.push(`Close bedrooms count`);
    } else {
      scores.push(0.5);
      explanations.push(`Different bedrooms count`);
    }
  }

  const finalScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 1.0;
  if (scores.length === 0)
    explanations.push("No specific filters applied - ranked by text");

  return { score: finalScore, explanation: explanations };
}

// Enhanced text-based similarity with better semantic understanding
function calculateTextSimilarity(
  userDescription: string,
  userKeywords: string[],
  postText: string,
  postKeywords: string[]
): number {
  const uSet = extractMeaningfulWords(userDescription);
  const pSet = extractMeaningfulWords(postText);
  const kScore = calculateKeywordSimilarity(userKeywords, postKeywords);

  const directMatches = new Set([...uSet].filter(w => pSet.has(w)));
  const directScore = uSet.size
    ? directMatches.size / uSet.size
    : 0;

  const semanticScore = calculateSemanticWordSimilarity(uSet, pSet);

  return kScore * 0.5 + directScore * 0.3 + semanticScore * 0.2;
}

function extractMeaningfulWords(text: string): Set<string> {
  const common = new Set([
    "the","and","for","with","you","your","this","that","are","was","have",
    "but","not","from","all","will","just","get","like","very","really"
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !common.has(w))
  );
}

function calculateSemanticWordSimilarity(
  userWords: Set<string>,
  postWords: Set<string>
): number {
  const groups = [
    ["quiet","peaceful","calm"],
    ["clean","tidy","organized"],
    ["friendly","social","outgoing"],
    ["student","college","university"],
    ["professional","career","working"],
    ["furnished","equipped","provided"],
    ["modern","new","contemporary"],
    ["spacious","large","roomy"],
    ["cozy","comfortable","warm"],
    ["downtown","central","urban"],
    ["suburban","residential","neighborhood"],
    ["pet-friendly","pets","animals"],
    ["parking","garage","spot"],
    ["gym","fitness","workout"],
    ["kitchen","cooking","meals"],
    ["private","own","personal"],
    ["shared","common","communal"]
  ];
  let matches = 0, total = 0;
  for (const w of userWords) {
    total++;
    const grp = groups.find(g => g.includes(w));
    if (grp && grp.some(x => postWords.has(x))) matches++;
  }
  return total ? matches / total : 0;
}

// Utility for extracting keywords from natural language
export async function extractKeywordsFromDescription(
  description: string
): Promise<string[]> {
  const common = new Set([
    "the","and","for","with","you","your","this","that","are","was","have",
    "but","not","from","all","will","just","get","like","very"
  ]);
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !common.has(w))
    .slice(0, 10);
}
