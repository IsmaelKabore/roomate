// src/lib/rate-limit.ts
import { NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

const ONE_MINUTE = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;

// Each key holds { remainingTokens, resetTimestamp }
const cache = new LRUCache<string, { remaining: number; reset: number }>({
  max: 10_000,
  ttl: ONE_MINUTE,
});

export const rateLimiter = {
  /**
   * Call this at the top of any API route to enforce per-user rate limits.
   * @param userId - unique identifier for this user/tenant
   * @param route  - string to namespace limits (e.g. "/api/matches")
   */
  async check(userId: string, route: string) {
    const key = `rl:${userId}:${route}`;
    const now = Date.now();

    let entry = cache.get(key);
    // If first time or window expired, reset
    if (!entry || entry.reset <= now) {
      entry = {
        remaining: MAX_REQUESTS_PER_MINUTE,
        reset: now + ONE_MINUTE,
      };
    }

    if (entry.remaining <= 0) {
      // 429 Too Many Requests
      throw NextResponse.json(
        { error: "Rate limit exceeded, try again in a minute." },
        { status: 429 }
      );
    }

    // consume a token and store
    entry.remaining--;
    cache.set(key, entry);
  },
};
