// File: src/app/api/matches/route.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { fetchTopEmbeddingMatchesForKeyword } from "@/lib/matching"

export async function POST(request: NextRequest) {
  try {
    const { keyword, userId } = (await request.json()) as {
      keyword: string
      userId: string
    }

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: 'Missing or invalid "keyword" in request body.' },
        { status: 400 }
      )
    }

    const matches = await fetchTopEmbeddingMatchesForKeyword(keyword, 5, userId)
    return NextResponse.json({ matches })
  } catch (err: any) {
    console.error("[API /api/matches] Error:", err)
    return NextResponse.json(
      { error: "Internal server error fetching matches." },
      { status: 500 }
    )
  }
}
