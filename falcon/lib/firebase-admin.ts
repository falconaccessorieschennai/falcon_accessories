/**
 * Firebase Admin SDK initialization for the
 * Falcon Accessories Job Card Management System.
 *
 * Server-side only — reads service account credentials from non-public
 * environment variables. Never import this file in client components.
 *
 * Requirements: 8.2, 8.3
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Guard against duplicate initialization (e.g. hot-reload in dev)
const app: App =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Next.js stores multi-line env vars with escaped newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
