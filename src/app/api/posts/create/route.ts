// File: src/app/api/posts/create/route.ts

import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getOpenAIEmbedding } from "../../../../lib/openai-embed"
import { firebaseConfig } from "../../../../lib/firebaseConfig"

// Initialize Firebase app & Firestore once
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface CreatePostRequest {
  title: string
  description: string
  address?: string
  price?: number
  images: string[]     // URLs only; front end must upload files separately
  type: "room" | "roommate"
  userId: string       // from authenticated user on front end
  keywords: string[]   // array of trimmed, lowercased keywords
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePostRequest
    const {
      title,
      description,
      address = "",
      price,
      images,
      type,
      userId,
      keywords,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: missing userId" },
        { status: 401 }
      )
    }
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image URL is required" },
        { status: 400 }
      )
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "At least one keyword is required" },
        { status: 400 }
      )
    }

    // Build the combined text for embedding
    const combinedText = [title.trim(), description.trim(), address.trim()].join("\n")

    // Compute embedding via OpenAI
    const embedding = await getOpenAIEmbedding(combinedText)

    // Write to Firestore, including keywords and embedding
    const docRef = await addDoc(collection(db, "posts"), {
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      price: price ?? null,
      images,
      type,
      userId,
      keywords,
      embedding, // 1536-element float array
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ id: docRef.id })
  } catch (err: any) {
    console.error("[createPost] error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
