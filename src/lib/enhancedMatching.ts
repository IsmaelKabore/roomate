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
      // Don't eliminate completely, just reduce score significantly
      factors.budget = 0.2;
      score *= 0.2;
      explanations.push(`Price $${post.price} is outside your preferred budget range but still shown`);
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
      // Don't eliminate completely, just reduce score significantly
      factors.location = 0.1;
      score *= 0.1;
      explanations.push(`Location is ${distance.toFixed(1)}km away (outside preferred radius but still shown)`);
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
  try {
    // Generate embedding for user description
    const userEmbedding = await getOpenAIEmbedding(userDescription);
    
    const snap = await db.collection("posts").get();
    const scored: EnhancedMatch[] = [];

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (data.userId === excludeUserId || data.type !== filterType) continue;
      
      // Skip closed posts
      if (data.closed === true) continue;

      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || '',
        description: data.description || '',
        address: data.address || '',
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured: data.structured || {
          budgetMin: 0,
          budgetMax: 5000,
          location: { lat: 0, lng: 0 },
          locationRadiusKm: 10,
          bedrooms: 1,
          bathrooms: 1,
          furnished: false
        },
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
  } catch (error) {
    console.error('Enhanced matching failed:', error);
    throw error;
  }
}

// Fallback matching when enhanced matching fails
export async function fetchMatchesWithFallback(
  userDescription: string,
  userKeywords: string[],
  filters: StructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  console.log('Using fallback matching strategy with OpenAI semantic search');
  
  try {
    // Generate embedding for user description using OpenAI
    console.log('Generating user embedding for semantic search...');
    const userEmbedding = await getOpenAIEmbedding(userDescription);
    
    console.log('Fetching posts from database...');
    const snap = await db.collection("posts").get();
    console.log(`Found ${snap.docs.length} total posts in database`);
    
    const scored: EnhancedMatch[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      
      // Skip posts by the current user
      if (data.userId === excludeUserId) {
        skippedCount++;
        continue;
      }
      
      // Skip posts of different type
      if (data.type !== filterType) {
        skippedCount++;
        continue;
      }
      
      // Skip closed posts
      if (data.closed === true) {
        skippedCount++;
        continue;
      }

      processedCount++;

      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || '',
        description: data.description || '',
        address: data.address || '',
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured: data.structured || {
          budgetMin: 0,
          budgetMax: 5000,
          location: { lat: 0, lng: 0 },
          locationRadiusKm: 10,
          bedrooms: 1,
          bathrooms: 1,
          furnished: false
        },
        embedding: Array.isArray(data.embedding) ? data.embedding : [],
      };

      // Basic structured scoring (soft filters)
      const structuredResult = calculateBasicStructuredScore(post, filters, filterType);
      
      // OpenAI semantic similarity
      let semanticScore = 0;
      if (post.embedding.length > 0) {
        // Use existing embedding if available
        semanticScore = cosineSimilarity(userEmbedding, post.embedding);
      } else {
        // Generate embedding for this post if not available
        try {
          const postText = `${post.title} ${post.description}`;
          const postEmbedding = await getOpenAIEmbedding(postText);
          semanticScore = cosineSimilarity(userEmbedding, postEmbedding);
        } catch (embeddingError) {
          console.warn(`Failed to generate embedding for post ${post.id}:`, embeddingError);
          // Fall back to keyword matching only
          const postKeywords = data.keywords || [];
          semanticScore = calculateKeywordSimilarity(userKeywords, postKeywords);
        }
      }

      // Keyword overlap as additional signal
      const postKeywords = data.keywords || [];
      const keywordScore = calculateKeywordSimilarity(userKeywords, postKeywords);

      // Combined semantic score (OpenAI similarity + keyword boost)
      const combinedSemanticScore = semanticScore * 0.8 + keywordScore * 0.2;

      // Final combined score (semantic + structured)
      const combinedScore = combinedSemanticScore * 0.7 + structuredResult.score * 0.3;

      scored.push({
        ...post,
        structuredScore: +structuredResult.score.toFixed(3),
        semanticScore: +combinedSemanticScore.toFixed(3),
        combinedScore: +combinedScore.toFixed(3),
        explanation: `${structuredResult.explanation.join('. ')}. OpenAI semantic similarity: ${Math.round(semanticScore * 100)}%. Keyword match: ${Math.round(keywordScore * 100)}%`,
      });
    }

    console.log(`Processed ${processedCount} posts, skipped ${skippedCount} posts, found ${scored.length} potential matches`);

    const sortedResults = scored
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topN);

    console.log(`Returning top ${sortedResults.length} matches from fallback with OpenAI semantic search`);
    return sortedResults;
    
  } catch (error) {
    console.error('Fallback matching with OpenAI failed:', error);
    // If OpenAI fails completely, fall back to basic keyword matching
    return await fetchBasicKeywordMatches(userDescription, userKeywords, filters, filterType, excludeUserId, topN);
  }
}

