'use client';

/**
 * ConfirmDialog — modal confirmation prompt.
 *
 * Props:
 *   message   — text shown inside the dialog
 *   onConfirm — called when the user clicks "Confirm"
 *   onCancel  — called when the user clicks "Cancel" or the backdrop
 *
 * Requirements: 6.6, 8.5
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** When true the dialog is visible. */
  open?: boolean;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  open = true,
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-message"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <p
                  id="confirm-dialog-message"
                  className="text-text-primary text-sm leading-relaxed pt-1.5"
                >
                  {message}
                </p>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-error hover:bg-primary-700 transition-colors"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
