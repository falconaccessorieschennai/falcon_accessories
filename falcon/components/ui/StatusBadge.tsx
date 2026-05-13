'use client';

/**
 * StatusBadge — displays a colored pill for a job card status.
 *
 * Pending     → yellow
 * In Progress → blue
 * Completed   → green
 *
 * Requirements: 5.2, 6.2
 */

import type { JobCardStatus } from '@/types';

interface StatusBadgeProps {
  status: JobCardStatus;
}

const STATUS_STYLES: Record<JobCardStatus, string> = {
  Pending: 'bg-warning/15 text-warning border-warning/30',
  'In Progress': 'bg-info/15 text-info border-info/30',
  Completed: 'bg-success/15 text-success border-success/30',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
