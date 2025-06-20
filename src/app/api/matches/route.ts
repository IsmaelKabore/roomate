// File: src/app/api/matches/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOpenAIEmbedding } from "@/lib/openai-embed";
import { fetchEnhancedMatches } from "@/lib/matching";
import type { StructuredFilters } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    userId?: string;
    searchType?: "room" | "roommate";
    description?: string;
    structuredFilters?: StructuredFilters;
  };
  const { userId, searchType, description, structuredFilters } = body;

  if (!userId || !searchType || !description || !structuredFilters) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const userEmbedding = await getOpenAIEmbedding(description.trim());
    const matches = await fetchEnhancedMatches(
      userEmbedding,
      structuredFilters,
      searchType,
      userId,
      5
    );
    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error("[/api/matches] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
