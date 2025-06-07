// File: src/lib/openai-embed.ts

import OpenAI from "openai"

// Ensure the API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment")
}

// Instantiate OpenAI client for server‐side usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Returns a 1536-dimensional embedding for the given text.
 */
export async function getOpenAIEmbedding(inputText: string): Promise<number[]> {
  const trimmed = inputText.trim()
  if (trimmed.length === 0) {
    return []
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: trimmed,
  })

  const embedding = response.data?.[0]?.embedding
  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI returned invalid embedding")
  }
  return embedding
}
