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

// Enhanced filters that can track which filters are explicitly set
export interface EnhancedStructuredFilters extends StructuredFilters {
  // Track which filters are explicitly set by the user (not defaults)
  _explicitFilters?: {
    budgetMin?: boolean;
    budgetMax?: boolean;
    location?: boolean;
    locationRadiusKm?: boolean;
    bedrooms?: boolean;
    bathrooms?: boolean;
    furnished?: boolean;
  };
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
