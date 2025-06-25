// File: src/lib/firebaseConfig.ts

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported as messagingIsSupported } from "firebase/messaging"

// 1) Export the raw config object for server‐side routes to import
export const firebaseConfig = {
  apiKey: "AIzaSyCLa1yWGbQ2CA94N3y0OwXln_wTkFznSNI",
  authDomain: "roomate-64dcb.firebaseapp.com",
  projectId: "roomate-64dcb",
  storageBucket: "roomate-64dcb.firebasestorage.app",
  messagingSenderId: "181272139051",
  appId: "1:181272139051:web:9e5ae6c17d8b494302616e",
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
