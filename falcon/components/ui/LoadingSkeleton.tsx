'use client';

/**
 * LoadingSkeleton — animated placeholder for loading states.
 *
 * Props:
 *   rows   — number of skeleton rows to render (default: 4)
 *   height — Tailwind height class for each row (default: "h-10")
 *
 * Requirements: 5.6, 6.8
 */

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
}

export default function LoadingSkeleton({
  rows = 4,
  height = 'h-10',
}: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-3" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`w-full rounded-lg bg-surface-2 animate-skeleton-pulse ${height}`}
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}