// Simple keyword similarity calculation
function calculateKeywordSimilarity(userKeywords: string[], postKeywords: string[]): number {
  const userKeywordSet = new Set(userKeywords.map(k => k.toLowerCase()));
  const postKeywordSet = new Set(postKeywords.map(k => k.toLowerCase()));
  const intersection = new Set([...userKeywordSet].filter(k => postKeywordSet.has(k)));
  const union = new Set([...userKeywordSet, ...postKeywordSet]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Last resort: basic keyword matching without any embeddings
async function fetchBasicKeywordMatches(
  userDescription: string,
  userKeywords: string[],
  filters: StructuredFilters,
  filterType: "room" | "roommate",
  excludeUserId: string,
  topN = 5
): Promise<EnhancedMatch[]> {
  console.log('Using basic keyword matching as last resort');
  
  try {
    const snap = await db.collection("posts").get();
    const scored: EnhancedMatch[] = [];

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      
      if (data.userId === excludeUserId || data.type !== filterType || data.closed === true) {
        continue;
      }

      const post: PostWithMeta = {
        id: doc.id,
        userId: data.userId,
        title: data.title || '',
        description: data.description || '',
        address: data.address || '',
        price: data.price ?? null,
        images: data.images || [],
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        structured: data.structured || {
          budgetMin: 0,
          budgetMax: 5000,
          location: { lat: 0, lng: 0 },
          locationRadiusKm: 10,
          bedrooms: 1,
          bathrooms: 1,
          furnished: false
        },
        embedding: [],
      };

      const structuredResult = calculateBasicStructuredScore(post, filters, filterType);
      const postKeywords = data.keywords || [];
      const keywordScore = calculateKeywordSimilarity(userKeywords, postKeywords);
      
      const combinedScore = keywordScore * 0.6 + structuredResult.score * 0.4;

      if (combinedScore > 0) {
        scored.push({
          ...post,
          structuredScore: +structuredResult.score.toFixed(3),
          semanticScore: +keywordScore.toFixed(3),
          combinedScore: +combinedScore.toFixed(3),
          explanation: `${structuredResult.explanation.join('. ')}. Keyword similarity: ${Math.round(keywordScore * 100)}%`,
        });
      }
    }

    return scored
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topN);
      
  } catch (error) {
    console.error('Basic keyword matching failed:', error);
    return [];
  }
}

// Basic structured scoring without complex location calculations
function calculateBasicStructuredScore(
  post: PostWithMeta,
  filters: StructuredFilters,
  filterType: "room" | "roommate"
): { score: number; explanation: string[] } {
  const explanations: string[] = [];
  let score = 1;

  // Budget scoring - make it softer, not a hard filter
  if (post.price != null) {
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      // Don't eliminate, just reduce score
      score *= 0.3;
      explanations.push(`Price $${post.price} is outside your preferred range but still shown`);
    } else {
      explanations.push(`Price $${post.price} fits your budget`);
    }
  } else {
    explanations.push(`No price listed`);
  }

  // Room-specific scoring (simplified)
  if (filterType === "room") {
    if (post.structured.bedrooms && filters.bedrooms) {
      if (post.structured.bedrooms === filters.bedrooms) {
        explanations.push(`Perfect bedroom count (${filters.bedrooms})`);
      } else if (Math.abs(post.structured.bedrooms - filters.bedrooms) === 1) {
        score *= 0.8;
        explanations.push(`Close bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
      } else {
        score *= 0.6;
        explanations.push(`Different bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
      }
    }
  }

  return { score, explanation: explanations };
}

