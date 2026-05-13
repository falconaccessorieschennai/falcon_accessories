/**
 * Firestore service functions for the
 * Falcon Accessories Job Card Management System.
 *
 * Provides typed CRUD operations for the `jobCards` and `users` collections
 * using the Firebase v9 modular SDK.
 *
 * Requirements: 3.13, 5.1, 5.5, 6.2, 8.3
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import type { JobCard, JobCardStatus, UserProfile } from '../types/index';

// ---------------------------------------------------------------------------
// Collection references
// ---------------------------------------------------------------------------

const JOB_CARDS_COLLECTION = 'jobCards';
const USERS_COLLECTION = 'users';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Firestore document snapshot to a `JobCard`, injecting the document
 * id as the `id` field.
 */
function snapshotToJobCard(snap: QueryDocumentSnapshot<DocumentData>): JobCard {
  const data = snap.data();
  return {
    ...(data as Omit<JobCard, 'id'>),
    id: snap.id,
  };
}

/**
 * Maps a Firestore document snapshot to a `UserProfile`.
 */
function snapshotToUserProfile(
  snap: QueryDocumentSnapshot<DocumentData>
): UserProfile {
  return snap.data() as UserProfile;
}

// ---------------------------------------------------------------------------
// Job Card operations
// ---------------------------------------------------------------------------

/**
 * Creates a new job card document in the `jobCards` collection.
 *
 * Automatically sets `createdAt` and `updatedAt` to the server timestamp.
 * The caller must supply `createdBy` (the uid of the authenticated user).
 *
 * @returns The Firestore-generated document id of the new job card.
 *
 * Requirements: 3.13
 */
export async function createJobCard(
  data: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, JOB_CARDS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Reads a single job card document by its Firestore document id.
 *
 * @returns The `JobCard` if found, or `null` if the document does not exist.
 *
 * Requirements: 6.2
 */
export async function getJobCard(id: string): Promise<JobCard | null> {
  const snap = await getDoc(doc(db, JOB_CARDS_COLLECTION, id));
  if (!snap.exists()) {
    return null;
  }
  return {
    ...(snap.data() as Omit<JobCard, 'id'>),
    id: snap.id,
  };
}

/**
 * Queries all job cards where `createdBy` equals the given user uid.
 *
 * Used by the Employee Dashboard to show only the current employee's records.
 *
 * Requirements: 5.1
 */
export async function getJobCardsByUser(uid: string): Promise<JobCard[]> {
  const q = query(
    collection(db, JOB_CARDS_COLLECTION),
    where('createdBy', '==', uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(snapshotToJobCard);
}

/**
 * Reads all job card documents from the `jobCards` collection.
 *
 * Intended for admin use only — Firestore security rules enforce this at the
 * database level.
 *
 * Requirements: 6.2
 */
export async function getAllJobCards(): Promise<JobCard[]> {
  const snapshot = await getDocs(collection(db, JOB_CARDS_COLLECTION));
  return snapshot.docs.map(snapshotToJobCard);
}

/**
 * Updates the `status` field of a job card and refreshes `updatedAt`.
 *
 * Requirements: 5.5
 */
export async function updateJobCardStatus(
  id: string,
  status: JobCardStatus
): Promise<void> {
  await updateDoc(doc(db, JOB_CARDS_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently deletes a job card document.
 *
 * Firestore security rules restrict this operation to admin users.
 *
 * Requirements: 6.2
 */
export async function deleteJobCard(id: string): Promise<void> {
  await deleteDoc(doc(db, JOB_CARDS_COLLECTION, id));
}

// ---------------------------------------------------------------------------
// User Profile operations
// ---------------------------------------------------------------------------

/**
 * Reads a user profile document from the `users` collection by uid.
 *
 * @returns The `UserProfile` if found, or `null` if the document does not exist.
 *
 * Requirements: 8.3
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
}

/**
 * Writes (or overwrites) a user profile document in the `users` collection.
 *
 * Uses `setDoc` with the uid as the document id so that the profile is
 * addressable by uid without a secondary lookup.
 *
 * Requirements: 8.3
 */
export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, profile.uid), profile);
}

/**
 * Reads all user profile documents from the `users` collection.
 *
 * Intended for admin use only — Firestore security rules enforce this at the
 * database level.
 *
 * Requirements: 8.3
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(snapshotToUserProfile);
}

/**
 * Updates the display name of a user profile in the `users` collection.
 *
 * Requirements: 9.2
 */
export async function updateUserProfile(uid: string, name: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { name });
}
