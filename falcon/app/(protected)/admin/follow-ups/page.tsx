'use client';

/**
 * Follow-Up Management page — admin only.
 *
 * - Add follow-up with status, optional name, history tracking.
 * - Filter by date, category, status, employee.
 * - Add follow-up entries (history) to track the customer journey.
 * - Voice notes on each entry.
 */

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createFollowUp, getFollowUps, updateFollowUp, deleteFollowUp, addFollowUpHistory, getAllUsers, FollowUpData, FollowUpStatus, FollowUpHistoryEntry } from '@/lib/firestore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Pencil, Mic, MicOff, Play, Square, Phone, Car, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const INPUT_CLASS = 'w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition';
const LABEL_CLASS = 'block text-text-secondary text-sm font-medium mb-1.5';

type Category = 'City' | 'Out of City';
const CATEGORIES: Category[] = ['City', 'Out of City'];
const STATUSES: FollowUpStatus[] = ['Called', 'Not Answered', 'Interested', 'Not Interested', 'Rescheduled', 'Converted'];

const STATUS_COLORS: Record<FollowUpStatus, string> = {
  'Called': 'bg-info/15 text-info border-info/30',
  'Not Answered': 'bg-warning/15 text-warning border-warning/30',
  'Interested': 'bg-success/15 text-success border-success/30',
  'Not Interested': 'bg-error/15 text-error border-error/30',
  'Rescheduled': 'bg-primary/15 text-primary border-primary/30',
  'Converted': 'bg-success/15 text-success border-success/30',
};

