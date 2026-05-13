'use client';

/**
 * Protected layout — auth/role guard + sidebar + page transition.
 *
 * - Redirects unauthenticated users to /login.
 * - Redirects employees attempting /admin/* routes to /employee/dashboard.
 * - Renders Sidebar and wraps page content with a Framer Motion fade transition.
 *
 * Requirements: 2.3, 2.4, 2.5, 10.4, 10.7, 10.12
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/ui/Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (role === 'employee' && pathname.startsWith('/admin')) {
      router.replace('/employee/dashboard');
    }
  }, [loading, user, role, pathname, router]);

  if (loading || !user) return null;
  if (role === 'employee' && pathname.startsWith('/admin')) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      {/* Main content — offset for desktop sidebar */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
