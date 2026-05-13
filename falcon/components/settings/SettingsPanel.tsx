'use client';

/**
 * SettingsPanel — shared settings UI for both Admin and Employee.
 *
 * - Editable display name field → updateUserProfile → success toast.
 * - Password reset button → sendPasswordResetEmail → success toast.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState, FormEvent } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/lib/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Save, KeyRound } from 'lucide-react';

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';

export default function SettingsPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateUserProfile(user.uid, displayName.trim());
      showToast('Display name updated.', 'success');
    } catch {
      showToast('Failed to update display name.', 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast(`Password reset email sent to ${user.email}.`, 'success');
    } catch {
      showToast('Failed to send password reset email.', 'error');
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Display name */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-text-primary font-semibold text-base mb-4">Display Name</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={savingName}
              className={INPUT_CLASS}
              placeholder="Your name"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingName || !displayName.trim()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </section>

      {/* Password reset */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-text-primary font-semibold text-base mb-2">Password</h2>
        <p className="text-text-secondary text-sm mb-4">
          A reset link will be sent to <span className="text-text-primary">{user?.email}</span>.
        </p>
        <button
          onClick={handlePasswordReset}
          disabled={sendingReset}
          className="flex items-center gap-2 bg-surface-2 hover:bg-border border border-border disabled:opacity-60 text-text-primary font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          {sendingReset ? 'Sending…' : 'Send Password Reset Email'}
        </button>
      </section>
    </div>
  );
}
