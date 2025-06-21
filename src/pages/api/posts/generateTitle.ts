import type { NextApiRequest, NextApiResponse } from 'next'

// Ensure DEEPSEEK_API_KEY is set
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

interface RequestBody {
  description: string
  keywords?: string[]
}

interface SuccessResponse {
  title: string
}

interface ErrorResponse {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!DEEPSEEK_API_KEY) {
    console.error('[generateTitle] Missing DEEPSEEK_API_KEY')
    return res.status(500).json({ error: 'DeepSeek API key not set' })
  }

  const { description, keywords } = req.body as RequestBody
  if (!description?.trim()) {
    return res.status(400).json({ error: 'Description is required.' })
  }

  let prompt = `Create a 4–8 word catchy listing title for a roommate/room ad based on this description:\n\n"${description.trim()}"\n`
  if (Array.isArray(keywords) && keywords.length) {
    prompt += `Include these keywords if possible: ${keywords.join(', ')}\n`
  }
  prompt += `\nTitle:`

  try {
    const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You generate short, catchy listing titles.' },
          { role: 'user',   content: prompt },
        ],
        max_tokens: 12,
        temperature: 0.7,
        n: 1,
      }),
    })

    if (!dsRes.ok) {
      const err = await dsRes.text()
      console.error('[generateTitle] DeepSeek failed:', dsRes.status, err)
      return res.status(500).json({ error: 'DeepSeek API call failed.' })
    }

    const data = await dsRes.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const title = raw.trim().replace(/^["']|["']$/g, '')
    return res.status(200).json({ title })
  } catch (err) {
    console.error('[generateTitle] error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
