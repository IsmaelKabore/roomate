import admin from "firebase-admin";
import { StructuredFilters, EnhancedMatch, PostWithMeta, EnhancedStructuredFilters } from "./types";
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
  
  console.log(`         🔍 Filter Analysis for Post ${post.id}:`);

  // 1. Budget scoring - only if budget is explicitly set
  if (post.price != null && (explicitFilters.budgetMin || explicitFilters.budgetMax)) {
    console.log(`           💰 Budget Check: Post=$${post.price}, Range=$${filters.budgetMin}-$${filters.budgetMax}`);
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      // Soft penalty for budget mismatches (don't eliminate completely)
      factors.budget = 0.3;
      explanations.push(`Price $${post.price} is outside your specified budget range`);
      console.log(`             ❌ Outside budget range - Score: 30%`);
    } else {
      // Score based on how close to ideal budget (middle of range)
      const idealPrice = (filters.budgetMin + filters.budgetMax) / 2;
      const priceRange = filters.budgetMax - filters.budgetMin;
      const deviation = Math.abs(post.price - idealPrice) / priceRange;
      factors.budget = Math.max(0.7, 1 - deviation); // Higher minimum for good matches
      explanations.push(`Price $${post.price} fits your budget well`);
      console.log(`             ✅ Within budget - Ideal: $${idealPrice}, Deviation: ${(deviation * 100).toFixed(1)}%, Score: ${(factors.budget * 100).toFixed(1)}%`);
    }
  } else if (post.price != null) {
    console.log(`           💰 Budget: Post=$${post.price} (Budget filter not explicitly set - ignored)`);
  } else {
    console.log(`           💰 Budget: Post price not specified`);
  }

  // 2. Location scoring - only if location preferences are explicitly set
  if (explicitFilters.location || explicitFilters.locationRadiusKm) {
    const distance = geoDistanceKm(post.structured.location, filters.location);
    console.log(`           📍 Location Check: Distance=${distance.toFixed(1)}km, Max=${filters.locationRadiusKm}km`);
    if (distance > filters.locationRadiusKm) {
      // Soft penalty for distance mismatches
      factors.location = 0.2;
      explanations.push(`Location is ${distance.toFixed(1)}km away (outside your preferred area)`);
      console.log(`             ❌ Outside preferred radius - Score: 20%`);
    } else {
      // Tiered scoring based on distance
      if (distance < 2) {
        factors.location = 1.0;
        explanations.push(`Excellent location (${distance.toFixed(1)}km away)`);
        console.log(`             ✅ Excellent proximity - Score: 100%`);
      } else if (distance < 5) {
        factors.location = 0.9;
        explanations.push(`Great location (${distance.toFixed(1)}km away)`);
        console.log(`             ✅ Great proximity - Score: 90%`);
      } else {
        factors.location = 0.8;
        explanations.push(`Good location (${distance.toFixed(1)}km away)`);
        console.log(`             ✅ Good proximity - Score: 80%`);
      }
    }
  } else {
    console.log(`           📍 Location: Distance not evaluated (Location filter not explicitly set)`);
  }

  // 3. Room-specific scoring (only for room searches and only if explicitly set)
  if (filterType === "room") {
    console.log(`           🏠 Room-specific filters (for ${filterType} search):`);
    
    // Bedrooms - only if explicitly specified
    if (explicitFilters.bedrooms) {
      console.log(`           🛏️  Bedrooms: Post=${post.structured.bedrooms}, Desired=${filters.bedrooms}`);
      if (post.structured.bedrooms === filters.bedrooms) {
        factors.bedrooms = 1.0;
        explanations.push(`Perfect bedroom count (${filters.bedrooms})`);
        console.log(`             ✅ Perfect match - Score: 100%`);
      } else if (Math.abs(post.structured.bedrooms - filters.bedrooms) === 1) {
        factors.bedrooms = 0.8;
        explanations.push(`Close bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
        console.log(`             ⚠️  Close match (±1) - Score: 80%`);
      } else {
        factors.bedrooms = 0.5;
        explanations.push(`Different bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
        console.log(`             ❌ Different count - Score: 50%`);
      }
    } else {
      console.log(`           🛏️  Bedrooms: Post=${post.structured.bedrooms} (Filter not set - ignored)`);
    }

    // Bathrooms - only if explicitly specified
    if (explicitFilters.bathrooms) {
      console.log(`           🚿 Bathrooms: Post=${post.structured.bathrooms}, Desired=${filters.bathrooms}`);
      if (post.structured.bathrooms === filters.bathrooms) {
        factors.bathrooms = 1.0;
        explanations.push(`Perfect bathroom count (${filters.bathrooms})`);
        console.log(`             ✅ Perfect match - Score: 100%`);
      } else if (Math.abs(post.structured.bathrooms - filters.bathrooms) <= 0.5) {
        factors.bathrooms = 0.8;
        explanations.push(`Close bathroom count`);
        console.log(`             ⚠️  Close match (±0.5) - Score: 80%`);
      } else {
        factors.bathrooms = 0.6;
        explanations.push(`Different bathroom count`);
        console.log(`             ❌ Different count - Score: 60%`);
      }
    } else {
      console.log(`           🚿 Bathrooms: Post=${post.structured.bathrooms} (Filter not set - ignored)`);
    }

    // Furnished preference - only if explicitly specified
    if (explicitFilters.furnished) {
      console.log(`           🪑 Furnished: Post=${post.structured.furnished ? 'Yes' : 'No'}, Desired=${filters.furnished ? 'Yes' : 'No'}`);
      if (post.structured.furnished === filters.furnished) {
        factors.furnished = 1.0;
        explanations.push(`Furnished preference matches perfectly`);
        console.log(`             ✅ Perfect match - Score: 100%`);
      } else {
        factors.furnished = 0.7;
        explanations.push(`Furnished preference differs from your preference`);
        console.log(`             ❌ Preference mismatch - Score: 70%`);
      }
    } else {
      console.log(`           🪑 Furnished: Post=${post.structured.furnished ? 'Yes' : 'No'} (Filter not set - ignored)`);
    }
  } else {
    console.log(`           🏠 Room-specific filters: Skipped (searching for ${filterType})`);
  }

  // Calculate final structured score using geometric mean for better balance
  const factorValues = Object.values(factors);
  console.log(`           📊 Structured Score Calculation:`);
  
  if (factorValues.length > 0) {
    // Use average of factors instead of multiplication to prevent extreme penalties
    score = factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;
    console.log(`             Applied Factors: [${Object.keys(factors).join(', ')}]`);
    console.log(`             Individual Scores: [${factorValues.map(v => (v * 100).toFixed(1) + '%').join(', ')}]`);
    console.log(`             Average Score: ${(score * 100).toFixed(1)}%`);
  } else {
    console.log(`             No explicit filters applied - using neutral score`);
  }

  // If no explicit filters were set, return neutral score
  if (factorValues.length === 0) {
    explanations.push('No specific filters applied - ranked by semantic similarity');
  }
  
  console.log(`           ✅ Final Structured Score: ${(score * 100).toFixed(1)}%`);

  return { score, factors, explanation: explanations };
}

