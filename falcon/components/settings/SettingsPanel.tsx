'use client';

/**
 * SettingsPanel — shared settings UI for both Admin and Employee.
 *
 * - Editable display name field → updateUserProfile → success toast.
 * - Direct password change (admin sets new password via server action).
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState, FormEvent } from 'react';
import { updateUserProfile } from '@/lib/firestore';
import { resetPasswordAction } from '@/app/actions/employees';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Save, KeyRound } from 'lucide-react';

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';

export default function SettingsPanel() {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (!user) return;
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const result = await resetPasswordAction(user.uid, newPassword);
    setSavingPassword(false);
    if ('error' in result) {
      setPasswordError(result.error);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully.', 'success');
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

      {/* Change Password — Admin only */}
      {role === 'admin' && (
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-text-primary font-semibold text-base mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              New Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={savingPassword}
              className={INPUT_CLASS}
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={savingPassword}
              className={INPUT_CLASS}
              placeholder="Re-enter password"
            />
          </div>
          {passwordError && <p className="text-error text-sm">{passwordError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
      )}
    </div>
  );
}
