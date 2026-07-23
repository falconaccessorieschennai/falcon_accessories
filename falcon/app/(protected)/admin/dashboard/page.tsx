'use client';

/**
 * Admin Dashboard — full operational view of all job cards.
 *
 * - Statistics cards: Total, Completed, Pending, In Progress.
 * - Real-time search by Customer Name or Vehicle Number.
 * - Filter controls: date range, customer name, vehicle number, employee, status.
 * - JobCardTable with delete (ConfirmDialog) and PDF download actions.
 * - LoadingSkeleton while fetching.
 *
 * Requirements: 6.1–6.9
 */

import { useEffect, useState, useMemo } from 'react';
import { getAllJobCards, deleteJobCard } from '@/lib/firestore';
import { generateJobCardPDF } from '@/components/pdf/generatePDF';
import JobCardTable from '@/components/job-card/JobCardTable';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { JobCard, JobCardStatus } from '@/types';

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4">
      <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ALL_STATUSES: JobCardStatus[] = ['Pending', 'In Progress', 'Completed'];

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobCardStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    getAllJobCards()
      .then(setJobCards)
      .catch(() => showToast('Failed to load job cards.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  // Statistics
  const stats = useMemo(() => ({
    total: jobCards.length,
    completed: jobCards.filter((j) => j.status === 'Completed').length,
    pending: jobCards.filter((j) => j.status === 'Pending').length,
    inProgress: jobCards.filter((j) => j.status === 'In Progress').length,
  }), [jobCards]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobCards.filter((jc) => {
      if (q && !jc.customerName.toLowerCase().includes(q) && !jc.vehicleNumber.toLowerCase().includes(q)) return false;
      if (filterCustomer && !jc.customerName.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
      if (filterVehicle && !jc.vehicleNumber.toLowerCase().includes(filterVehicle.toLowerCase())) return false;
      if (filterEmployee && !jc.employeeName.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
      if (filterStatus && jc.status !== filterStatus) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom).getTime() / 1000;
        if (jc.date.seconds < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo).getTime() / 1000;
        if (jc.date.seconds > to) return false;
      }
      return true;
    });
  }, [jobCards, search, filterCustomer, filterVehicle, filterEmployee, filterStatus, filterDateFrom, filterDateTo]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJobCard(deleteTarget);
      setJobCards((prev) => prev.filter((jc) => jc.id !== deleteTarget));
      showToast('Job card deleted.', 'success');
    } catch {
      showToast('Failed to delete job card.', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleDownloadPDF(jc: JobCard) {
    generateJobCardPDF({ jobCard: jc, accessories: jc.accessories, totalAmount: jc.totalAmount });
  }

  const INPUT_CLASS = 'bg-surface-2 border border-border text-text-primary rounded-lg px-3 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition';

  return (
    <div className="p-6 lg:pl-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton rows={1} height="h-20" />
          <LoadingSkeleton rows={1} height="h-20" />
          <LoadingSkeleton rows={1} height="h-20" />
          <LoadingSkeleton rows={1} height="h-20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Job Cards" value={stats.total} />
          <StatCard label="Completed" value={stats.completed} accent="text-success" />
          <StatCard label="Pending" value={stats.pending} accent="text-warning" />
          <StatCard label="In Progress" value={stats.inProgress} accent="text-info" />
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by customer name or vehicle number…"
        className={`w-full ${INPUT_CLASS}`}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <input type="text" placeholder="Customer" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className={INPUT_CLASS} />
        <input type="text" placeholder="Vehicle No." value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className={INPUT_CLASS} />
        <input type="text" placeholder="Employee" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className={INPUT_CLASS} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as JobCardStatus | '')} className={INPUT_CLASS}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={INPUT_CLASS} title="From date" />
        <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={INPUT_CLASS} title="To date" />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : (
        <JobCardTable
          jobCards={filtered}
          onDelete={(id) => setDeleteTarget(id)}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message="Are you sure you want to permanently delete this job card? This action cannot be undone."
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
