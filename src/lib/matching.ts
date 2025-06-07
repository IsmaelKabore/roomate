// File: src/lib/matching.ts

import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebaseConfig"
import { getOpenAIEmbedding } from "./openai-embed"

export interface PostWithMeta {
  id: string
  title: string
  description: string
  address?: string
  price?: number
  images?: string[]
  type: "room" | "roommate"
  userId: string
  createdAt: any
  embedding: number[]
}

/** Compute cosine similarity between two equal‐length vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Fetch top N posts whose embeddings are most similar to
 * the embedding of the provided keyword string.
 *
 * @param keyword – the text the user typed in
 * @param topN – how many results to return (default: 5)
 * @param excludeUserId – optional: skip any post by this user
 */
export async function fetchTopEmbeddingMatchesForKeyword(
  keyword: string,
  topN = 5,
  excludeUserId?: string
): Promise<PostWithMeta[]> {
  // 1) Turn the keyword into an embedding via OpenAI
  let keywordEmbedding: number[]
  try {
    keywordEmbedding = await getOpenAIEmbedding(keyword.trim())
  } catch (err) {
    console.error("[matching] getOpenAIEmbedding failed:", err)
    throw new Error("Failed to generate embedding for keyword")
  }

  // 2) Fetch every post document
  const postsCol = collection(db, "posts")
  const snapshot = await getDocs(postsCol)

  // 3) Compute cosine similarity vs. each post
  const scored: { post: PostWithMeta; score: number }[] = []
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as any
    const postEmbedding = data.embedding
    if (!Array.isArray(postEmbedding)) return
    if (excludeUserId && data.userId === excludeUserId) return

    const candidate: PostWithMeta = {
      id: docSnap.id,
      title: data.title,
      description: data.description,
      address: data.address,
      price: data.price,
      images: data.images,
      type: data.type,
      userId: data.userId,
      createdAt: data.createdAt,
      embedding: data.embedding,
    }

    const sim = cosineSimilarity(keywordEmbedding, postEmbedding)
    scored.push({ post: candidate, score: sim })
  })

  // 4) Sort descending by score and take topN
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topN).map((x) => x.post)
}
