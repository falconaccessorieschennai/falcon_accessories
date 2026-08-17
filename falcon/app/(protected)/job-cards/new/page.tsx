'use client';

/**
 * Create Job Card page — accessible to both Admin and Employee.
 *
 * Renders JobCardForm. On successful save, navigates to the new job card's
 * details page.
 *
 * Requirements: 3.1, 3.14
 */

import { useRouter } from 'next/navigation';
import JobCardForm from '@/components/job-card/JobCardForm';

export default function NewJobCardPage() {
  const router = useRouter();

  return (
    <div className="p-6 lg:pl-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">New Job Card</h1>
        <p className="text-text-secondary text-sm mt-0.5">Fill in the details below to create a job card and generate a PDF.</p>
      </div>
      <JobCardForm onSuccess={(id) => router.push(`/job-cards/${id}`)} />
    </div>
  );
}
