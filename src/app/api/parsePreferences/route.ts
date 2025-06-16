// File: src/app/api/parsePreferences/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ParsedPrefs {
  bedrooms: number | null;
  budgetMax: number | null;
  furnished: boolean | null;
}

export async function POST(req: NextRequest) {
  try {
    const { description } = (await req.json()) as { description: string };
    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    // Ask the LLM to extract just these three fields as JSON
    const prompt = `
Extract from the following tenant‐search description exactly three fields as JSON:

1. bedrooms: integer number of bedrooms desired (or null)
2. budgetMax: maximum monthly rent in USD (or null)
3. furnished: true if they want furnished, false if not, or null if unspecified

Only output the JSON object, e.g.:

{"bedrooms":2,"budgetMax":1500,"furnished":true}

Description:
"""${description.trim()}"""
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 200,
    });

    const text = completion.choices[0].message?.content?.trim() ?? "";
    let parsed: ParsedPrefs = { bedrooms: null, budgetMax: null, furnished: null };

    try {
      // Try to parse the JSON directly
      parsed = JSON.parse(text);
    } catch {
      // Fallback: brute-force regex if JSON.parse fails
      const numMatch = text.match(/"bedrooms"\s*:\s*(\d+)/);
      const budgMatch = text.match(/"budgetMax"\s*:\s*(\d+)/);
      const furMatch = text.match(/"furnished"\s*:\s*(true|false)/i);
      parsed.bedrooms  = numMatch ? parseInt(numMatch[1],10) : null;
      parsed.budgetMax = budgMatch ? parseInt(budgMatch[1],10) : null;
      parsed.furnished = furMatch ? furMatch[1].toLowerCase()==="true" : null;
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[parsePreferences]", err);
    return NextResponse.json({ error: "Failed to parse preferences" }, { status: 500 });
  }
}
