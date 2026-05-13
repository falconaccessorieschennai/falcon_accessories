'use client';

/**
 * Toast — context-based notification system with Framer Motion slide-in.
 *
 * Usage:
 *   1. Wrap the app with <ToastProvider>.
 *   2. Call `useToast().showToast(message, type)` from any client component.
 *
 * Supports: 'success' | 'error' | 'info'
 *
 * Requirements: 9.4, 10.6
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

// ---------------------------------------------------------------------------
// Styles per type
// ---------------------------------------------------------------------------

const TOAST_STYLES: Record<ToastType, { container: string; icon: React.ReactNode }> = {
  success: {
    container: 'bg-surface border-success/40 text-text-primary',
    icon: <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />,
  },
  error: {
    container: 'bg-surface border-error/40 text-text-primary',
    icon: <XCircle className="w-5 h-5 text-error flex-shrink-0" />,
  },
  info: {
    container: 'bg-surface border-info/40 text-text-primary',
    icon: <Info className="w-5 h-5 text-info flex-shrink-0" />,
  },
};

const AUTO_DISMISS_MS = 4000;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { container, icon } = TOAST_STYLES[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${container}`}
                role="alert"
              >
                {icon}
                <p className="flex-1 text-sm leading-snug">{toast.message}</p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-text-muted hover:text-text-primary transition-colors mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
