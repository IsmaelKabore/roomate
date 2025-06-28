// File: src/app/api/matches/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchEnhancedMatchesV2, extractKeywordsFromDescription, fetchMatchesWithFallback } from "@/lib/enhancedMatching";
import type { StructuredFilters, EnhancedMatch } from "@/lib/types";

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
    console.log(`[/api/matches] Starting search for ${searchType} with user: ${userId}`);
    
    // Extract keywords from the user description
    const userKeywords = await extractKeywordsFromDescription(description.trim());
    console.log(`[/api/matches] Extracted keywords:`, userKeywords);

    let matches: EnhancedMatch[] = [];

    // Try enhanced matching with semantic search first
    try {
      console.log(`[/api/matches] Attempting enhanced matching...`);
      matches = await fetchEnhancedMatchesV2(
        description.trim(),
        userKeywords,
        structuredFilters,
        searchType,
        userId,
        10 // Get more initial results for better filtering
      );
      console.log(`[/api/matches] Enhanced matching returned ${matches.length} results`);
    } catch (enhancedError) {
      console.log(`[/api/matches] Enhanced matching failed:`, enhancedError);
      matches = [];
    }

    // If enhanced matching fails or returns no results, use fallback
    if (!matches || matches.length === 0) {
      console.log(`[/api/matches] Using fallback matching...`);
      try {
        matches = await fetchMatchesWithFallback(
          description.trim(),
          userKeywords,
          structuredFilters,
          searchType,
          userId,
          10
        );
        console.log(`[/api/matches] Fallback matching returned ${matches.length} results`);
      } catch (fallbackError) {
        console.error(`[/api/matches] Fallback matching also failed:`, fallbackError);
        matches = [];
      }
    }

    // Limit to top 5 results for UI
    const finalMatches = matches.slice(0, 5);
    
    console.log(`[/api/matches] Returning ${finalMatches.length} matches`);
    
    if (finalMatches.length === 0) {
      return NextResponse.json({ 
        matches: [],
        message: "No matches found. Try adjusting your preferences or expanding your search criteria."
      });
    }

    return NextResponse.json({ matches: finalMatches });
    
  } catch (err: any) {
    console.error("[/api/matches] Unexpected error:", err);
    return NextResponse.json({ 
      error: "Failed to find matches. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
