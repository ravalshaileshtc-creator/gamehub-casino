import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gamehub-production'
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } else {
      initializeApp({
        projectId,
      })
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

export const adminDb = getApps().length ? getFirestore() : (null as any)
export const adminAuth = getApps().length ? getAuth() : (null as any)
