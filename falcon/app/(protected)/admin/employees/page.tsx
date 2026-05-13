'use client';

/**
 * Employee Management page — admin only.
 *
 * - Lists all employees with name, email, creation date.
 * - Add Employee form: name, email, password → Server Action → Firestore profile.
 * - Remove employee: ConfirmDialog → Server Action.
 * - Password reset: sendPasswordResetEmail.
 * - Inline errors for duplicate email / weak password.
 *
 * Requirements: 8.1–8.8
 */

import { useEffect, useState, FormEvent } from 'react';
import { Timestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAllUsers } from '@/lib/firestore';
import { createEmployeeAction, deleteEmployeeAction } from '@/app/actions/employees';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, Trash2, KeyRound } from 'lucide-react';
import type { UserProfile } from '@/types';

function formatDate(ts: { seconds?: number; toDate?: () => Date } | Date | null): string {
  if (!ts) return '—';
  const d = ts instanceof Date ? ts : typeof (ts as { toDate?: () => Date }).toDate === 'function'
    ? (ts as { toDate: () => Date }).toDate()
    : new Date((ts as { seconds: number }).seconds * 1000);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';
const LABEL_CLASS = 'block text-text-secondary text-sm font-medium mb-1.5';

export default function EmployeesPage() {
  const { showToast } = useToast();

  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAllUsers()
      .then((users) => setEmployees(users.filter((u) => u.role === 'employee')))
      .catch(() => showToast('Failed to load employees.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setSubmitting(true);
    const result = await createEmployeeAction(name.trim(), email.trim(), password);
    setSubmitting(false);
    if ('error' in result) {
      setFormError(result.error);
      return;
    }
    const newProfile: UserProfile = {
      uid: result.uid,
      name: name.trim(),
      email: email.trim(),
      role: 'employee',
      createdAt: Timestamp.now() as any,
    };
    setEmployees((prev) => [...prev, newProfile]);
    setName(''); setEmail(''); setPassword('');
    showToast('Employee created successfully.', 'success');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteEmployeeAction(deleteTarget.uid);
    setDeleting(false);
    setDeleteTarget(null);
    if ('error' in result) {
      showToast(result.error, 'error');
      return;
    }
    setEmployees((prev) => prev.filter((e) => e.uid !== deleteTarget.uid));
    showToast('Employee removed.', 'success');
  }

  async function handlePasswordReset(emp: UserProfile) {
    try {
      await sendPasswordResetEmail(auth, emp.email);
      showToast(`Password reset email sent to ${emp.email}.`, 'success');
    } catch {
      showToast('Failed to send password reset email.', 'error');
    }
  }

  return (
    <div className="p-6 lg:pl-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-text-primary text-2xl font-bold">Employee Management</h1>

      {/* Add Employee form */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-text-primary font-semibold text-base mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Add Employee
        </h2>
        <form onSubmit={handleAdd} noValidate className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Full name" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="employee@example.com" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Password</label>
            <input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Min. 6 characters" />
          </div>
          {formError && (
            <p className="sm:col-span-3 text-error text-sm">{formError}</p>
          )}
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Employee'}
            </button>
          </div>
        </form>
      </section>

      {/* Employee list */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-4">
          Employees ({loading ? '…' : employees.length})
        </h2>

        {loading ? (
          <LoadingSkeleton rows={5} height="h-14" />
        ) : employees.length === 0 ? (
          <p className="text-text-muted text-sm">No employees yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_auto] gap-4 px-5 py-3 border-b border-border bg-surface-2 text-text-secondary text-xs font-semibold uppercase tracking-wide">
              <span>Name</span>
              <span>Email</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {employees.map((emp) => (
              <div
                key={emp.uid}
                className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_auto] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-0 items-center"
              >
                <p className="text-text-primary text-sm font-medium">{emp.name}</p>
                <p className="text-text-secondary text-sm">{emp.email}</p>
                <p className="text-text-muted text-sm">{formatDate(emp.createdAt as Parameters<typeof formatDate>[0])}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePasswordReset(emp)}
                    title="Send password reset"
                    className="p-2 rounded-lg text-text-secondary hover:text-info hover:bg-info/10 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(emp)}
                    title="Remove employee"
                    className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Remove ${deleteTarget.name} (${deleteTarget.email})? They will lose access to the system.`}
          confirmLabel={deleting ? 'Removing…' : 'Remove'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