export default function FollowUpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [followUps, setFollowUps] = useState<FollowUpData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterStatus, setFilterStatus] = useState<FollowUpStatus | ''>('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [employees, setEmployees] = useState<{ uid: string; email: string; name: string }[]>([]);

  // Form - new follow-up
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCar, setFormCar] = useState('');
  const [formFitting, setFormFitting] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('City');
  const [formStatus, setFormStatus] = useState<FollowUpStatus>('Called');
  const [formNotes, setFormNotes] = useState('');
  const [formVoiceNote, setFormVoiceNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // History entry form
  const [historyTarget, setHistoryTarget] = useState<FollowUpData | null>(null);
  const [historyStatus, setHistoryStatus] = useState<FollowUpStatus>('Called');
  const [historyNotes, setHistoryNotes] = useState('');
  const [historyNextDate, setHistoryNextDate] = useState('');
  const [historyVoiceNote, setHistoryVoiceNote] = useState<string | null>(null);
  const [historySubmitting, setHistorySubmitting] = useState(false);

  // Expanded history
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<FollowUpData | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadFollowUps() {
    setLoading(true);
    const filters: { date?: string; category?: string; status?: string; createdByEmail?: string } = {};
    if (filterDate) filters.date = filterDate;
    if (filterCategory) filters.category = filterCategory;
    if (filterStatus) filters.status = filterStatus;
    if (filterEmployee) filters.createdByEmail = filterEmployee;
    getFollowUps(Object.keys(filters).length > 0 ? filters : undefined)
      .then(setFollowUps)
      .catch(() => showToast('Failed to load follow-ups.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadFollowUps(); }, [filterDate, filterCategory, filterStatus, filterEmployee]);
  useEffect(() => { getAllUsers().then((users) => setEmployees(users.map((u) => ({ uid: u.uid, email: u.email, name: u.name })))).catch(() => {}); }, []);

  // Voice recording
  async function startRecording(target: 'form' | 'history') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (target === 'form') setFormVoiceNote(reader.result as string);
          else setHistoryVoiceNote(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch { showToast('Microphone access denied.', 'error'); }
  }

  function stopRecording() { if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false); } }

  function playVoiceNote(dataUrl: string, id: string) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(); audio.src = dataUrl; audioRef.current = audio; setPlayingId(id);
    audio.play().catch(() => { showToast('Unable to play.', 'error'); setPlayingId(null); });
    audio.onended = () => setPlayingId(null);
  }

  function stopPlayback() { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setPlayingId(null); }

  function openAddForm() {
    setEditingId(null); setFormName(''); setFormPhone(''); setFormCar(''); setFormFitting('');
    setFormDate(''); setFormCategory('City'); setFormStatus('Called'); setFormNotes(''); setFormVoiceNote(null); setFormError(null); setShowForm(true);
  }

  function openEditForm(fu: FollowUpData) {
    setEditingId(fu.id || null); setFormName(fu.customerName); setFormPhone(fu.phoneNumber);
    setFormCar(fu.carDetails); setFormFitting(fu.fittingDetails); setFormDate(fu.followUpDate);
    setFormCategory(fu.category); setFormStatus(fu.status); setFormNotes(fu.notes); setFormVoiceNote(fu.voiceNote); setFormError(null); setShowForm(true);
  }

  function openHistoryForm(fu: FollowUpData) {
    setHistoryTarget(fu); setHistoryStatus('Called'); setHistoryNotes(''); setHistoryNextDate(''); setHistoryVoiceNote(null);
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault(); setFormError(null);
    if (!formPhone.trim()) { setFormError('Phone number is required.'); return; }
    if (!formDate) { setFormError('Follow-up date is required.'); return; }

    setSubmitting(true);
    try {
      const data = {
        customerName: formName.trim(), phoneNumber: formPhone.trim(), carDetails: formCar.trim(),
        fittingDetails: formFitting.trim(), followUpDate: formDate, category: formCategory,
        status: formStatus, voiceNote: formVoiceNote, notes: formNotes.trim(),
        history: [] as FollowUpHistoryEntry[], createdBy: user?.uid || '', createdByEmail: user?.email || '',
      };
      if (editingId) {
        const { history, createdBy, createdByEmail, ...updateData } = data;
        await updateFollowUp(editingId, updateData);
        showToast('Follow-up updated.', 'success');
      } else {
        await createFollowUp(data);
        showToast('Follow-up added.', 'success');
      }
      setShowForm(false); loadFollowUps();
    } catch { setFormError('Failed to save.'); }
    finally { setSubmitting(false); }
  }

  async function handleHistorySubmit(e: FormEvent) {
    e.preventDefault();
    if (!historyTarget?.id) return;
    if (!historyNextDate) { showToast('Next follow-up date is required.', 'error'); return; }

    setHistorySubmitting(true);
    try {
      const entry: FollowUpHistoryEntry = {
        date: new Date().toISOString().split('T')[0],
        status: historyStatus,
        notes: historyNotes.trim(),
        voiceNote: historyVoiceNote,
      };
      await addFollowUpHistory(historyTarget.id, entry, historyNextDate, historyStatus);
      showToast('Follow-up entry added.', 'success');
      setHistoryTarget(null); loadFollowUps();
    } catch { showToast('Failed to add entry.', 'error'); }
    finally { setHistorySubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try { await deleteFollowUp(deleteTarget.id); showToast('Deleted.', 'success'); setDeleteTarget(null); loadFollowUps(); }
    catch { showToast('Failed to delete.', 'error'); }
    finally { setDeleting(false); }
  }

  function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

  return (
    <div className="p-6 lg:pl-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Follow-Ups</h1>
          <p className="text-text-secondary text-sm mt-0.5">{loading ? 'Loading…' : `${followUps.length} follow-up${followUps.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button onClick={openAddForm} className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Follow-Up
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={INPUT_CLASS} title="Filter by date" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as Category | '')} className={INPUT_CLASS}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FollowUpStatus | '')} className={INPUT_CLASS}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className={INPUT_CLASS}>
          <option value="">All Employees</option>
          {employees.map((emp) => <option key={emp.uid} value={emp.email}>{emp.name}</option>)}
        </select>
        {(filterDate || filterCategory || filterStatus || filterEmployee) && (
          <button onClick={() => { setFilterDate(''); setFilterCategory(''); setFilterStatus(''); setFilterEmployee(''); }} className="text-text-muted hover:text-text-primary text-sm transition-colors">Clear filters</button>
        )}
      </div>

      {/* List */}
      {loading ? <LoadingSkeleton rows={5} height="h-24" /> : followUps.length === 0 ? (
        <div className="text-center py-16 text-text-muted"><p className="text-lg">No follow-ups found.</p></div>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {fu.customerName && <h3 className="text-text-primary font-semibold text-sm">{fu.customerName}</h3>}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[fu.status]}`}>{fu.status}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${fu.category === 'City' ? 'bg-info/15 text-info border-info/30' : 'bg-warning/15 text-warning border-warning/30'}`}>{fu.category}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-text-secondary text-xs flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{fu.phoneNumber}</span>
                      {fu.carDetails && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{fu.carDetails}</span>}
                      <span>📅 Next: {fmtDate(fu.followUpDate)}</span>
                      {fu.createdByEmail && <span className="text-text-muted">by {fu.createdByEmail.split('@')[0]}</span>}
                    </div>
                    {fu.fittingDetails && <p className="text-text-muted text-xs mt-1">Fitting: {fu.fittingDetails}</p>}
                    {fu.notes && <p className="text-text-muted text-xs mt-1">Notes: {fu.notes}</p>}
                    {fu.voiceNote && (
                      <button onClick={() => playingId === fu.id ? stopPlayback() : playVoiceNote(fu.voiceNote!, fu.id!)} className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary-400 transition-colors">
                        {playingId === fu.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />} {playingId === fu.id ? 'Stop' : 'Play Voice Note'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openHistoryForm(fu)} title="Add entry" className="p-2 rounded-lg text-text-secondary hover:text-success hover:bg-success/10 transition-colors"><Clock className="w-4 h-4" /></button>
                    <button onClick={() => openEditForm(fu)} title="Edit" className="p-2 rounded-lg text-text-secondary hover:text-info hover:bg-info/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(fu)} title="Delete" className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* History toggle */}
              <div className="border-t border-border">
                <button onClick={() => setExpandedId(expandedId === fu.id ? null : fu.id!)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors">
                  <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Follow-up Journey {fu.history && fu.history.length > 0 ? `(${fu.history.length})` : ''}</span>
                  {expandedId === fu.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {expandedId === fu.id && (
                  <div className="px-4 pb-3">
                    {(!fu.history || fu.history.length === 0) ? (
                      <p className="text-text-muted text-xs py-2">No history yet. Click the clock icon to add an entry.</p>
                    ) : (
                      <div className="space-y-2">
                        {fu.history.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 pl-2 border-l-2 border-primary/30">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-text-primary text-xs font-medium">{fmtDate(h.date)}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[h.status]}`}>{h.status}</span>
                              </div>
                              {h.notes && <p className="text-text-muted text-xs mt-0.5">{h.notes}</p>}
                              {h.voiceNote && (
                                <button onClick={() => playingId === `h-${fu.id}-${i}` ? stopPlayback() : playVoiceNote(h.voiceNote!, `h-${fu.id}-${i}`)} className="flex items-center gap-1 mt-1 text-[10px] text-primary hover:text-primary-400">
                                  {playingId === `h-${fu.id}-${i}` ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />} Voice Note
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Follow-Up Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-text-primary font-semibold text-base mb-4">{editingId ? 'Edit Follow-Up' : 'Add Follow-Up'}</h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={LABEL_CLASS}>Customer Name</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Optional" autoFocus /></div>
                  <div><label className={LABEL_CLASS}>Phone Number *</label><input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="+91 98765 43210" /></div>
                  <div><label className={LABEL_CLASS}>Car Details</label><input type="text" value={formCar} onChange={(e) => setFormCar(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Car model / number" /></div>
                  <div><label className={LABEL_CLASS}>Fitting Details</label><input type="text" value={formFitting} onChange={(e) => setFormFitting(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="What they want" /></div>
                  <div><label className={LABEL_CLASS}>Follow-Up Date *</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} disabled={submitting} className={INPUT_CLASS} /></div>
                  <div><label className={LABEL_CLASS}>Category</label><select value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)} disabled={submitting} className={INPUT_CLASS}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className={LABEL_CLASS}>Status</label><select value={formStatus} onChange={(e) => setFormStatus(e.target.value as FollowUpStatus)} disabled={submitting} className={INPUT_CLASS}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div><label className={LABEL_CLASS}>Notes</label><textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} disabled={submitting} className={INPUT_CLASS} placeholder="Additional notes…" /></div>
                <div>
                  <label className={LABEL_CLASS}>Voice Note</label>
                  <div className="flex items-center gap-3">
                    {!recording ? <button type="button" onClick={() => startRecording('form')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-2 border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"><Mic className="w-4 h-4" />Record</button>
                    : <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-error/10 border border-error/30 text-error animate-pulse"><MicOff className="w-4 h-4" />Stop</button>}
                    {formVoiceNote && <div className="flex items-center gap-2"><button type="button" onClick={() => playVoiceNote(formVoiceNote, 'form')} className="text-xs text-primary"><Play className="w-3 h-3 inline" /> Play</button><button type="button" onClick={() => setFormVoiceNote(null)} className="text-xs text-text-muted hover:text-error">Remove</button></div>}
                  </div>
                </div>
                {formError && <p className="text-error text-sm">{formError}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">{submitting ? 'Saving…' : editingId ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Add History Entry Modal */}
      {historyTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryTarget(null)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-text-primary font-semibold text-base mb-1">Add Follow-Up Entry</h3>
              <p className="text-text-secondary text-sm mb-4">
                {historyTarget.customerName || historyTarget.phoneNumber} — record today&apos;s interaction
              </p>
              <form onSubmit={handleHistorySubmit} className="space-y-4">
                <div><label className={LABEL_CLASS}>Status *</label><select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value as FollowUpStatus)} className={INPUT_CLASS}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className={LABEL_CLASS}>Next Follow-Up Date *</label><input type="date" value={historyNextDate} onChange={(e) => setHistoryNextDate(e.target.value)} className={INPUT_CLASS} /></div>
                <div><label className={LABEL_CLASS}>Notes</label><textarea rows={2} value={historyNotes} onChange={(e) => setHistoryNotes(e.target.value)} className={INPUT_CLASS} placeholder="What happened on this call…" /></div>
                <div>
                  <label className={LABEL_CLASS}>Voice Note</label>
                  <div className="flex items-center gap-3">
                    {!recording ? <button type="button" onClick={() => startRecording('history')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-2 border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"><Mic className="w-4 h-4" />Record</button>
                    : <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-error/10 border border-error/30 text-error animate-pulse"><MicOff className="w-4 h-4" />Stop</button>}
                    {historyVoiceNote && <div className="flex items-center gap-2"><button type="button" onClick={() => playVoiceNote(historyVoiceNote, 'hist-form')} className="text-xs text-primary"><Play className="w-3 h-3 inline" /> Play</button><button type="button" onClick={() => setHistoryVoiceNote(null)} className="text-xs text-text-muted hover:text-error">Remove</button></div>}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setHistoryTarget(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border transition-colors">Cancel</button>
                  <button type="submit" disabled={historySubmitting} className="bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">{historySubmitting ? 'Saving…' : 'Add Entry'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog message={`Delete follow-up for "${deleteTarget.customerName || deleteTarget.phoneNumber}"?`} confirmLabel={deleting ? 'Deleting…' : 'Delete'} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
