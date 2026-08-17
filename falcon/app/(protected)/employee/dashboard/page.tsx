'use client';

/**
 * Employee Dashboard — lists job cards created by the current employee.
 *
 * - Fetches job cards via getJobCardsByUser(uid).
 * - Shows Customer Name, Vehicle Number, Date, Delivery Date, Status badge.
 * - Inline status dropdown persists to Firestore.
 * - "Create Job Card" button → /job-cards/new.
 * - Row click → /job-cards/[id].
 * - LoadingSkeleton while fetching.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilePlus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getJobCardsByUser, updateJobCardStatus } from '@/lib/firestore';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { JobCard, JobCardStatus } from '@/types';

const STATUSES: JobCardStatus[] = ['Pending', 'In Progress', 'Completed'];

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getJobCardsByUser(user.uid)
      .then(setJobCards)
      .catch(() => showToast('Failed to load job cards.', 'error'))
      .finally(() => setLoading(false));
  }, [user, showToast]);

  async function handleStatusChange(id: string, status: JobCardStatus) {
    setUpdatingId(id);
    try {
      await updateJobCardStatus(id, status);
      setJobCards((prev) =>
        prev.map((jc) => (jc.id === id ? { ...jc, status } : jc))
      );
      showToast('Status updated.', 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6 lg:pl-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">My Job Cards</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {loading ? 'Loading…' : `${jobCards.length} record${jobCards.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/job-cards/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New Job Card
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={6} height="h-14" />
      ) : jobCards.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-lg">No job cards yet.</p>
          <p className="text-sm mt-1">Create your first one to get started.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 border-b border-border bg-surface-2 text-text-secondary text-xs font-semibold uppercase tracking-wide">
            <span>Customer</span>
            <span>Vehicle</span>
            <span>Date</span>
            <span>Delivery</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {jobCards.map((jc) => (
            <div
              key={jc.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-surface-2 transition-colors cursor-pointer"
              onClick={() => router.push(`/job-cards/${jc.id}`)}
            >
              <div>
                <p className="text-text-primary text-sm font-medium">{jc.customerName}</p>
                <p className="text-text-muted text-xs md:hidden">{jc.vehicleNumber}</p>
              </div>
              <p className="hidden md:block text-text-secondary text-sm">{jc.vehicleNumber}</p>
              <p className="hidden md:block text-text-secondary text-sm">{formatDate(jc.date)}</p>
              <p className="hidden md:block text-text-secondary text-sm">{formatDate(jc.deliveryDate)}</p>

              {/* Status dropdown — stop propagation so click doesn't navigate */}
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={jc.status}
                  disabled={updatingId === jc.id}
                  onChange={(e) => handleStatusChange(jc.id, e.target.value as JobCardStatus)}
                  className="w-full bg-background border border-border text-text-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="mt-1">
                  <StatusBadge status={jc.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
