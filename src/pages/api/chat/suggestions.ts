// File: src/pages/api/chat/suggestions.ts

import type { NextApiRequest, NextApiResponse } from 'next'

// Ensure your .env.local contains:
//   DEEPSEEK_API_KEY=sk-<your-real-key>
// and that you restarted Next.js after adding it.

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

type SuggestionRequest = {
  recentMessage: string
}

type SuggestionResponse = {
  suggestions: string[]
}

type ErrorResponse = {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuggestionResponse | ErrorResponse>
) {
  console.log('→ [suggestions handler] incoming request method:', req.method)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  if (!DEEPSEEK_API_KEY) {
    console.error('⚠️ DEEPSEEK_API_KEY is missing from environment')
    return res
      .status(500)
      .json({ error: 'DeepSeek API key not set in environment.' })
  }

  const { recentMessage } = req.body as SuggestionRequest
  console.log('→ [suggestions handler] recentMessage:', recentMessage)

  if (!recentMessage || recentMessage.trim() === '') {
    console.warn('⚠️ [suggestions handler] missing recentMessage in request body')
    return res
      .status(400)
      .json({ error: 'Missing recentMessage in request body.' })
  }

  // Build the “messages” array for DeepSeek
  const messagesPayload = [
    {
      role: 'system',
      content:
        'You are an AI assistant that suggests short, polite reply messages. Return 3 one-line replies separated by newlines.',
    },
    { role: 'user', content: recentMessage },
  ]

  try {
    console.log('→ [suggestions handler] calling DeepSeek API...')
    const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messagesPayload,
        max_tokens: 50,
        temperature: 0.7,
        n: 1,
      }),
    })

    if (!dsRes.ok) {
      const errorText = await dsRes.text()
      console.error('⚠️ [DeepSeek API] returned non-OK status:', dsRes.status, errorText)
      return res.status(500).json({ error: 'DeepSeek API call failed.' })
    }

    const data = await dsRes.json()
    console.log(
      '→ [DeepSeek API] raw response:\n',
      JSON.stringify(data, null, 2)
    )

    // Pull out the assistant’s content:
    //   data.choices[0].message.content
    const rawText: string = data.choices?.[0]?.message?.content || ''
    console.log('→ [DeepSeek API] extracted rawText:', rawText)

    // Split on newline and trim
    const suggestions = rawText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    console.log('→ [suggestions handler] final suggestions array:', suggestions)
    return res.status(200).json({ suggestions })
  } catch (err) {
    console.error('⚠️ Server error in /api/chat/suggestions:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
