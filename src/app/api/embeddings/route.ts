// File: src/app/api/embeddings/route.ts

import { NextResponse } from "next/server";
import { getOpenAIEmbedding } from "@/lib/openai-embed";

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Request must include a `text` string" },
        { status: 400 }
      );
    }

    // call your helper
    const embedding = await getOpenAIEmbedding(text.trim());

    // sanity‐check
    console.log("↪ embedding length:", Array.isArray(embedding) ? embedding.length : "(not an array)");

    return NextResponse.json({ embedding });
  } catch (err: any) {
    console.error("[/api/embeddings] error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
