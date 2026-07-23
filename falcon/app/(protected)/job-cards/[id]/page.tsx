'use client';

/**
 * Job Card Details page.
 *
 * - Fetches job card by id via getJobCard.
 * - Employees can only view their own cards; others redirect to /employee/dashboard.
 * - Displays all fields: customer, vehicle, accessories table, total, status.
 * - Download PDF button.
 * - Status update (employee: own; admin: all).
 * - Admin-only delete with ConfirmDialog.
 *
 * Requirements: 7.1–7.6
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getJobCard, updateJobCardStatus, deleteJobCard } from '@/lib/firestore';
import { generateJobCardPDF } from '@/components/pdf/generatePDF';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { JobCard, JobCardStatus } from '@/types';

const STATUSES: JobCardStatus[] = ['Pending', 'In Progress', 'Completed'];

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-border last:border-0">
      <span className="text-text-secondary text-sm w-40 flex-shrink-0">{label}</span>
      <span className="text-text-primary text-sm font-medium">{value}</span>
    </div>
  );
}

export default function JobCardDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    getJobCard(id)
      .then((jc) => {
        if (!jc) { router.replace('/employee/dashboard'); return; }
        // Access control: employees can only see their own cards
        if (role === 'employee' && jc.createdBy !== user?.uid) {
          router.replace('/employee/dashboard');
          return;
        }
        setJobCard(jc);
      })
      .catch(() => showToast('Failed to load job card.', 'error'))
      .finally(() => setLoading(false));
  }, [id, user, role, router, showToast]);

  async function handleStatusChange(status: JobCardStatus) {
    if (!jobCard) return;
    setUpdatingStatus(true);
    try {
      await updateJobCardStatus(jobCard.id, status);
      setJobCard((prev) => prev ? { ...prev, status } : prev);
      showToast('Status updated.', 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!jobCard) return;
    setDeleting(true);
    try {
      await deleteJobCard(jobCard.id);
      showToast('Job card deleted.', 'success');
      router.replace('/admin/dashboard');
    } catch {
      showToast('Failed to delete job card.', 'error');
      setDeleting(false);
      setShowDelete(false);
    }
  }

  function handleDownload() {
    if (!jobCard) return;
    generateJobCardPDF({ jobCard, accessories: jobCard.accessories, totalAmount: jobCard.totalAmount });
  }

  if (loading) {
    return (
      <div className="p-6 lg:pl-8 max-w-4xl mx-auto">
        <LoadingSkeleton rows={10} height="h-8" />
      </div>
    );
  }

  if (!jobCard) return null;

  const canEdit = role === 'admin' || jobCard.createdBy === user?.uid;

  return (
    <div className="p-6 lg:pl-8 max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => router.push(`/job-cards/${id}/edit`)}
              className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 bg-error/10 border border-error/30 hover:bg-error/20 text-error rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">{jobCard.customerName}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{jobCard.vehicleNumber} · {jobCard.vehicleName}</p>
        </div>
        <StatusBadge status={jobCard.status} />
      </div>

      {/* Customer Details */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-text-primary font-semibold text-sm mb-3">Customer Details</h2>
        <DetailRow label="Customer Name" value={jobCard.customerName} />
        <DetailRow label="Phone Number" value={jobCard.phoneNumber} />
        <DetailRow label="Employee Name" value={jobCard.employeeName || '—'} />
        <DetailRow label="Notes" value={jobCard.notes || '—'} />
      </section>

      {/* Vehicle Details */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-text-primary font-semibold text-sm mb-3">Vehicle Details</h2>
        <DetailRow label="Vehicle Name" value={jobCard.vehicleName} />
        <DetailRow label="Vehicle Number" value={jobCard.vehicleNumber} />
        <DetailRow label="Job Date" value={formatDate(jobCard.date)} />
        <DetailRow label="Delivery Date" value={formatDate(jobCard.deliveryDate)} />
      </section>

      {/* Accessories */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-text-primary font-semibold text-sm">Accessories</h2>
        </div>
        {jobCard.accessories.length === 0 ? (
          <p className="px-5 py-4 text-text-muted text-sm">No accessories selected.</p>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_0.5fr_1fr_1fr] gap-4 px-5 py-2 bg-surface-2 text-text-secondary text-xs font-semibold uppercase tracking-wide">
              <span>Name</span>
              <span>Variant</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Notes</span>
            </div>
            {jobCard.accessories.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_0.5fr_1fr_1fr] gap-2 md:gap-4 px-5 py-3 border-t border-border text-sm"
              >
                <span className="text-text-primary font-medium">{a.name}</span>
                <span className="text-text-secondary">{a.variant || '—'}</span>
                <span className="text-text-secondary">{a.quantity}</span>
                <span className="text-text-secondary">₹{a.price.toLocaleString('en-IN')}</span>
                <span className="text-text-muted">{a.notes || '—'}</span>
              </div>
            ))}
            {/* Total */}
            <div className="flex justify-end px-5 py-4 border-t border-border bg-surface-2">
              <div className="text-right">
                <p className="text-text-secondary text-xs">Total Amount</p>
                <p className="text-text-primary text-xl font-bold mt-0.5">
                  ₹{jobCard.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Status update */}
      {canEdit && (
        <section className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-3">Update Status</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={updatingStatus || jobCard.status === s}
                onClick={() => handleStatusChange(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  jobCard.status === s
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:bg-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <ConfirmDialog
          message="Permanently delete this job card? This cannot be undone."
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
