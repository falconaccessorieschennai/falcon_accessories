'use client';

/**
 * JobCardTable — responsive table for admin dashboard.
 *
 * Props:
 *   jobCards      — array of job cards to display
 *   onDelete      — called with job card id when delete is clicked
 *   onDownloadPDF — called with job card when download is clicked
 *
 * Requirements: 6.2, 6.7, 6.9
 */

import { useRouter } from 'next/navigation';
import { Trash2, Download } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { JobCard } from '@/types';

interface JobCardTableProps {
  jobCards: JobCard[];
  onDelete: (id: string) => void;
  onDownloadPDF: (jobCard: JobCard) => void;
}

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function JobCardTable({ jobCards, onDelete, onDownloadPDF }: JobCardTableProps) {
  const router = useRouter();

  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p>No job cards match your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Desktop header */}
      <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.2fr_auto] gap-4 px-5 py-3 border-b border-border bg-surface-2 text-text-secondary text-xs font-semibold uppercase tracking-wide">
        <span>Customer</span>
        <span>Vehicle</span>
        <span>Employee</span>
        <span>Date</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {jobCards.map((jc) => (
        <div
          key={jc.id}
          className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.5fr_1fr_1.2fr_auto] gap-2 lg:gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-surface-2 transition-colors cursor-pointer items-center"
          onClick={() => router.push(`/job-cards/${jc.id}`)}
        >
          <div>
            <p className="text-text-primary text-sm font-medium">{jc.customerName}</p>
            <p className="text-text-muted text-xs lg:hidden">{jc.vehicleNumber} · {jc.employeeName}</p>
          </div>
          <p className="hidden lg:block text-text-secondary text-sm">{jc.vehicleNumber}</p>
          <p className="hidden lg:block text-text-secondary text-sm">{jc.employeeName || '—'}</p>
          <p className="hidden lg:block text-text-secondary text-sm">{formatDate(jc.date)}</p>
          <div className="hidden lg:block">
            <StatusBadge status={jc.status} />
          </div>

          {/* Actions — stop propagation */}
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onDownloadPDF(jc)}
              title="Download PDF"
              className="p-2 rounded-lg text-text-secondary hover:text-info hover:bg-info/10 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(jc.id)}
              title="Delete"
              className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
