// src/lib/firestoreProfile.ts

import { db } from './firebaseConfig'
import { doc, setDoc, getDoc } from 'firebase/firestore'

/**
 * Define the shape of a user profile document.
 */
export interface UserProfile {
  name?: string
  profilePicture?: string
  bio?: string
  hometown?: string
  major?: string
  school?: string
  year?: string
  hobbies?: string[]
  // Add any other fields your app expects here
}

/**
 * Save or overwrite a user's profile under "profiles/{userId}".
 */
export async function saveUserProfile(
  userId: string,
  profileData: UserProfile
): Promise<void> {
  const profileRef = doc(db, 'profiles', userId)
  await setDoc(profileRef, profileData)
}

/**
 * Fetch a user's profile from "profiles/{userId}".
 * Returns `null` if none exists, otherwise returns a `UserProfile`.
 */
export async function fetchUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const profileRef = doc(db, 'profiles', userId)
  const snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}
