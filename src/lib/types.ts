// File: src/lib/types.ts

// Only the filters you actually collect in your UI:
export interface StructuredFilters {
  budgetMin: number;
  budgetMax: number;
  location: { lat: number; lng: number };
  locationRadiusKm: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
}

// Common post fields
export interface PostBase {
  id: string;
  userId: string;
  title: string;
  description: string;
  address: string;
  price: number | null;
  images: string[];
  type: "room" | "roommate";
  createdAt: Date;
  updatedAt: Date;
}

// What we store on each post in Firestore
export interface PostWithMeta extends PostBase {
  structured: StructuredFilters;
  embedding: number[]; // text-embedding vector
}

// What we return from fetchEnhancedMatches
export interface EnhancedMatch extends PostWithMeta {
  structuredScore: number;   // 0–1
  semanticScore: number;     // cosine similarity 0–1
  combinedScore: number;     // weighted mix
  explanation: string;       // short human-readable reason
}
