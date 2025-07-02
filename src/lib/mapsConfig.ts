export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables');
}
export const MAP_LIBRARIES = ['places'] as const;