'use client';

/**
 * Accessories Management page — admin only.
 *
 * - View all accessories grouped by category.
 * - Add new accessory (name, category, variants).
 * - Edit existing accessory.
 * - Delete accessory.
 * - Seed button to populate Firestore with default static data.
 */

import { useEffect, useState, FormEvent } from 'react';
import { getAccessoryCatalog, addAccessory, updateAccessory, deleteAccessory, seedAccessories } from '@/lib/firestore';
import { SEED_ACCESSORY_CATALOG } from '@/lib/accessories';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { Plus, Pencil, Trash2, Database } from 'lucide-react';
import type { AccessoryDefinition } from '@/types';

interface AccessoryWithCategory extends AccessoryDefinition {
  category: string;
}

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';
const LABEL_CLASS = 'block text-text-secondary text-sm font-medium mb-1.5';

export default function AccessoriesPage() {
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<Record<string, AccessoryDefinition[]>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formVariants, setFormVariants] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<AccessoryWithCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadCatalog() {
    setLoading(true);
    getAccessoryCatalog()
      .then(setCatalog)
      .catch(() => showToast('Failed to load accessories.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCatalog(); }, []);

  const categories = Object.keys(catalog);
  const totalCount = Object.values(catalog).reduce((s, arr) => s + arr.length, 0);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedAccessories(SEED_ACCESSORY_CATALOG);
      showToast('Accessories seeded successfully.', 'success');
      loadCatalog();
    } catch {
      showToast('Failed to seed accessories.', 'error');
    } finally {
      setSeeding(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormName('');
    setFormCategory(categories[0] || '');
    setFormVariants('');
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(acc: AccessoryWithCategory) {
    setEditingId(acc.id);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setFormVariants(acc.variants.join(', '));
    setFormError(null);
    setShowForm(true);
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) { setFormError('Name is required.'); return; }
    if (!formCategory.trim()) { setFormError('Category is required.'); return; }

    const variants = formVariants.split(',').map((v) => v.trim()).filter(Boolean);
    const id = editingId || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setSubmitting(true);
    try {
      if (editingId) {
        await updateAccessory(editingId, { name: formName.trim(), category: formCategory.trim(), variants });
        showToast('Accessory updated.', 'success');
      } else {
        await addAccessory({ id, name: formName.trim(), category: formCategory.trim(), variants });
        showToast('Accessory added.', 'success');
      }
      setShowForm(false);
      loadCatalog();
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccessory(deleteTarget.id);
      showToast('Accessory deleted.', 'success');
      setDeleteTarget(null);
      loadCatalog();
    } catch {
      showToast('Failed to delete accessory.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 lg:pl-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Accessories Management</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {loading ? 'Loading…' : `${totalCount} accessories in ${categories.length} categories`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalCount === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 bg-surface-2 hover:bg-border border border-border text-text-primary font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {seeding ? 'Seeding…' : 'Seed Default Data'}
            </button>
          )}
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Accessory
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} height="h-12" />
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-lg">No accessories in database.</p>
          <p className="text-sm mt-1">Click "Seed Default Data" to populate with standard accessories.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <section key={cat} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-surface-2 border-b border-border">
                <h2 className="text-text-primary font-semibold text-sm">{cat} ({catalog[cat].length})</h2>
              </div>
              <div className="divide-y divide-border">
                {catalog[cat].map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium">{acc.name}</p>
                      {acc.variants.length > 0 && (
                        <p className="text-text-muted text-xs mt-0.5 truncate">
                          Variants: {acc.variants.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditForm({ ...acc, category: cat })}
                        title="Edit"
                        className="p-2 rounded-lg text-text-secondary hover:text-info hover:bg-info/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ ...acc, category: cat })}
                        title="Delete"
                        className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-text-primary font-semibold text-base mb-4">
                {editingId ? 'Edit Accessory' : 'Add Accessory'}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Accessory name" autoFocus />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="e.g. Safety & Security" list="category-list" />
                  <datalist id="category-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Variants (comma-separated)</label>
                  <input type="text" value={formVariants} onChange={(e) => setFormVariants(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="e.g. Basic, Premium, Ultra" />
                  <p className="text-text-muted text-xs mt-1">Leave empty if no variants.</p>
                </div>
                {formError && <p className="text-error text-sm">{formError}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
                    {submitting ? 'Saving…' : editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}" from ${deleteTarget.category}? This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
