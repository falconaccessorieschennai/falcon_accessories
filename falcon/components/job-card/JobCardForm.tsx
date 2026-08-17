'use client';

/**
 * JobCardForm — full create form for a job card.
 *
 * - Customer detail fields: Customer Name, Phone Number, Vehicle Name,
 *   Vehicle Number, Date, Delivery Date, Employee Name, Notes.
 * - Four CategoryCard sections for all accessory categories.
 * - Client-side validation for required fields with inline error messages.
 * - On valid submit: calls createJobCard, then triggers PDF generation.
 * - Mobile-responsive layout with touch-optimized inputs.
 *
 * Requirements: 3.1, 3.2, 3.11, 3.12, 3.13, 3.14, 3.15
 */

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { createJobCard, getAccessoryCatalog } from '@/lib/firestore';
import { generateJobCardPDF } from '../pdf/generatePDF';
import CategoryCard from './CategoryCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { SelectedAccessory, AccessoryCategory, AccessoryDefinition } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormFields {
  customerName: string;
  phoneNumber: string;
  vehicleName: string;
  vehicleNumber: string;
  date: string;
  deliveryDate: string;
  employeeName: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormFields, string>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: (keyof FormFields)[] = [
  'customerName',
  'phoneNumber',
  'vehicleName',
  'vehicleNumber',
  'date',
];

const FIELD_LABELS: Record<keyof FormFields, string> = {
  customerName: 'Customer Name',
  phoneNumber: 'Phone Number',
  vehicleName: 'Vehicle Name',
  vehicleNumber: 'Vehicle Number',
  date: 'Date',
  deliveryDate: 'Delivery Date',
  employeeName: 'Employee Name',
  notes: 'Notes',
};

const INPUT_CLASS =
  'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';

const LABEL_CLASS = 'block text-text-secondary text-sm font-medium mb-1.5';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JobCardFormProps {
  /** Called after successful save with the new job card id. */
  onSuccess?: (id: string) => void;
}

