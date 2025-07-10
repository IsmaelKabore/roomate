// File: src/app/api/_server/llm-rerank.ts

import { openai } from "./openai-client";
import type { EnhancedMatch } from "@/lib/types";

/**
 * Use OpenAI chat completion to rerank an array of matches.
 * Returns up to topN matches in the order provided by the model.
 */
export async function rerankMatchesWithLLM(
  userPrompt: string,
  matches: EnhancedMatch[],
  topN: number = 5
): Promise<EnhancedMatch[]> {
  if (matches.length <= topN) return matches;

  const matchDescriptions = matches
    .map(
      (m) => `(ID: ${m.id})\n` +
             `Title: ${m.title}\n` +
             `Type: ${m.type}\n` +
             `Price: ${m.price ? `$${m.price}/mo` : 'N/A'}\n` +
             `Description: ${m.description}`
    )
    .join("\n\n");

  const userMessage = `
The user is searching for: "${userPrompt}"

Below are ${matches.length} room or roommate listings. Your task is to identify the top ${topN} most suitable matches based on the user's needs. Consider factors like price, location, furnishings, and text relevance.

Each listing is labeled with an ID. Return the top ${topN} IDs in ranked order, separated by commas, and nothing else.

Listings:
${matchDescriptions}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-0613",
    messages: [
      {
        role: "system",
        content:
          "You help students find ideal rooms or roommates by balancing trade-offs intelligently.",
      },
      { role: "user", content: userMessage.trim() },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content ?? "";
  const idMatches = content.match(/[-\w]+/g) ?? [];

  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const reranked = idMatches
    .map((id) => matchMap.get(id))
    .filter((m): m is EnhancedMatch => m !== undefined);

  return reranked.slice(0, topN);
}
