// File: src/lib/firebaseConfig.ts

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported as messagingIsSupported } from "firebase/messaging"

// 1) Export the raw config object for server‐side routes to import
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// 2) Initialize Firebase App once (for client usage if needed)
const app = initializeApp(firebaseConfig)

// 3) Export Auth and Firestore for any client‐side or server‐side code
export const auth = getAuth(app)
export const db = getFirestore(app)

// 4) Optionally export Messaging if supported (client only)
export let messaging: ReturnType<typeof getMessaging> | null = null
if (typeof window !== "undefined") {
  messagingIsSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    } else {
      messaging = null
    }
  })
}
