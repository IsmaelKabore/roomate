// File: src/app/api/matches/route.ts

export const runtime = 'nodejs';
console.log("🛠 Running in Node.js? process.versions.node =", process?.versions?.node);

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  fetchEnhancedMatchesV2,
  extractKeywordsFromDescription,
  fetchMatchesWithFallback,
} from "@/app/api/_server/enhancedMatching";

import type {
  StructuredFilters,
  EnhancedMatch,
  EnhancedStructuredFilters,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    userId?: string;
    searchType?: "room" | "roommate";
    description?: string;
    structuredFilters?: StructuredFilters;
    explicitFilters?: {
      budgetMin?: boolean;
      budgetMax?: boolean;
      location?: boolean;
      locationRadiusKm?: boolean;
      bedrooms?: boolean;
      bathrooms?: boolean;
      furnished?: boolean;
    };
  };

  const { userId, searchType, description, structuredFilters, explicitFilters } = body;

  if (!userId || !searchType || !description || !structuredFilters) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Merge explicit filters into enhanced filters
  const enhancedFilters: EnhancedStructuredFilters = {
    ...structuredFilters,
    _explicitFilters: explicitFilters || {},
  };

  try {
    console.log(`[/api/matches] Starting search for ${searchType} with user: ${userId}`);

    // Extract keywords from user description
    const userKeywords = await extractKeywordsFromDescription(description.trim());
    console.log(`[/api/matches] Extracted keywords:`, userKeywords);

    let matches: EnhancedMatch[] = [];

    // 1) Try enhanced matching
    try {
      console.log(`[/api/matches] Attempting enhanced matching with explicit filters:`, explicitFilters);
      matches = await fetchEnhancedMatchesV2(
        description.trim(),
        userKeywords,
        enhancedFilters,
        searchType,
        userId,
        10
      );
      console.log(`[/api/matches] Enhanced matching returned ${matches.length} results`);
    } catch (enhancedError) {
      console.warn(`[/api/matches] Enhanced matching failed:`, enhancedError);
      matches = [];
    }

    // 2) Fallback if no matches
    if (!matches || matches.length === 0) {
      console.log(`[/api/matches] Using fallback matching...`);
      try {
        matches = await fetchMatchesWithFallback(
          description.trim(),
          userKeywords,
          enhancedFilters,
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

    // Return top 5
    const finalMatches = matches.slice(0, 5);
    console.log(`[/api/matches] Returning ${finalMatches.length} matches`);

    if (finalMatches.length === 0) {
      return NextResponse.json(
        {
          matches: [],
          message: "No matches found. Try adjusting your preferences or expanding your search criteria.",
        }
      );
    }

    return NextResponse.json({ matches: finalMatches });
  } catch (err: unknown) {
    console.error("[/api/matches] Unexpected error:", err);
    const message = err instanceof Error ? err.message : undefined;
    return NextResponse.json(
      {
        error: "Failed to find matches. Please try again.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