export default function JobCardForm({ onSuccess }: JobCardFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [accessoryCatalog, setAccessoryCatalog] = useState<Record<string, AccessoryDefinition[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    getAccessoryCatalog()
      .then(setAccessoryCatalog)
      .catch(() => setAccessoryCatalog({}))
      .finally(() => setCatalogLoading(false));
  }, []);

  const CATEGORIES = Object.keys(accessoryCatalog) as AccessoryCategory[];

  const [fields, setFields] = useState<FormFields>({
    customerName: '',
    phoneNumber: '',
    vehicleName: '',
    vehicleNumber: '',
    date: '',
    deliveryDate: '',
    employeeName: '',
    notes: '',
  });

  const [accessories, setAccessories] = useState<SelectedAccessory[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    for (const key of REQUIRED_FIELDS) {
      if (!fields[key].trim()) {
        newErrors[key] = `${FIELD_LABELS[key]} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function getAccessoriesForCategory(cat: AccessoryCategory) {
    return accessories.filter((a) => a.category === cat);
  }

  function handleCategoryChange(cat: AccessoryCategory, updated: SelectedAccessory[]) {
    setAccessories((prev) => [
      ...prev.filter((a) => a.category !== cat),
      ...updated,
    ]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;
    if (!user) {
      setSubmitError('You must be logged in to create a job card.');
      return;
    }

    setSubmitting(true);
    try {
      const totalAmount = accessories.reduce((sum, a) => sum + a.price * a.quantity, 0);

      const id = await createJobCard({
        customerName: fields.customerName.trim(),
        phoneNumber: fields.phoneNumber.trim(),
        vehicleName: fields.vehicleName.trim(),
        vehicleNumber: fields.vehicleNumber.trim(),
        date: Timestamp.fromDate(new Date(fields.date)) as any,
        deliveryDate: fields.deliveryDate
          ? Timestamp.fromDate(new Date(fields.deliveryDate)) as any
          : null,
        employeeName: fields.employeeName.trim(),
        notes: fields.notes.trim(),
        status: 'Pending',
        accessories,
        totalAmount,
        createdBy: user.uid,
      });

      // Trigger PDF generation after save
      generateJobCardPDF({
        jobCard: {
          id,
          customerName: fields.customerName.trim(),
          phoneNumber: fields.phoneNumber.trim(),
          vehicleName: fields.vehicleName.trim(),
          vehicleNumber: fields.vehicleNumber.trim(),
          date: Timestamp.fromDate(new Date(fields.date)) as any,
          deliveryDate: fields.deliveryDate
            ? Timestamp.fromDate(new Date(fields.deliveryDate)) as any
            : null,
          employeeName: fields.employeeName.trim(),
          notes: fields.notes.trim(),
          status: 'Pending',
          accessories,
          totalAmount,
          createdBy: user.uid,
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
        },
        accessories,
        totalAmount,
      });

      if (onSuccess) {
        onSuccess(id);
      } else {
        router.push(`/job-cards/${id}`);
      }
    } catch (err) {
      console.error('JobCard save error:', err);
      setSubmitError('Failed to save job card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (catalogLoading) {
    return <LoadingSkeleton rows={6} height="h-10" />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Customer & Vehicle Details */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className={LABEL_CLASS}>
              Customer Name <span className="text-error">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              autoComplete="off"
              value={fields.customerName}
              onChange={(e) => setField('customerName', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="John Doe"
            />
            {errors.customerName && (
              <p className="text-error text-xs mt-1">{errors.customerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className={LABEL_CLASS}>
              Phone Number <span className="text-error">*</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              autoComplete="off"
              value={fields.phoneNumber}
              onChange={(e) => setField('phoneNumber', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="+91 98765 43210"
            />
            {errors.phoneNumber && (
              <p className="text-error text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Vehicle Name */}
          <div>
            <label htmlFor="vehicleName" className={LABEL_CLASS}>
              Vehicle Name <span className="text-error">*</span>
            </label>
            <input
              id="vehicleName"
              type="text"
              autoComplete="off"
              value={fields.vehicleName}
              onChange={(e) => setField('vehicleName', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="Maruti Swift"
            />
            {errors.vehicleName && (
              <p className="text-error text-xs mt-1">{errors.vehicleName}</p>
            )}
          </div>

          {/* Vehicle Number */}
          <div>
            <label htmlFor="vehicleNumber" className={LABEL_CLASS}>
              Vehicle Number <span className="text-error">*</span>
            </label>
            <input
              id="vehicleNumber"
              type="text"
              autoComplete="off"
              value={fields.vehicleNumber}
              onChange={(e) => setField('vehicleNumber', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="TN 01 AB 1234"
            />
            {errors.vehicleNumber && (
              <p className="text-error text-xs mt-1">{errors.vehicleNumber}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className={LABEL_CLASS}>
              Date <span className="text-error">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={fields.date}
              onChange={(e) => setField('date', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
            {errors.date && (
              <p className="text-error text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div>
            <label htmlFor="deliveryDate" className={LABEL_CLASS}>
              Delivery Date
            </label>
            <input
              id="deliveryDate"
              type="date"
              value={fields.deliveryDate}
              onChange={(e) => setField('deliveryDate', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
          </div>

          {/* Employee Name */}
          <div>
            <label htmlFor="employeeName" className={LABEL_CLASS}>
              Employee Name
            </label>
            <input
              id="employeeName"
              type="text"
              autoComplete="off"
              value={fields.employeeName}
              onChange={(e) => setField('employeeName', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="Staff name"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={LABEL_CLASS}>
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={fields.notes}
              onChange={(e) => setField('notes', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
              placeholder="Any additional notes…"
            />
          </div>
        </div>
      </section>

      {/* Accessories */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-4">Accessories</h2>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat}
              title={cat}
              category={cat}
              accessories={accessoryCatalog[cat]}
              selected={getAccessoriesForCategory(cat)}
              onChange={(updated) => handleCategoryChange(cat, updated)}
            />
          ))}
        </div>
      </section>

      {/* Total */}
      {accessories.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-surface border border-border rounded-xl px-6 py-4 text-right">
            <p className="text-text-secondary text-sm">Total Amount</p>
            <p className="text-text-primary text-2xl font-bold mt-0.5">
              ₹{accessories.reduce((s, a) => s + a.price * a.quantity, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <p role="alert" className="text-error text-sm">
          {submitError}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors"
        >
          {submitting ? 'Saving…' : 'Save & Download PDF'}
        </button>
      </div>
    </form>
  );
}