// Enhanced text-based similarity with better semantic understanding
function calculateTextSimilarity(
  userDescription: string,
  userKeywords: string[],
  postText: string,
  postKeywords: string[]
): number {
  // 1. Keyword overlap score (higher weight)
  const userKeywordSet = new Set(userKeywords.map(k => k.toLowerCase()));
  const postKeywordSet = new Set(postKeywords.map(k => k.toLowerCase()));
  const intersection = new Set([...userKeywordSet].filter(k => postKeywordSet.has(k)));
  const union = new Set([...userKeywordSet, ...postKeywordSet]);
  const keywordScore = union.size > 0 ? intersection.size / union.size : 0;

  // 2. Enhanced text overlap with semantic understanding
  const userWords = extractMeaningfulWords(userDescription);
  const postWords = extractMeaningfulWords(postText);
  
  // Direct word matches
  const directMatches = new Set([...userWords].filter(w => postWords.has(w)));
  const directScore = userWords.size > 0 ? directMatches.size / userWords.size : 0;
  
  // 3. Semantic similarity through word relationships
  const semanticScore = calculateSemanticWordSimilarity(userWords, postWords);
  
  // 4. Combined score with higher weight on keywords and semantic understanding
  return keywordScore * 0.5 + directScore * 0.3 + semanticScore * 0.2;
}

// Extract meaningful words (filter out common words and short words)
function extractMeaningfulWords(text: string): Set<string> {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
    'our', 'their', 'this', 'that', 'these', 'those', 'am', 'very', 'really', 'just', 'so',
    'looking', 'need', 'want', 'seeking', 'find', 'get', 'like', 'good', 'great', 'nice'
  ]);
  
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
  );
}

// Calculate semantic similarity between word sets using domain-specific relationships
function calculateSemanticWordSimilarity(userWords: Set<string>, postWords: Set<string>): number {
  // Define semantic word groups for roommate/room finding
  const semanticGroups = [
    ['quiet', 'peaceful', 'calm', 'serene'],
    ['clean', 'tidy', 'organized', 'neat'],
    ['friendly', 'social', 'outgoing', 'sociable'],
    ['student', 'graduate', 'university', 'college', 'academic'],
    ['professional', 'working', 'career', 'business'],
    ['furnished', 'equipped', 'included', 'provided'],
    ['modern', 'new', 'updated', 'contemporary'],
    ['spacious', 'large', 'big', 'roomy'],
    ['cozy', 'comfortable', 'warm', 'homey'],
    ['downtown', 'central', 'urban', 'city'],
    ['suburban', 'residential', 'neighborhood'],
    ['pet-friendly', 'pets', 'animals', 'dog', 'cat'],
    ['parking', 'garage', 'spot'],
    ['gym', 'fitness', 'exercise', 'workout'],
    ['kitchen', 'cooking', 'chef', 'meals'],
    ['private', 'own', 'personal', 'separate'],
    ['shared', 'common', 'together', 'communal']
  ];

  let semanticMatches = 0;
  let totalUserConcepts = 0;

  for (const userWord of userWords) {
    totalUserConcepts++;
    
    // Find which semantic group this user word belongs to
    const userGroup = semanticGroups.find(group => group.includes(userWord));
    
    if (userGroup) {
      // Check if any post words are in the same semantic group
      const hasSemanticMatch = userGroup.some(semanticWord => postWords.has(semanticWord));
      if (hasSemanticMatch) {
        semanticMatches++;
      }
    }
  }

  return totalUserConcepts > 0 ? semanticMatches / totalUserConcepts : 0;
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