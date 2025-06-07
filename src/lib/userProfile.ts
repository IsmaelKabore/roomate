// File: src/lib/userProfile.ts

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    DocumentData,
  } from 'firebase/firestore'
  import { db } from './firebaseConfig'
  
  /**
   * The shape of a profile document in Firestore.
   */
  export interface UserProfile {
    displayName: string
    summary: string
    createdAt: Timestamp
    updatedAt?: Timestamp
  }
  
  /**
   * Fetches / returns the user’s profile (or null if none exists).
   */
  export async function getUserProfile(
    userId: string
  ): Promise<UserProfile | null> {
    if (!userId) {
      throw new Error('getUserProfile: userId is required')
    }
    const profileRef = doc(db, 'profiles', userId)
    const snap = await getDoc(profileRef)
    if (!snap.exists()) {
      return null
    }
    const data = snap.data() as DocumentData
    return {
      displayName: data.displayName,
      summary: data.summary,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp | undefined,
    }
  }
  
  /**
   * Creates or updates a user’s profile document under `profiles/{userId}`.
   * - If no document exists, it sets createdAt + updatedAt to serverTimestamp().
   * - If a document exists, it overwrites displayName+summary and resets updatedAt.
   */
  export async function upsertUserProfile(
    userId: string,
    displayName: string,
    summary: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('upsertUserProfile: userId is required')
    }
    if (!displayName.trim()) {
      throw new Error('upsertUserProfile: displayName is required')
    }
    if (!summary.trim()) {
      throw new Error('upsertUserProfile: summary is required')
    }
  
    const profileRef = doc(db, 'profiles', userId)
    const now = serverTimestamp()
  
    const snap = await getDoc(profileRef)
    if (snap.exists()) {
      await updateDoc(profileRef, {
        displayName: displayName.trim(),
        summary: summary.trim(),
        updatedAt: now,
      })
    } else {
      await setDoc(profileRef, {
        displayName: displayName.trim(),
        summary: summary.trim(),
        createdAt: now,
        updatedAt: now,
      })
    }
  }
  