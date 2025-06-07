// src/lib/deepseek-server.ts
// ——— a server‐only helper (never imported from a client component) ———

export async function getDeepSeekEmbedding(inputText: string): Promise<number[]> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not set')
  }

  const payload = {
    model: 'text-embedding-ada-002',
    input: inputText,
  }

  const res = await fetch('https://api.deepseek.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[getDeepSeekEmbedding] error:', res.status, errorText)
    throw new Error('DeepSeek embedding request failed')
  }

  const data = await res.json()
  const embedding: number[] = data.data?.[0]?.embedding
  if (!Array.isArray(embedding)) {
    throw new Error('Invalid embedding returned from DeepSeek')
  }
  return embedding
}
