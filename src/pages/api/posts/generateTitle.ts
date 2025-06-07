// File: src/pages/api/posts/generateTitle.ts

import type { NextApiRequest, NextApiResponse } from 'next'

// Ensure DEEPSEEK_API_KEY or OPENAI_API_KEY is set in .env.local if using DeepSeek or an alternative AI model
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
  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: 'Description is required.' })
  }

  // Build a “system + user” chat payload for DeepSeek
  let userPrompt = `Create a 4–8 word catchy listing title for a roommate/room ad based on this description:\n\n"${description.trim()}"\n`
  if (Array.isArray(keywords) && keywords.length > 0) {
    userPrompt += `Include these keywords if possible: ${keywords.join(', ')}\n`
  }
  userPrompt += `\nTitle:`

  const messages = [
    {
      role: 'system',
      content:
        'You are an AI assistant that generates short, catchy listing titles for roommate or room ads.',
    },
    { role: 'user', content: userPrompt },
  ]

  try {
    const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 12, // enough tokens for 4–8 words
        temperature: 0.7,
        n: 1,
      }),
    })

    if (!dsRes.ok) {
      const errorText = await dsRes.text()
      console.error('[generateTitle] DeepSeek returned non-OK:', dsRes.status, errorText)
      return res.status(500).json({ error: 'DeepSeek API call failed.' })
    }

    const data = await dsRes.json()
    // DeepSeek returns: data.choices[0].message.content
    const rawTitle = data.choices?.[0]?.message?.content || ''
    const title = rawTitle.trim().replace(/^["']|["']$/g, '') // strip quotes

    return res.status(200).json({ title })
  } catch (err) {
    console.error('[generateTitle] error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
