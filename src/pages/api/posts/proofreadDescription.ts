// File: src/pages/api/posts/proofreadDescription.ts

import type { NextApiRequest, NextApiResponse } from 'next'

// Ensure DEEPSEEK_API_KEY or OPENAI_API_KEY is set in .env.local if using DeepSeek or another model
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

interface RequestBody {
  draft: string
}

interface SuccessResponse {
  polished: string
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
    console.error('[proofread] Missing DEEPSEEK_API_KEY')
    return res.status(500).json({ error: 'DeepSeek API key not set' })
  }

  const { draft } = req.body as RequestBody
  if (!draft || draft.trim().length === 0) {
    return res.status(400).json({ error: 'Draft description is required.' })
  }

  // Build prompt for DeepSeek to correct grammar & improve copy
  const userPrompt = `
Please correct the grammar and make this description more appealing for a roommate/room listing.
Return only the rewritten description without additional commentary.

Draft:
"${draft.trim()}"
  `.trim()

  const messages = [
    {
      role: 'system',
      content:
        'You are an AI assistant that proofreads and improves listing descriptions for roommate/room ads.',
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
        max_tokens: 250, // adjust as needed for longer descriptions
        temperature: 0.7,
        n: 1,
      }),
    })

    if (!dsRes.ok) {
      const errorText = await dsRes.text()
      console.error('[proofread] DeepSeek returned non-OK:', dsRes.status, errorText)
      return res.status(500).json({ error: 'DeepSeek API call failed.' })
    }

    const data = await dsRes.json()
    const rawPolished = data.choices?.[0]?.message?.content || ''
    const polished = rawPolished.trim()

    return res.status(200).json({ polished })
  } catch (err) {
    console.error('[proofread] error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
