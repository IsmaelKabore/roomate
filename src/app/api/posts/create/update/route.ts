// File: src/app/api/posts/update/route.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { firebaseConfig } from "@/lib/firebaseConfig"
import { getOpenAIEmbedding } from "@/lib/openai-embed"

// Initialize Firebase app & Firestore once
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    const {
      postId,
      title,
      description,
      address = "",
      price,
      images,
      type,
      keywords,
    } = (await request.json()) as {
      postId: string
      title: string
      description: string
      address?: string
      price?: number
      images: string[]
      type: "room" | "roommate"
      keywords: string[]
    }

    // Validate incoming body
    if (
      typeof postId !== "string" ||
      typeof title !== "string" ||
      typeof description !== "string" ||
      !Array.isArray(images) ||
      (type !== "room" && type !== "roommate") ||
      !Array.isArray(keywords)
    ) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // 1) Recompute embedding via OpenAI
    const combinedText = `${title.trim()}\n${description.trim()}\n${address.trim()}`
    const newEmbedding = await getOpenAIEmbedding(combinedText)

    // 2) Fetch & update Firestore doc
    const postRef = doc(db, "posts", postId)
    const snap = await getDoc(postRef)
    if (!snap.exists()) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await updateDoc(postRef, {
      title: title.trim(),
      description: description.trim(),
      price: price ?? null,
      address: address.trim(),
      images,
      type,
      keywords,
      embedding: newEmbedding,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[API /api/posts/update] Error:", err)
    return NextResponse.json(
      { error: "Internal server error updating post." },
      { status: 500 }
    )
  }
}
