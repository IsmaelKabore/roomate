// File: src/app/api/matches/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchEnhancedMatchesV2, extractKeywordsFromDescription } from "@/lib/enhancedMatching";
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
    // For now, return mock data to test the UI
    const mockMatches = [
      {
        id: "1",
        title: searchType === "room" ? "Beautiful 2BR Apartment Downtown" : "Clean & Friendly Graduate Student",
        description: searchType === "room" 
          ? "Spacious 2-bedroom apartment in the heart of downtown. Recently renovated with modern appliances, hardwood floors, and great natural light. Close to public transit and restaurants."
          : "I'm a 24-year-old graduate student studying computer science. I'm clean, quiet, and respectful. I enjoy cooking, reading, and occasional movie nights. Non-smoker, no pets.",
        price: searchType === "room" ? 1200 : null,
        address: "123 Main St, Downtown",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
        type: searchType,
        userId: "mock-user-1",
        structuredScore: 0.85,
        semanticScore: 0.92,
        combinedScore: 0.89,
        explanation: "Excellent match! Your description closely aligns with this listing. Great location match and budget compatibility."
      },
      {
        id: "2", 
        title: searchType === "room" ? "Cozy Studio Near University" : "Professional Working Remote",
        description: searchType === "room"
          ? "Charming studio apartment perfect for students or young professionals. Includes all utilities, high-speed internet, and access to gym. Walking distance to campus."
          : "I'm a 28-year-old software developer working remotely. I keep regular hours, love to cook healthy meals, and enjoy weekend hiking. Looking for a like-minded roommate.",
        price: searchType === "room" ? 900 : null,
        address: "456 University Ave, Campus Area",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400"],
        type: searchType,
        userId: "mock-user-2",
        structuredScore: 0.75,
        semanticScore: 0.78,
        combinedScore: 0.77,
        explanation: "Good match based on location preferences and lifestyle compatibility. Budget fits your range well."
      },
      {
        id: "3",
        title: searchType === "room" ? "Modern 1BR with Amenities" : "Creative Artist & Designer",
        description: searchType === "room"
          ? "Brand new 1-bedroom with in-unit laundry, dishwasher, and balcony. Building features rooftop deck, fitness center, and pet-friendly policies."
          : "I'm a freelance graphic designer who works from home. I'm creative, organized, and love having plants around. I enjoy art galleries, farmer's markets, and yoga.",
        price: searchType === "room" ? 1400 : null,
        address: "789 Creative District, Arts Quarter",
        images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400"],
        type: searchType,
        userId: "mock-user-3",
        structuredScore: 0.65,
        semanticScore: 0.70,
        combinedScore: 0.68,
        explanation: "Moderate match. Some preferences align well, though budget is slightly higher than your target range."
      }
    ];

    // Try to use real matching logic, but fall back to mock data if it fails
    try {
      // Extract keywords from the user description
      const userKeywords = await extractKeywordsFromDescription(description.trim());
      const matches = await fetchEnhancedMatchesV2(
        description.trim(),
        userKeywords,
        structuredFilters,
        searchType,
        userId,
        5
      );
      if (matches && matches.length > 0) {
        return NextResponse.json({ matches });
      }
    } catch (realMatchError) {
      console.log("Real matching failed, using mock data:", realMatchError);
    }

    return NextResponse.json({ matches: mockMatches });
  } catch (err: any) {
    console.error("[/api/matches] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
