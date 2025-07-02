// File: src/lib/firebaseConfig.ts

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported as messagingIsSupported } from "firebase/messaging"

// Make sure you’ve set these in your .env.local (and git-ignored)
const {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID,
} = process.env

// Fail fast if any are missing
if (
  !NEXT_PUBLIC_FIREBASE_API_KEY ||
  !NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  !NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  !NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  !NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
  !NEXT_PUBLIC_FIREBASE_APP_ID
) {
  throw new Error(
    "Missing one of the NEXT_PUBLIC_FIREBASE_* env vars for firebaseConfig"
  )
}

export const firebaseConfig = {
  apiKey:            NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase App once (for client usage)
const app = initializeApp(firebaseConfig)

// Export Auth and Firestore for use in your app
export const auth = getAuth(app)
export const db   = getFirestore(app)

// Optionally export Messaging if supported (client only)
export let messaging: ReturnType<typeof getMessaging> | null = null
if (typeof window !== "undefined") {
  messagingIsSupported().then((supported) => {
    messaging = supported ? getMessaging(app) : null
  })
}
