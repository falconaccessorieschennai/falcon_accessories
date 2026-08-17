'use client';

/**
 * Edit Job Card page.
 *
 * - Fetches existing job card data and pre-fills the form.
 * - Allows editing all fields: customer details, vehicle details, accessories.
 * - On save, updates the Firestore document and redirects to the detail page.
 * - Access: admin can edit all; employee can edit own cards only.
 */

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { getJobCard, updateJobCard, getAccessoryCatalog } from '@/lib/firestore';
import CategoryCard from '@/components/job-card/CategoryCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { JobCard, SelectedAccessory, AccessoryCategory, AccessoryDefinition } from '@/types';

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

function timestampToDateStr(ts: { seconds: number } | null): string {
  if (!ts) return '';
  const d = new Date(ts.seconds * 1000);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditJobCardPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [accessoryCatalog, setAccessoryCatalog] = useState<Record<string, AccessoryDefinition[]>>({});
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccessoryCatalog().then(setAccessoryCatalog).catch(() => {});
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

  useEffect(() => {
    if (!id) return;
    getJobCard(id)
      .then((jc) => {
        if (!jc) { router.replace('/employee/dashboard'); return; }
        if (role === 'employee' && jc.createdBy !== user?.uid) {
          router.replace('/employee/dashboard');
          return;
        }
        setJobCard(jc);
        setFields({
          customerName: jc.customerName,
          phoneNumber: jc.phoneNumber,
          vehicleName: jc.vehicleName,
          vehicleNumber: jc.vehicleNumber,
          date: timestampToDateStr(jc.date),
          deliveryDate: timestampToDateStr(jc.deliveryDate),
          employeeName: jc.employeeName,
          notes: jc.notes,
        });
        setAccessories(jc.accessories);
      })
      .catch(() => showToast('Failed to load job card.', 'error'))
      .finally(() => setLoading(false));
  }, [id, user, role, router, showToast]);

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
    if (!jobCard) return;

    setSubmitting(true);
    try {
      const totalAmount = accessories.reduce((sum, a) => sum + a.price * a.quantity, 0);

      await updateJobCard(jobCard.id, {
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
        accessories,
        totalAmount,
      });

      showToast('Job card updated successfully.', 'success');
      router.push(`/job-cards/${jobCard.id}`);
    } catch (err) {
      console.error('JobCard update error:', err);
      setSubmitError('Failed to update job card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:pl-8 max-w-4xl mx-auto">
        <LoadingSkeleton rows={10} height="h-8" />
      </div>
    );
  }

  if (!jobCard) return null;

  return (
    <div className="p-6 lg:pl-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Edit Job Card</h1>
        <p className="text-text-secondary text-sm mt-0.5">Update the job card details below.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Customer & Vehicle Details */}
        <section>
          <h2 className="text-text-primary font-semibold text-base mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerName" className={LABEL_CLASS}>
                Customer Name <span className="text-error">*</span>
              </label>
              <input id="customerName" type="text" autoComplete="off" value={fields.customerName} onChange={(e) => setField('customerName', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="John Doe" />
              {errors.customerName && <p className="text-error text-xs mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label htmlFor="phoneNumber" className={LABEL_CLASS}>
                Phone Number <span className="text-error">*</span>
              </label>
              <input id="phoneNumber" type="tel" autoComplete="off" value={fields.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="+91 98765 43210" />
              {errors.phoneNumber && <p className="text-error text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label htmlFor="vehicleName" className={LABEL_CLASS}>
                Vehicle Name <span className="text-error">*</span>
              </label>
              <input id="vehicleName" type="text" autoComplete="off" value={fields.vehicleName} onChange={(e) => setField('vehicleName', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Maruti Swift" />
              {errors.vehicleName && <p className="text-error text-xs mt-1">{errors.vehicleName}</p>}
            </div>

            <div>
              <label htmlFor="vehicleNumber" className={LABEL_CLASS}>
                Vehicle Number <span className="text-error">*</span>
              </label>
              <input id="vehicleNumber" type="text" autoComplete="off" value={fields.vehicleNumber} onChange={(e) => setField('vehicleNumber', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="TN 01 AB 1234" />
              {errors.vehicleNumber && <p className="text-error text-xs mt-1">{errors.vehicleNumber}</p>}
            </div>

            <div>
              <label htmlFor="date" className={LABEL_CLASS}>
                Date <span className="text-error">*</span>
              </label>
              <input id="date" type="date" value={fields.date} onChange={(e) => setField('date', e.target.value)} disabled={submitting} className={INPUT_CLASS} />
              {errors.date && <p className="text-error text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="deliveryDate" className={LABEL_CLASS}>Delivery Date</label>
              <input id="deliveryDate" type="date" value={fields.deliveryDate} onChange={(e) => setField('deliveryDate', e.target.value)} disabled={submitting} className={INPUT_CLASS} />
            </div>

            <div>
              <label htmlFor="employeeName" className={LABEL_CLASS}>Employee Name</label>
              <input id="employeeName" type="text" autoComplete="off" value={fields.employeeName} onChange={(e) => setField('employeeName', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Staff name" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className={LABEL_CLASS}>Notes</label>
              <textarea id="notes" rows={3} value={fields.notes} onChange={(e) => setField('notes', e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Any additional notes…" />
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
        {submitError && <p role="alert" className="text-error text-sm">{submitError}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border border border-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
