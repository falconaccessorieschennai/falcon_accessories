'use client';

/**
 * Follow-Up Management page — admin only.
 *
 * - Add follow-up: name, phone, car details, fitting details, date, category, voice note.
 * - Filter by date and category (City / Out of City).
 * - Play voice notes inline.
 * - Edit / Delete follow-ups.
 */

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createFollowUp, getFollowUps, updateFollowUp, deleteFollowUp, getAllUsers, FollowUpData } from '@/lib/firestore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Pencil, Mic, MicOff, Play, Square, Phone, Car } from 'lucide-react';

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';
const LABEL_CLASS = 'block text-text-secondary text-sm font-medium mb-1.5';

type Category = 'City' | 'Out of City';
const CATEGORIES: Category[] = ['City', 'Out of City'];

export default function FollowUpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [followUps, setFollowUps] = useState<FollowUpData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [employees, setEmployees] = useState<{ uid: string; email: string; name: string }[]>([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCar, setFormCar] = useState('');
  const [formFitting, setFormFitting] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('City');
  const [formNotes, setFormNotes] = useState('');
  const [formVoiceNote, setFormVoiceNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<FollowUpData | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadFollowUps() {
    setLoading(true);
    const filters: { date?: string; category?: string; createdByEmail?: string } = {};
    if (filterDate) filters.date = filterDate;
    if (filterCategory) filters.category = filterCategory;
    if (filterEmployee) filters.createdByEmail = filterEmployee;
    getFollowUps(Object.keys(filters).length > 0 ? filters : undefined)
      .then(setFollowUps)
      .catch(() => showToast('Failed to load follow-ups.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadFollowUps(); }, [filterDate, filterCategory, filterEmployee]);

  useEffect(() => {
    getAllUsers().then((users) => setEmployees(users.map((u) => ({ uid: u.uid, email: u.email, name: u.name })))).catch(() => {});
  }, []);

  // Voice recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use a supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormVoiceNote(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      showToast('Microphone access denied.', 'error');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function playVoiceNote(dataUrl: string, id: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio();
    audio.src = dataUrl;
    audioRef.current = audio;
    setPlayingId(id);
    audio.play().catch(() => {
      showToast('Unable to play voice note.', 'error');
      setPlayingId(null);
    });
    audio.onended = () => setPlayingId(null);
  }

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  function openAddForm() {
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormCar('');
    setFormFitting('');
    setFormDate('');
    setFormCategory('City');
    setFormNotes('');
    setFormVoiceNote(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(fu: FollowUpData) {
    setEditingId(fu.id || null);
    setFormName(fu.customerName);
    setFormPhone(fu.phoneNumber);
    setFormCar(fu.carDetails);
    setFormFitting(fu.fittingDetails);
    setFormDate(fu.followUpDate);
    setFormCategory(fu.category);
    setFormNotes(fu.notes);
    setFormVoiceNote(fu.voiceNote);
    setFormError(null);
    setShowForm(true);
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) { setFormError('Customer name is required.'); return; }
    if (!formPhone.trim()) { setFormError('Phone number is required.'); return; }
    if (!formDate) { setFormError('Follow-up date is required.'); return; }

    setSubmitting(true);
    try {
      const data = {
        customerName: formName.trim(),
        phoneNumber: formPhone.trim(),
        carDetails: formCar.trim(),
        fittingDetails: formFitting.trim(),
        followUpDate: formDate,
        category: formCategory,
        voiceNote: formVoiceNote,
        notes: formNotes.trim(),
        createdBy: user?.uid || '',
        createdByEmail: user?.email || '',
      };

      if (editingId) {
        await updateFollowUp(editingId, data);
        showToast('Follow-up updated.', 'success');
      } else {
        await createFollowUp(data);
        showToast('Follow-up added.', 'success');
      }
      setShowForm(false);
      loadFollowUps();
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteFollowUp(deleteTarget.id);
      showToast('Follow-up deleted.', 'success');
      setDeleteTarget(null);
      loadFollowUps();
    } catch {
      showToast('Failed to delete.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="p-6 lg:pl-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Follow-Ups</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {loading ? 'Loading…' : `${followUps.length} follow-up${followUps.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Follow-Up
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-surface-2 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
          title="Filter by date"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category | '')}
          className="bg-surface-2 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="bg-surface-2 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => <option key={emp.uid} value={emp.email}>{emp.name} ({emp.email})</option>)}
        </select>
        {(filterDate || filterCategory || filterEmployee) && (
          <button
            onClick={() => { setFilterDate(''); setFilterCategory(''); setFilterEmployee(''); }}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={5} height="h-20" />
      ) : followUps.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-lg">No follow-ups found.</p>
          <p className="text-sm mt-1">{filterDate || filterCategory ? 'Try adjusting your filters.' : 'Add your first follow-up to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-text-primary font-semibold text-sm">{fu.customerName}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      fu.category === 'City'
                        ? 'bg-info/15 text-info border-info/30'
                        : 'bg-warning/15 text-warning border-warning/30'
                    }`}>
                      {fu.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-text-secondary text-xs flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{fu.phoneNumber}</span>
                    <span className="flex items-center gap-1"><Car className="w-3 h-3" />{fu.carDetails || '—'}</span>
                    <span>📅 {formatDate(fu.followUpDate)}</span>
                    {fu.createdByEmail && <span className="text-text-muted">by {fu.createdByEmail}</span>}
                  </div>
                  {fu.fittingDetails && (
                    <p className="text-text-muted text-xs mt-1">Fitting: {fu.fittingDetails}</p>
                  )}
                  {fu.notes && (
                    <p className="text-text-muted text-xs mt-1">Notes: {fu.notes}</p>
                  )}
                  {fu.voiceNote && (
                    <button
                      onClick={() => playingId === fu.id ? stopPlayback() : playVoiceNote(fu.voiceNote!, fu.id!)}
                      className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary-400 transition-colors"
                    >
                      {playingId === fu.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {playingId === fu.id ? 'Stop' : 'Play Voice Note'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEditForm(fu)} title="Edit" className="p-2 rounded-lg text-text-secondary hover:text-info hover:bg-info/10 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(fu)} title="Delete" className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-text-primary font-semibold text-base mb-4">
                {editingId ? 'Edit Follow-Up' : 'Add Follow-Up'}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Customer Name *</label>
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Customer name" autoFocus />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Phone Number *</label>
                    <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Car Details</label>
                    <input type="text" value={formCar} onChange={(e) => setFormCar(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Car model / number" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Fitting Details</label>
                    <input type="text" value={formFitting} onChange={(e) => setFormFitting(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="What they want fitted" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Follow-Up Date *</label>
                    <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} disabled={submitting} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Category</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)} disabled={submitting} className={INPUT_CLASS}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Notes</label>
                  <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Additional notes…" />
                </div>

                {/* Voice Note */}
                <div>
                  <label className={LABEL_CLASS}>Voice Note</label>
                  <div className="flex items-center gap-3">
                    {!recording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-2 border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                        Record
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-error/10 border border-error/30 text-error transition-colors animate-pulse"
                      >
                        <MicOff className="w-4 h-4" />
                        Stop Recording
                      </button>
                    )}
                    {formVoiceNote && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playVoiceNote(formVoiceNote, 'form')}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary-400 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Play
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormVoiceNote(null)}
                          className="text-xs text-text-muted hover:text-error transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {formError && <p className="text-error text-sm">{formError}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
                    {submitting ? 'Saving…' : editingId ? 'Update' : 'Add Follow-Up'}
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
          message={`Delete follow-up for "${deleteTarget.customerName}"? This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
