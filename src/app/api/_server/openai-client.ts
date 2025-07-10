// File: src/app/api/_server/openai-client.ts

import OpenAI from "openai";

// Shared OpenAI client for server-side embedding calls
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
