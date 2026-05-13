'use client';

/**
 * Sidebar — collapsible navigation for the protected layout.
 *
 * - Desktop: fixed left sidebar, always visible.
 * - Mobile: slide-in drawer toggled by a hamburger button.
 * - Shows role-appropriate nav links using Lucide icons.
 * - Logout button calls AuthContext.logout.
 *
 * Requirements: 1.6, 10.3, 10.7
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import ThemeToggle from '@/components/ui/ThemeToggle';

// ---------------------------------------------------------------------------
// Nav link definitions per role
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/admin/dashboard',  icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'New Job Card', href: '/job-cards/new',   icon: <FilePlus className="w-5 h-5" /> },
  { label: 'Employees',   href: '/admin/employees',  icon: <Users className="w-5 h-5" /> },
  { label: 'Settings',    href: '/admin/settings',   icon: <Settings className="w-5 h-5" /> },
];

const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/employee/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'New Job Card', href: '/job-cards/new',      icon: <FilePlus className="w-5 h-5" /> },
  { label: 'Settings',     href: '/employee/settings',  icon: <Settings className="w-5 h-5" /> },
];

// ---------------------------------------------------------------------------
// Shared nav content
// ---------------------------------------------------------------------------

function NavContent({ onClose }: { onClose?: () => void }) {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const navItems = role === 'admin' ? ADMIN_NAV : EMPLOYEE_NAV;

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">FA</span>
        </div>
        <div className="min-w-0">
          <p className="text-text-primary font-semibold text-sm leading-tight truncate">
            Falcon Accessories
          </p>
          <p className="text-text-muted text-xs capitalize">{role}</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto text-text-muted hover:text-text-primary transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-text-muted text-xs">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-error transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-surface border-r border-border z-20">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-40 w-72 bg-surface border-r border-border lg:hidden"
            >
              <NavContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
