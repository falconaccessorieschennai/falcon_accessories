'use server';

/**
 * Server Actions for employee management.
 *
 * Firebase Admin SDK calls must run server-side to keep service account
 * credentials out of the client bundle.
 *
 * Requirements: 8.2, 8.3, 8.4
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function createUserProfileAction(
  uid: string,
  name: string,
  email: string,
  role: 'admin' | 'employee'
): Promise<{ success: true } | { error: string }> {
  try {
    await adminDb.collection('users').doc(uid).set({
      uid,
      name,
      email,
      role,
      createdAt: new Date(),
    });
    return { success: true };
  } catch {
    return { error: 'Failed to create user profile.' };
  }
}

export async function createEmployeeAction(
  name: string,
  email: string,
  password: string
): Promise<{ uid: string } | { error: string }> {
  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role: 'employee',
      createdAt: new Date(),
    });
    return { uid: userRecord.uid };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return { error: 'An account with this email already exists.' };
    }
    if (code === 'auth/weak-password') {
      return { error: 'Password must be at least 6 characters.' };
    }
    return { error: 'Failed to create employee. Please try again.' };
  }
}

export async function deleteEmployeeAction(
  uid: string
): Promise<{ success: true } | { error: string }> {
  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
    return { success: true };
  } catch {
    return { error: 'Failed to remove employee. Please try again.' };
  }
}

export async function resetPasswordAction(
  uid: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  try {
    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    await adminAuth.updateUser(uid, { password: newPassword });
    return { success: true };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/weak-password') {
      return { error: 'Password must be at least 6 characters.' };
    }
    return { error: 'Failed to reset password. Please try again.' };
  }
}
