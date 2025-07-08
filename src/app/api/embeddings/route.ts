export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getOpenAIEmbedding } from "@/app/api/_server/openai-embed";

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Request must include a `text` string" },
        { status: 400 }
      );
    }

    const embedding = await getOpenAIEmbedding(text.trim());

    console.log("↪ embedding length:", Array.isArray(embedding) ? embedding.length : "(not an array)");

    return NextResponse.json({ embedding });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[/api/embeddings] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