/**
 * Use OpenAI to intelligently rank filtered posts based on user description
 */
async function rankPostsWithOpenAI(
  userDescription: string,
  candidates: EnhancedMatch[],
  filterType: "room" | "roommate",
  topN: number
): Promise<EnhancedMatch[]> {
  try {
    console.log('🤖 Preparing AI ranking prompt...');
    
    // Create detailed post descriptions for OpenAI
    const postDescriptions = candidates.map((post, index) => {
      const details: string[] = [];
      details.push(`ID: ${post.id}`);
      details.push(`Title: ${post.title}`);
      details.push(`Description: ${post.description}`);
      
      if (filterType === 'room') {
        if (post.price) details.push(`Price: $${post.price}/month`);
        if (post.address) details.push(`Address: ${post.address}`);
        if (post.structured.bedrooms) details.push(`Bedrooms: ${post.structured.bedrooms}`);
        if (post.structured.bathrooms) details.push(`Bathrooms: ${post.structured.bathrooms}`);
        details.push(`Furnished: ${post.structured.furnished ? 'Yes' : 'No'}`);
      }
      
      return `${index + 1}. ${details.join(' | ')}`;
    }).join('\n\n');

    const prompt = `You are an intelligent matching system for ${filterType === 'room' ? 'room rentals' : 'roommate matching'}. 

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
1. ID: [POST_ID] - [Brief explanation of why this is the best match]
2. ID: [POST_ID] - [Brief explanation of why this is the second best match]
3. ID: [POST_ID] - [Brief explanation of why this is the third best match]
[Continue for top ${Math.min(topN, candidates.length)} only]

Be concise but specific about what makes each match suitable for the user's request.`;

    console.log('🤖 Sending ranking request to OpenAI...');
    console.log(`   Prompt length: ${prompt.length} characters`);
    console.log(`   Candidates to rank: ${candidates.length}`);
    console.log(`   Requesting top: ${Math.min(topN, candidates.length)}`);

    const response = await getOpenAICompletion(prompt);
    console.log('🤖 Received response from OpenAI');
    console.log(`   Response: ${response.substring(0, 200)}...`);

    // Parse OpenAI response
    const rankedPosts = parseOpenAIRanking(response, candidates);
    
    console.log(`🤖 Parsed ${rankedPosts.length} ranked results from AI response`);
    
    return rankedPosts.slice(0, topN);
    
  } catch (error) {
    console.error('🤖 AI ranking failed:', error);
    console.log('🤖 Falling back to filter-based ranking...');
    
    // Fallback to simple filter-based ranking
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

/**
 * Get completion from OpenAI using the chat API
 */
async function getOpenAICompletion(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at matching people with rooms and roommates. You understand what makes good matches and can explain your reasoning clearly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse OpenAI ranking response and match with original posts
 */
function parseOpenAIRanking(response: string, candidates: EnhancedMatch[]): EnhancedMatch[] {
  const rankedResults: EnhancedMatch[] = [];
  const candidateMap = new Map(candidates.map(c => [c.id, c]));
  
  // Extract rankings from response
  const lines = response.split('\n');
  let rankingStarted = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('RANKING:')) {
      rankingStarted = true;
      continue;
    }
    
    if (!rankingStarted || !trimmedLine) continue;
    
    // Look for pattern: "1. ID: POST_ID - explanation"
    const match = trimmedLine.match(/^\d+\.\s*ID:\s*([^\s-]+)\s*-\s*(.+)$/);
    if (match) {
      const [, postId, explanation] = match;
      const candidate = candidateMap.get(postId);
      
      if (candidate) {
        const rank = rankedResults.length + 1;
        const aiScore = Math.max(0.1, 1.0 - (rank - 1) * 0.15); // Descending scores: 1.0, 0.85, 0.7, etc.
        
        rankedResults.push({
          ...candidate,
          combinedScore: aiScore,
          semanticScore: aiScore, // AI score represents semantic understanding
          explanation: explanation.trim(),
        });
        
        console.log(`🤖 Ranked #${rank}: ${postId} - Score: ${(aiScore * 100).toFixed(1)}%`);
      } else {
        console.warn(`🤖 Warning: AI ranked unknown post ID: ${postId}`);
      }
    }
  }
  
  // If parsing failed, fall back to original order
  if (rankedResults.length === 0) {
    console.warn('🤖 Failed to parse AI ranking response, using original order');
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
  console.log('\n🔍 === ENHANCED MATCHING DEBUG INFO ===');
  console.log(`🎯 Search Type: ${filterType}`);
  console.log(`📝 User Description: "${userDescription}"`);
  console.log(`🔑 User Keywords: [${userKeywords.join(', ')}]`);
  
  // Log explicit filters
  const explicitFilters = filters._explicitFilters || {};
  const activeFilters = Object.entries(explicitFilters).filter(([_, isSet]) => isSet);
  console.log(`⚙️  Explicit Filters Applied: ${activeFilters.length > 0 ? activeFilters.map(([key]) => key).join(', ') : 'NONE (Pure semantic search)'}`);
  
  if (activeFilters.length > 0) {
    console.log('📊 Filter Details:');
    if (explicitFilters.budgetMin || explicitFilters.budgetMax) {
      console.log(`  💰 Budget: $${filters.budgetMin} - $${filters.budgetMax}`);
    }
    if (explicitFilters.location) {
      console.log(`  📍 Location: (${filters.location.lat}, ${filters.location.lng}) within ${filters.locationRadiusKm}km`);
    }
    if (explicitFilters.bedrooms) {
      console.log(`  🛏️  Bedrooms: ${filters.bedrooms}`);
    }
    if (explicitFilters.bathrooms) {
      console.log(`  🚿 Bathrooms: ${filters.bathrooms}`);
    }
    if (explicitFilters.furnished) {
      console.log(`  🪑 Furnished: ${filters.furnished ? 'Yes' : 'No'}`);
    }
  }
  
  try {
    const snap = await db.collection("posts").get();
    console.log(`📋 Found ${snap.docs.length} total posts in database`);
    const scored: EnhancedMatch[] = [];

    let processedCount = 0;
    let skippedCount = 0;
    
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      
      // Skip filtering
      if (data.userId === excludeUserId || data.type !== filterType) {
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

      console.log(`\n📝 [${processedCount}] Processing Post: ${post.id}`);
      console.log(`   Title: "${post.title}"`);
      console.log(`   Description: "${post.description.substring(0, 100)}${post.description.length > 100 ? '...' : ''}"`);
      console.log(`   Price: ${post.price ? `$${post.price}` : 'Not specified'}`);
      console.log(`   Has Embedding: ${post.embedding.length > 0 ? 'Yes' : 'No'} (${post.embedding.length} dimensions)`);

      // Apply filter scoring to determine if post should be included
      const postKeywords = data.keywords || [];
      console.log(`   Post Keywords: [${postKeywords.join(', ')}]`);

      // Enhanced structured scoring (filtering logic)
      const structuredResult = calculateStructuredScore(post, filters, filterType);
      
      console.log('   ⚙️  FILTER ANALYSIS:');
      console.log(`      Structured Score: ${(structuredResult.score * 100).toFixed(1)}%`);
      console.log(`      Applied Factors: ${Object.keys(structuredResult.factors).length > 0 ? Object.keys(structuredResult.factors).join(', ') : 'None'}`);
      if (Object.keys(structuredResult.factors).length > 0) {
        Object.entries(structuredResult.factors).forEach(([factor, score]) => {
          console.log(`        ${factor}: ${(score * 100).toFixed(1)}%`);
        });
      }

      // Filter threshold - only include posts that meet minimum criteria
      const filterThreshold = 0.1; // Very lenient threshold to keep most posts for AI ranking
      
      if (structuredResult.score >= filterThreshold) {
        console.log('   ✅ PASSED FILTERS - Adding to AI ranking candidates');
        
        // Store post for AI ranking (no semantic scoring yet)
        scored.push({
          ...post,
          structuredScore: +structuredResult.score.toFixed(3),
          semanticScore: 0, // Will be set by AI ranking
          combinedScore: 0, // Will be set by AI ranking
          explanation: structuredResult.explanation.join('. '),
        });
      } else {
        console.log('   ❌ FAILED FILTERS - Excluding from results');
      }
    }
    
    console.log(`\n📊 PROCESSING SUMMARY:`);
    console.log(`   Total posts in DB: ${snap.docs.length}`);
    console.log(`   Skipped (wrong type/user/closed): ${skippedCount}`);
    console.log(`   Processed for matching: ${processedCount}`);
    console.log(`   Candidates found: ${scored.length}`);

    if (scored.length === 0) {
      console.log('\n❌ No candidates found after filtering. Returning empty results.');
      console.log('\n✅ === ENHANCED MATCHING COMPLETE ===\n');
      return [];
    }

    // Use OpenAI for intelligent ranking instead of semantic similarity
    console.log(`\n🤖 === AI RANKING PHASE ===`);
    console.log(`Sending ${scored.length} candidates to OpenAI for intelligent ranking...`);
    
    const aiRankedResults = await rankPostsWithOpenAI(userDescription, scored, filterType, topN);
    
    console.log(`\n🏆 FINAL AI RANKING (Top ${aiRankedResults.length}):`);
    aiRankedResults.forEach((match, index) => {
      console.log(`   ${index + 1}. Post ${match.id} - AI Score: ${(match.combinedScore * 100).toFixed(1)}%`);
      console.log(`      Title: "${match.title}"`);
      console.log(`      Filter Score: ${(match.structuredScore * 100).toFixed(1)}%`);
      console.log(`      AI Reasoning: ${match.explanation}`);
    });
    
    console.log('\n✅ === ENHANCED MATCHING COMPLETE ===\n');
    
    return aiRankedResults;
  } catch (error) {
    console.error('Enhanced matching failed:', error);
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

      // Semantic-first combined score - prioritize text matching
      const hasExplicitFilters = filters._explicitFilters && 
        Object.values(filters._explicitFilters).some(Boolean);

      let combinedScore: number;
      if (!hasExplicitFilters) {
        // Pure semantic matching when no explicit filters
        combinedScore = combinedSemanticScore;
      } else {
        // Heavily favor semantic similarity over structured filters
        combinedScore = combinedSemanticScore * 0.9 + structuredResult.score * 0.1;
      }

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
  filters: EnhancedStructuredFilters,
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
      
      // Prioritize keyword matching over filters
      const hasExplicitFilters = filters._explicitFilters && 
        Object.values(filters._explicitFilters).some(Boolean);

      const combinedScore = hasExplicitFilters 
        ? keywordScore * 0.9 + structuredResult.score * 0.1
        : keywordScore;

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

// Basic structured scoring without complex location calculations - only applies explicit filters
function calculateBasicStructuredScore(
  post: PostWithMeta,
  filters: EnhancedStructuredFilters,
  filterType: "room" | "roommate"
): { score: number; explanation: string[] } {
  const explanations: string[] = [];
  let scores: number[] = [];
  const explicitFilters = filters._explicitFilters || {};

  // Budget scoring - only if explicitly set
  if (post.price != null && (explicitFilters.budgetMin || explicitFilters.budgetMax)) {
    if (post.price < filters.budgetMin || post.price > filters.budgetMax) {
      scores.push(0.3);
      explanations.push(`Price $${post.price} is outside your specified budget range`);
    } else {
      scores.push(1.0);
      explanations.push(`Price $${post.price} fits your budget perfectly`);
    }
  }

  // Room-specific scoring (simplified) - only if explicitly set
  if (filterType === "room" && explicitFilters.bedrooms) {
    if (post.structured.bedrooms === filters.bedrooms) {
      scores.push(1.0);
      explanations.push(`Perfect bedroom count (${filters.bedrooms})`);
    } else if (Math.abs(post.structured.bedrooms - filters.bedrooms) === 1) {
      scores.push(0.8);
      explanations.push(`Close bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
    } else {
      scores.push(0.5);
      explanations.push(`Different bedroom count (${post.structured.bedrooms} vs ${filters.bedrooms} desired)`);
    }
  }

  // Return average score if any explicit filters were applied, otherwise neutral
  const finalScore = scores.length > 0 
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
    : 1.0;

  if (scores.length === 0) {
    explanations.push('No specific filters applied - ranked by text similarity');
  }

  return { score: finalScore, explanation: explanations };
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